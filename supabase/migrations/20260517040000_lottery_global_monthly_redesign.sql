-- ===================================================================
-- 응모권 추첨: 공모전별 → 글로벌 월간 풀 전면 재설계 (클린 슬레이트)
-- ===================================================================
-- 모델: 영상 업로드 → 응모권 발급(월 최대 5, KST month_key).
--       매월 전체 응모권 풀에서 5명 추첨($100), 공모전과 무관.
--
-- 클린 슬레이트: 기존 응모권/당첨 데이터 없음 가정 → 데이터 비우고
-- 구조만 글로벌 월간으로 전환.  claim_token / winner_info /
-- 이메일 인증 인프라는 구조 보존(데이터만 초기화).
--
-- 적용 후: NOTIFY pgrst, 'reload schema';  +  앱 재배포.

-- 1. 공모전별 공개 뷰 제거 -----------------------------------------
drop view if exists public.public_competition_winners;
drop view if exists public.public_competition_entry_counts;

-- 2. 공모전별 추첨 함수 제거 ----------------------------------------
drop function if exists public.draw_competition_winners(text, uuid);
drop function if exists public.redraw_winner_slot(text, integer, text, uuid);

-- 3. 데이터 클린 슬레이트 ------------------------------------------
truncate table
  public.entry_tickets,
  public.competition_winners,
  public.drawing_logs,
  public.competition_entries,
  public.winner_info,
  public.winner_email_verifications
  restart identity cascade;

-- 4. 공모전 연결 테이블 제거 (응모권 = 응모 단위) -------------------
--    competition_winners.entry_id → competition_entries FK 도 함께 제거됨.
drop table if exists public.competition_entries cascade;

-- 5. competition_winners: 공모전별 → 월간 글로벌 --------------------
drop index if exists public.competition_winners_tier_unique;
drop index if exists public.competition_winners_user_unique;

alter table public.competition_winners
  drop column if exists competition_id,
  add column if not exists draw_month_key text not null;

-- entry_id(→competition_entries, FK는 4에서 제거됨) → entry_ticket_id(→entry_tickets)
alter table public.competition_winners
  rename column entry_id to entry_ticket_id;
alter table public.competition_winners
  add constraint competition_winners_entry_ticket_fk
  foreign key (entry_ticket_id) references public.entry_tickets (id)
  on delete restrict;

-- 월 1인 1상 / 월 5티어 (invalidated 제외 = 재추첨 슬롯 재사용 허용)
create unique index competition_winners_tier_unique
  on public.competition_winners (draw_month_key, prize_tier)
  where claim_status <> 'invalidated';
create unique index competition_winners_user_unique
  on public.competition_winners (draw_month_key, user_id)
  where claim_status <> 'invalidated';

-- 6. drawing_logs: 공모전별 → 월간 글로벌 --------------------------
drop index if exists public.drawing_logs_competition_idx;
alter table public.drawing_logs
  drop column if exists competition_id,
  add column if not exists draw_month_key text not null;
create index drawing_logs_month_idx
  on public.drawing_logs (draw_month_key, drawn_at desc);

-- 7. 글로벌 공개 뷰 -----------------------------------------------
--    당첨자 안전 투영 (claim_token/info_deadline/notified_at 제외,
--    invalidated 제외).  video_id 는 entry_tickets 에서 직접.
create or replace view public.public_monthly_winners
with (security_invoker = false) as
select
  w.id,
  w.draw_month_key,
  w.user_id,
  w.entry_ticket_id,
  w.prize_tier,
  w.prize_amount_usd,
  w.drawn_at,
  w.claim_status,
  t.video_id
from public.competition_winners w
left join public.entry_tickets t on t.id = w.entry_ticket_id
where w.claim_status <> 'invalidated';

grant select on public.public_monthly_winners to anon, authenticated;

comment on view public.public_monthly_winners is
  'Global monthly winners (safe projection). Strips claim_token / '
  'info_deadline / notified_at, filters invalidated. video_id from '
  'entry_tickets. Owner-runs to bypass competition_winners RLS.';

-- public_monthly_pool_count 뷰는 20260517030000 에서 이미 글로벌 — 유지.

