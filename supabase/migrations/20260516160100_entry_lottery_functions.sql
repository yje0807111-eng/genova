-- Phase 2 of the entry-lottery system: server-side logic.
--
-- Five additions:
--   1. issue_lottery_ticket(user_id, video_id)
--        Atomic ticket issuance + auto-entry to all currently-active
--        competitions. Caller is the Server Action that wraps the
--        Mux upload completion (see Phase 2B).
--
--   2. draw_competition_winners(competition_id, admin_id)
--        Picks 5 distinct users from the eligible pool using a
--        deterministic-from-seed order, inserts winners, flips
--        winning tickets to status='winner', and logs the draw.
--
--   3. redraw_winner_slot(competition_id, prize_tier, reason, admin_id)
--        Invalidates the prior winner of a slot, picks a replacement
--        excluding ALL prior winner user_ids (including invalidated
--        ones — those users are permanently barred from this
--        competition per redraw policy), logs as is_redraw.
--
--   4. expire_unclaimed_winners()
--        Cron-friendly: flips pending winners whose info_deadline
--        passed to claim_status='expired'.
--
--   5. current_month_ticket_counts view
--        Per-user remaining-tickets data for the profile/upload-
--        page counter UI. security_invoker=true so RLS applies.
--
-- All functions are SECURITY DEFINER with an explicit
-- search_path=public to avoid search-path tampering on call sites.

-- ===================================================================
-- 1. Issue a lottery ticket + auto-enter every active competition.
-- ===================================================================

