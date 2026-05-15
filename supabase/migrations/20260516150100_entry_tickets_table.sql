-- Phase 1 of the entry-lottery system: tickets table.
--
-- One row per qualifying video upload.  Lifecycle (Phase 2 logic):
--   - Issued by the SECURITY DEFINER issuance function when:
--       videos.original_attestation_at IS NOT NULL
--       AND Mux-reported duration >= 30s
--       AND counter (this user, this month_key, status != 'revoked') < 5
--   - Initial status = 'active'.  Auto-enters every currently-active
--     competition via competition_entries inserts (file 3).
--   - On draw: status flips to 'winner' for the chosen entry's ticket.
--   - On video DELETE: ON DELETE SET NULL clears video_id; a BEFORE
--     UPDATE trigger flips status to 'revoked', sets
--     revoked_reason='video_deleted' and revoked_at=now().
--   - On report-confirmed violation / admin manual / account inactive:
--     service-role UPDATE flips status to 'revoked' with the matching
--     revoked_reason.
--   - On auth.users DELETE: FK cascade nukes the row.

create table if not exists public.entry_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id text references public.videos (id) on delete set null,
  issued_at timestamptz not null default now(),
  -- KST-anchored YYYY-MM bucket.  Generated STORED so the monthly
  -- counter index can use it directly.  KST is the product reset
  -- timezone; if that changes, a corrective migration must drop +
  -- re-add (generated columns cannot be ALTERed in-place).
  month_key text not null generated always as (
    to_char(issued_at at time zone 'Asia/Seoul', 'YYYY-MM')
  ) stored,
  status text not null default 'active'
    check (status in ('active', 'revoked', 'winner')),
  revoked_reason text
    check (revoked_reason in (
      'video_deleted',
      'report_violation',
      'admin_manual',
      'account_inactive'
    )),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  -- One live ticket per video.  Postgres UNIQUE treats NULLs as
  -- distinct, so revoked rows (video_id = NULL post-SET-NULL) don't
  -- collide with each other or with active tickets of new videos.
  constraint entry_tickets_unique_video_id unique (video_id),
  -- Status / revocation timestamp must agree.
  constraint entry_tickets_revoked_consistency
    check ((status = 'revoked') = (revoked_at is not null))
);

-- Monthly counter hot path.  Partial: exclude revoked rows from the
-- count (a revoked ticket is "spent" for the user as penalty, but
-- the issuance function should still see it).  We compute the counter
-- without filtering on status (penalty rule), then the index simply
-- speeds up the (user_id, month_key) lookup regardless.
create index entry_tickets_user_month_idx
  on public.entry_tickets (user_id, month_key);

-- Video-delete trigger lookup.
create index entry_tickets_video_id_idx
  on public.entry_tickets (video_id)
  where video_id is not null;

-- Status filter (drawing-pool queries join through competition_entries
-- so they hit the entries index first, but admin queues filter here).
create index entry_tickets_status_idx
  on public.entry_tickets (status);

-- ---------------------------------------------------------------
-- video-delete trigger: convert SET NULL cascade into a status flip.
-- ---------------------------------------------------------------

create or replace function public.entry_tickets_handle_video_delete()
returns trigger
language plpgsql
as $$
begin
  -- Only act on the SET NULL cascade: video_id transitions
  -- non-NULL → NULL.  Other updates (status change to 'winner'
  -- via service role, etc.) are passed through untouched.
  if old.video_id is not null and new.video_id is null then
    new.status := 'revoked';
    new.revoked_reason := coalesce(new.revoked_reason, 'video_deleted');
    new.revoked_at := coalesce(new.revoked_at, now());
  end if;
  return new;
end;
$$;

create trigger entry_tickets_video_delete_trigger
  before update on public.entry_tickets
  for each row
  execute function public.entry_tickets_handle_video_delete();

-- ---------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------

alter table public.entry_tickets enable row level security;

-- SELECT: own rows (profile page counter, upload-page counter).
create policy entry_tickets_select_own on public.entry_tickets
  for select to authenticated
  using (user_id = (select auth.uid()));

-- INSERT / UPDATE / DELETE: service role only (no authenticated/anon
-- policy → access denied; service role bypasses RLS by default).

comment on table public.entry_tickets is
  'Monthly lottery tickets, one per qualifying video upload. '
  'Status lifecycle: active → winner (on draw) or active → revoked '
  '(video delete / report / admin / account inactive). Phase 2 owns '
  'the issuance function; this file just declares the shape + RLS + '
  'video-delete trigger.';