-- 8. issue_lottery_ticket: 공모전 자동등록 제거 (티켓만 발급) -------
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
set search_path = public, extensions
as $$
declare
  v_video record;
  v_month_key text;
  v_count integer;
  v_ticket_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('lottery_issue:' || p_user_id::text));

  select id, uploaded_by, original_attestation_at, duration_seconds, visibility
  into v_video
  from public.videos
  where id = p_video_id;

  if not found then
    raise exception 'video_not_found: %', p_video_id using errcode = 'P0002';
  end if;
  if v_video.uploaded_by is distinct from p_user_id then
    raise exception 'not_owner' using errcode = 'P0001';
  end if;
  if v_video.original_attestation_at is null then
    raise exception 'no_attestation' using errcode = 'P0001';
  end if;
  if v_video.duration_seconds < 30 then
    raise exception 'duration_below_threshold: %s', v_video.duration_seconds
      using errcode = 'P0001';
  end if;

  v_month_key := to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM');

  select count(*) into v_count
  from public.entry_tickets
  where user_id = p_user_id and month_key = v_month_key;

  if v_count >= 5 then
    raise exception 'monthly_limit_reached: count=%', v_count using errcode = 'P0001';
  end if;

  insert into public.entry_tickets (user_id, video_id, status)
  values (p_user_id, p_video_id, 'active')
  returning id into v_ticket_id;

  -- 공모전 자동등록 없음: 응모권 자체가 월간 전체 풀의 응모 단위.
  return query select v_ticket_id, v_count + 1, 0;
end;
$$;

revoke all on function public.issue_lottery_ticket(uuid, text) from public;
grant execute on function public.issue_lottery_ticket(uuid, text) to authenticated, service_role;

comment on function public.issue_lottery_ticket(uuid, text) is
  'Issues one lottery ticket for the video (월 최대 5, KST month). '
  'No competition coupling — the ticket IS the monthly pool entry. '
  'entries_created always 0 (kept for return-shape compat).';