create or replace function public.issue_lottery_ticket(
  p_user_id uuid,
  p_video_id text
)
returns table (
  ticket_id uuid,
  monthly_count integer,
  entries_created integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_video record;
  v_month_key text;
  v_count integer;
  v_ticket_id uuid;
  v_entries integer := 0;
begin
  -- Serialize issuance for this user — prevents two parallel uploads
  -- from both seeing count=4 and both inserting (race → 6 tickets).
  perform pg_advisory_xact_lock(hashtext('lottery_issue:' || p_user_id::text));

  -- Pull the relevant video columns in one shot.
  select id, uploaded_by, original_attestation_at, duration_seconds, visibility
  into v_video
  from public.videos
  where id = p_video_id;

  if not found then
    raise exception 'video_not_found: %', p_video_id
      using errcode = 'P0002';
  end if;
  if v_video.uploaded_by is distinct from p_user_id then
    raise exception 'not_owner'
      using errcode = 'P0001';
  end if;
  if v_video.original_attestation_at is null then
    raise exception 'no_attestation'
      using errcode = 'P0001';
  end if;
  if v_video.duration_seconds < 30 then
    raise exception 'duration_below_threshold: %s', v_video.duration_seconds
      using errcode = 'P0001';
  end if;

  -- KST-anchored month key, same expression as the GENERATED
  -- column on entry_tickets — keep these in lock-step.
  v_month_key := to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM');

  -- Count for this user this month.  Status != 'revoked' rows count
  -- toward the 5-cap; spec: "응모권 회수 = ... 사용자의 월간 카운트는
  -- 차감 유지 = 페널티".  Revoked tickets still occupy a slot.
  select count(*) into v_count
  from public.entry_tickets
  where user_id = p_user_id
    and month_key = v_month_key;

  if v_count >= 5 then
    raise exception 'monthly_limit_reached: count=%', v_count
      using errcode = 'P0001';
  end if;

  -- Issue.  The UNIQUE constraint on (video_id) prevents a duplicate
  -- ticket if a Mux retry / client re-call lands here twice for the
  -- same video.
  insert into public.entry_tickets (user_id, video_id, status)
  values (p_user_id, p_video_id, 'active')
  returning id into v_ticket_id;

  -- Auto-enter every currently-active competition.  "Active" here
  -- means: status is one of the three accepting-entries values
  -- (Open / In Review / 접수중 — Voting excluded per policy:
  -- voting is the post-submission phase), AND start_date is in the
  -- past or NULL, AND deadline is in the future.
  insert into public.competition_entries (ticket_id, competition_id)
  select v_ticket_id, c.id
  from public.competitions c
  where c.status in ('Open', 'In Review', '접수중')
    and (c.start_date is null or c.start_date <= now())
    and c.deadline >= now();

  get diagnostics v_entries = row_count;

  return query select v_ticket_id, v_count + 1, v_entries;
end;
$$;

revoke all on function public.issue_lottery_ticket(uuid, text) from public;
grant execute on function public.issue_lottery_ticket(uuid, text) to authenticated, service_role;

comment on function public.issue_lottery_ticket(uuid, text) is
  'Issues one lottery ticket for the given video + auto-enters '
  'every currently-active competition. Atomic via xact advisory '
  'lock per user. Raises with errcode P0001 on validation failures '
  '(not_owner / no_attestation / duration_below_threshold / '
  'monthly_limit_reached) and P0002 on video_not_found.';


-- ===================================================================
-- 2. Draw 5 winners for a competition.
-- ===================================================================

create or replace function public.draw_competition_winners(
  p_competition_id text,
  p_admin_id uuid
)
returns table (
  drawing_log_id uuid,
  winners_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_count integer;
  v_seed text;
  v_eligible_entries integer;
  v_eligible_users integer;
  v_log_id uuid;
  v_winners jsonb;
begin
  -- Serialize all draw operations for this competition (initial draws
  -- AND redraws share the same lock key).
  perform pg_advisory_xact_lock(hashtext('lottery_draw:' || p_competition_id));

  -- Block re-drawing a competition that already has live winners.
  -- Partial unique index on (competition_id, prize_tier) where
  -- claim_status != 'invalidated' would also catch this at INSERT
  -- time, but a clear pre-check gives a nicer error.
  select count(*) into v_existing_count
  from public.competition_winners
  where competition_id = p_competition_id
    and claim_status != 'invalidated';
  if v_existing_count > 0 then
    raise exception 'already_drawn: existing=%', v_existing_count
      using errcode = 'P0001';
  end if;

  -- Re-validate the pool: flip eligible=false for entries whose
  -- backing video is gone/private, whose ticket has been revoked,
  -- or whose user no longer exists.
  update public.competition_entries ce
  set eligible = false
  where ce.competition_id = p_competition_id
    and ce.eligible = true
    and (
      not exists (select 1 from public.entry_tickets t
                  where t.id = ce.ticket_id
                    and t.status = 'active'
                    and t.video_id is not null)
      or exists (
        select 1
        from public.entry_tickets t
        join public.videos v on v.id = t.video_id
        where t.id = ce.ticket_id
          and (v.visibility is distinct from 'public' or v.uploaded_by is null)
      )
    );

  -- Random seed for this draw (16 random bytes = 128 bits hex).
  v_seed := encode(gen_random_bytes(16), 'hex');

  -- Pool stats.
  select count(*), count(distinct t.user_id)
  into v_eligible_entries, v_eligible_users
  from public.competition_entries ce
  join public.entry_tickets t on t.id = ce.ticket_id
  where ce.competition_id = p_competition_id
    and ce.eligible = true;

  if v_eligible_entries = 0 then
    raise exception 'no_eligible_entries'
      using errcode = 'P0001';
  end if;

  -- Pick 5 distinct user_ids in deterministic-from-seed order, take
  -- one entry per user (the first by entry id under that order so
  -- the choice is also seed-derived).
  with ranked as (
    select
      ce.id as entry_id,
      t.user_id,
      t.video_id,
      row_number() over (
        partition by t.user_id
        order by md5(ce.id::text || v_seed)
      ) as user_rank,
      md5(ce.id::text || v_seed) as draw_key
    from public.competition_entries ce
    join public.entry_tickets t on t.id = ce.ticket_id
    where ce.competition_id = p_competition_id
      and ce.eligible = true
  ),
  per_user as (
    -- one entry per user_id (the one with the lowest md5 under seed)
    select * from ranked where user_rank = 1
  ),
  picked as (
    select
      entry_id,
      user_id,
      video_id,
      row_number() over (order by draw_key) as prize_tier
    from per_user
    order by draw_key
    limit 5
  ),
  inserted as (
    insert into public.competition_winners (
      competition_id, entry_id, user_id, prize_tier, info_deadline, claim_token
    )
    select
      p_competition_id,
      p.entry_id,
      p.user_id,
      p.prize_tier::int,
      now() + interval '1 month',
      encode(gen_random_bytes(32), 'hex')
    from picked p
    returning id, entry_id, user_id, prize_tier
  ),
  ticket_flip as (
    update public.entry_tickets t
    set status = 'winner'
    from inserted i
    join public.competition_entries ce on ce.id = i.entry_id
    where t.id = ce.ticket_id
    returning t.id
  )
  -- Build winners_snapshot for the audit log.
  select jsonb_agg(jsonb_build_object(
           'prize_tier', i.prize_tier,
           'entry_id', i.entry_id,
           'user_id', i.user_id,
           'winner_id', i.id
         ) order by i.prize_tier)
  into v_winners
  from inserted i;

  insert into public.drawing_logs (
    competition_id, drawn_by, seed_value,
    eligible_entry_count, eligible_user_count, winners_snapshot
  )
  values (
    p_competition_id, p_admin_id, v_seed,
    v_eligible_entries, v_eligible_users, coalesce(v_winners, '[]'::jsonb)
  )
  returning id into v_log_id;

  return query select v_log_id, coalesce(jsonb_array_length(v_winners), 0);
end;
$$;

revoke all on function public.draw_competition_winners(text, uuid) from public;
grant execute on function public.draw_competition_winners(text, uuid) to service_role;

comment on function public.draw_competition_winners(text, uuid) is
  'Picks 5 distinct-user winners for a competition. Deterministic-'
  'from-seed (md5(entry_id||seed)) so the draw is reproducible. '
  'Concurrency-safe via xact advisory lock; refuses to run if any '
  'live (non-invalidated) winners already exist. Raises P0001 on '
  'already_drawn / no_eligible_entries.';


-- ===================================================================
-- 3. Redraw a specific prize slot after invalidation.
-- ===================================================================

create or replace function public.redraw_winner_slot(
  p_competition_id text,
  p_prize_tier integer,
  p_reason text,
  p_admin_id uuid
)
returns table (
  drawing_log_id uuid,
  new_winner_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing record;
  v_seed text;
  v_eligible_entries integer;
  v_eligible_users integer;
  v_log_id uuid;
  v_winners jsonb;
  v_new_winner_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('lottery_draw:' || p_competition_id));

  -- Find the live winner row for this slot.
  select * into v_existing
  from public.competition_winners
  where competition_id = p_competition_id
    and prize_tier = p_prize_tier
    and claim_status != 'invalidated'
  for update;

  if not found then
    raise exception 'no_live_winner_for_slot'
      using errcode = 'P0001';
  end if;

  -- Cannot redraw once payment has progressed.  Spec policy:
  -- pending/submitted → redraw; confirmed/paid → log only, manual
  -- follow-up (this function is for the redraw path so we refuse
  -- the terminal-state cases).
  if v_existing.claim_status in ('confirmed', 'paid') then
    raise exception 'cannot_redraw_after_payment: status=%', v_existing.claim_status
      using errcode = 'P0001';
  end if;

  -- Invalidate the prior winner.
  update public.competition_winners
  set claim_status = 'invalidated'
  where id = v_existing.id;

  -- Flip the prior ticket's status back to 'active' so the user
  -- isn't permanently marked as a winner anywhere.  (Their other
  -- entries in this competition stay eligible per their own state.)
  update public.entry_tickets t
  set status = 'active'
  from public.competition_entries ce
  where ce.id = v_existing.entry_id
    and t.id = ce.ticket_id
    and t.status = 'winner';

  -- Pool stats AFTER the invalidation.
  select count(*), count(distinct t.user_id)
  into v_eligible_entries, v_eligible_users
  from public.competition_entries ce
  join public.entry_tickets t on t.id = ce.ticket_id
  where ce.competition_id = p_competition_id
    and ce.eligible = true
    -- Exclude ALL user_ids who ever appeared as a winner in this
    -- competition (including invalidated ones) — redraw policy.
    and t.user_id not in (
      select user_id from public.competition_winners
      where competition_id = p_competition_id
    );

  v_seed := encode(gen_random_bytes(16), 'hex');

  -- Pick one replacement using the same algorithm as the initial draw.
  with ranked as (
    select
      ce.id as entry_id,
      t.user_id,
      row_number() over (
        partition by t.user_id
        order by md5(ce.id::text || v_seed)
      ) as user_rank,
      md5(ce.id::text || v_seed) as draw_key
    from public.competition_entries ce
    join public.entry_tickets t on t.id = ce.ticket_id
    where ce.competition_id = p_competition_id
      and ce.eligible = true
      and t.user_id not in (
        select user_id from public.competition_winners
        where competition_id = p_competition_id
      )
  ),
  per_user as (
    select * from ranked where user_rank = 1
  ),
  picked as (
    select entry_id, user_id, draw_key
    from per_user
    order by draw_key
    limit 1
  ),
  inserted as (
    insert into public.competition_winners (
      competition_id, entry_id, user_id, prize_tier, info_deadline, claim_token
    )
    select
      p_competition_id,
      p.entry_id,
      p.user_id,
      p_prize_tier,
      now() + interval '1 month',
      encode(gen_random_bytes(32), 'hex')
    from picked p
    returning id, entry_id, user_id
  ),
  ticket_flip as (
    update public.entry_tickets t
    set status = 'winner'
    from inserted i
    join public.competition_entries ce on ce.id = i.entry_id
    where t.id = ce.ticket_id
    returning t.id
  )
  select jsonb_build_object(
           'prize_tier', p_prize_tier,
           'entry_id', i.entry_id,
           'user_id', i.user_id,
           'winner_id', i.id
         ), i.id
  into v_winners, v_new_winner_id
  from inserted i;

  if v_new_winner_id is null then
    raise exception 'no_replacement_available'
      using errcode = 'P0001';
  end if;

  insert into public.drawing_logs (
    competition_id, drawn_by, seed_value,
    eligible_entry_count, eligible_user_count, winners_snapshot,
    is_redraw, redraw_of, redraw_prize_tier, redraw_reason
  )
  values (
    p_competition_id, p_admin_id, v_seed,
    v_eligible_entries, v_eligible_users,
    jsonb_build_array(v_winners),
    true,
    (select id from public.drawing_logs
     where competition_id = p_competition_id and is_redraw = false
     order by drawn_at desc limit 1),
    p_prize_tier,
    p_reason
  )
  returning id into v_log_id;

  return query select v_log_id, v_new_winner_id;
end;
$$;

revoke all on function public.redraw_winner_slot(text, integer, text, uuid) from public;
grant execute on function public.redraw_winner_slot(text, integer, text, uuid) to service_role;

comment on function public.redraw_winner_slot(text, integer, text, uuid) is
  'Invalidates the live winner of (competition, prize_tier) and '
  'picks a replacement excluding every prior winner user_id in '
  'that competition (active + invalidated alike). Refuses if the '
  'slot is already in confirmed/paid state — manual follow-up '
  'instead. Logs as is_redraw=true.';


-- ===================================================================
-- 4. Expire unclaimed winners.
-- ===================================================================

create or replace function public.expire_unclaimed_winners()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.competition_winners
  set claim_status = 'expired'
  where claim_status = 'pending'
    and info_deadline < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.expire_unclaimed_winners() from public;
grant execute on function public.expire_unclaimed_winners() to service_role;

comment on function public.expire_unclaimed_winners() is
  'Cron entry point. Flips pending winners whose info_deadline '
  'passed to expired. Returns the count flipped for monitoring.';


-- ===================================================================
-- 5. Current-month ticket counts view (for UI counters).
-- ===================================================================

create or replace view public.current_month_ticket_counts
with (security_invoker = true) as
select
  user_id,
  count(*) as total_count,
  count(*) filter (where status = 'active') as active_count,
  count(*) filter (where status = 'winner') as winner_count,
  count(*) filter (where status = 'revoked') as revoked_count,
  -- "사용한" 응모권 = revoked 포함 (페널티 정책).
  greatest(0, 5 - count(*)::int) as remaining
from public.entry_tickets
where month_key = to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM')
group by user_id;

grant select on public.current_month_ticket_counts to authenticated;

comment on view public.current_month_ticket_counts is
  'Per-user remaining-tickets snapshot for the profile-page and '
  'upload-page counters. security_invoker=true so RLS on '
  'entry_tickets applies — each user sees only their own row.';