-- 9. draw_monthly_winners(month_key, admin) -----------------------
create or replace function public.draw_monthly_winners(
  p_month_key text,
  p_admin_id uuid
)
returns table (
  drawing_log_id uuid,
  winners_count integer
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_existing_count integer;
  v_seed text;
  v_eligible_tickets integer;
  v_eligible_users integer;
  v_log_id uuid;
  v_winners jsonb;
begin
  perform pg_advisory_xact_lock(hashtext('lottery_draw:' || p_month_key));

  select count(*) into v_existing_count
  from public.competition_winners
  where draw_month_key = p_month_key
    and claim_status <> 'invalidated';
  if v_existing_count > 0 then
    raise exception 'already_drawn: existing=%', v_existing_count using errcode = 'P0001';
  end if;

  v_seed := encode(gen_random_bytes(16), 'hex');

  -- 풀: 해당 월 active 응모권 (영상 public + 업로더 존재).
  select count(*), count(distinct t.user_id)
  into v_eligible_tickets, v_eligible_users
  from public.entry_tickets t
  join public.videos v on v.id = t.video_id
  where t.month_key = p_month_key
    and t.status = 'active'
    and v.visibility = 'public'
    and v.uploaded_by is not null;

  if v_eligible_tickets = 0 then
    raise exception 'no_eligible_entries' using errcode = 'P0001';
  end if;

  with ranked as (
    select
      t.id as ticket_id,
      t.user_id,
      row_number() over (
        partition by t.user_id order by md5(t.id::text || v_seed)
      ) as user_rank,
      md5(t.id::text || v_seed) as draw_key
    from public.entry_tickets t
    join public.videos v on v.id = t.video_id
    where t.month_key = p_month_key
      and t.status = 'active'
      and v.visibility = 'public'
      and v.uploaded_by is not null
  ),
  per_user as (
    select * from ranked where user_rank = 1
  ),
  picked as (
    select ticket_id, user_id,
      row_number() over (order by draw_key) as prize_tier
    from per_user order by draw_key limit 5
  ),
  inserted as (
    insert into public.competition_winners (
      draw_month_key, entry_ticket_id, user_id, prize_tier, info_deadline, claim_token
    )
    select
      p_month_key, p.ticket_id, p.user_id, p.prize_tier::int,
      now() + interval '1 month', encode(gen_random_bytes(32), 'hex')
    from picked p
    returning id, entry_ticket_id, user_id, prize_tier
  ),
  ticket_flip as (
    update public.entry_tickets t
    set status = 'winner'
    from inserted i
    where t.id = i.entry_ticket_id
    returning t.id
  )
  select jsonb_agg(jsonb_build_object(
           'prize_tier', i.prize_tier,
           'entry_ticket_id', i.entry_ticket_id,
           'user_id', i.user_id,
           'winner_id', i.id
         ) order by i.prize_tier)
  into v_winners
  from inserted i;

  insert into public.drawing_logs (
    draw_month_key, drawn_by, seed_value,
    eligible_entry_count, eligible_user_count, winners_snapshot
  )
  values (
    p_month_key, p_admin_id, v_seed,
    v_eligible_tickets, v_eligible_users, coalesce(v_winners, '[]'::jsonb)
  )
  returning id into v_log_id;

  return query select v_log_id, coalesce(jsonb_array_length(v_winners), 0);
end;
$$;

revoke all on function public.draw_monthly_winners(text, uuid) from public;
grant execute on function public.draw_monthly_winners(text, uuid) to service_role;

comment on function public.draw_monthly_winners(text, uuid) is
  'Draws 5 distinct-user winners from the month KST pool of active '
  'entry_tickets. Deterministic-from-seed. Refuses if live winners '
  'already exist for the month. P0001 already_drawn/no_eligible_entries.';

-- 10. redraw_monthly_slot(month_key, tier, reason, admin) ---------
create or replace function public.redraw_monthly_slot(
  p_month_key text,
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
set search_path = public, extensions
as $$
declare
  v_existing record;
  v_seed text;
  v_eligible_tickets integer;
  v_eligible_users integer;
  v_log_id uuid;
  v_winners jsonb;
  v_new_winner_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('lottery_draw:' || p_month_key));

  select * into v_existing
  from public.competition_winners
  where draw_month_key = p_month_key
    and prize_tier = p_prize_tier
    and claim_status <> 'invalidated'
  for update;

  if not found then
    raise exception 'no_live_winner_for_slot' using errcode = 'P0001';
  end if;
  if v_existing.claim_status in ('confirmed', 'paid') then
    raise exception 'cannot_redraw_after_payment: status=%', v_existing.claim_status
      using errcode = 'P0001';
  end if;

  update public.competition_winners
  set claim_status = 'invalidated'
  where id = v_existing.id;

  update public.entry_tickets t
  set status = 'active'
  where t.id = v_existing.entry_ticket_id
    and t.status = 'winner';

  v_seed := encode(gen_random_bytes(16), 'hex');

  select count(*), count(distinct t.user_id)
  into v_eligible_tickets, v_eligible_users
  from public.entry_tickets t
  join public.videos v on v.id = t.video_id
  where t.month_key = p_month_key
    and t.status = 'active'
    and v.visibility = 'public'
    and v.uploaded_by is not null
    and t.user_id not in (
      select user_id from public.competition_winners
      where draw_month_key = p_month_key
    );

  with ranked as (
    select
      t.id as ticket_id, t.user_id,
      row_number() over (
        partition by t.user_id order by md5(t.id::text || v_seed)
      ) as user_rank,
      md5(t.id::text || v_seed) as draw_key
    from public.entry_tickets t
    join public.videos v on v.id = t.video_id
    where t.month_key = p_month_key
      and t.status = 'active'
      and v.visibility = 'public'
      and v.uploaded_by is not null
      and t.user_id not in (
        select user_id from public.competition_winners
        where draw_month_key = p_month_key
      )
  ),
  per_user as (
    select * from ranked where user_rank = 1
  ),
  picked as (
    select ticket_id, user_id, draw_key
    from per_user order by draw_key limit 1
  ),
  inserted as (
    insert into public.competition_winners (
      draw_month_key, entry_ticket_id, user_id, prize_tier, info_deadline, claim_token
    )
    select
      p_month_key, p.ticket_id, p.user_id, p_prize_tier,
      now() + interval '1 month', encode(gen_random_bytes(32), 'hex')
    from picked p
    returning id, entry_ticket_id, user_id
  ),
  ticket_flip as (
    update public.entry_tickets t
    set status = 'winner'
    from inserted i
    where t.id = i.entry_ticket_id
    returning t.id
  )
  select jsonb_build_object(
           'prize_tier', p_prize_tier,
           'entry_ticket_id', i.entry_ticket_id,
           'user_id', i.user_id,
           'winner_id', i.id
         ), i.id
  into v_winners, v_new_winner_id
  from inserted i;

  if v_new_winner_id is null then
    raise exception 'no_replacement_available' using errcode = 'P0001';
  end if;

  insert into public.drawing_logs (
    draw_month_key, drawn_by, seed_value,
    eligible_entry_count, eligible_user_count, winners_snapshot,
    is_redraw, redraw_of, redraw_prize_tier, redraw_reason
  )
  values (
    p_month_key, p_admin_id, v_seed,
    v_eligible_tickets, v_eligible_users,
    jsonb_build_array(v_winners),
    true,
    (select id from public.drawing_logs
     where draw_month_key = p_month_key and is_redraw = false
     order by drawn_at desc limit 1),
    p_prize_tier, p_reason
  )
  returning id into v_log_id;

  return query select v_log_id, v_new_winner_id;
end;
$$;

revoke all on function public.redraw_monthly_slot(text, integer, text, uuid) from public;
grant execute on function public.redraw_monthly_slot(text, integer, text, uuid) to service_role;

comment on function public.redraw_monthly_slot(text, integer, text, uuid) is
  'Invalidates the live winner of (month, tier) and picks a '
  'replacement excluding every prior winner user in that month. '
  'Refuses on confirmed/paid. Logs is_redraw=true.';

-- expire_unclaimed_winners() / current_month_ticket_counts /
-- winner_info / winner_email_verifications / claim 함수는 공모전과
-- 무관(winner_id 기반) — 변경 없음.
