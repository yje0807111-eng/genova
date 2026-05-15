-- Phase 1 of the entry-lottery system: ticket × competition join.
--
-- At ticket issuance time (Phase 2 function), one row is inserted
-- per currently-active competition.  "Active" predicate is Phase 2
-- territory (status='Open', start_date <= now(), deadline >= now(),
-- etc.) — this schema is agnostic.
--
-- The `eligible` flag is set TRUE at insert; the Phase 2 draw
-- function re-validates each row just before drawing and flips
-- ineligible ones to FALSE (causes: video no longer public, video
-- deleted, ticket revoked between issuance and draw, account
-- deactivated).  Drawing always filters on eligible = TRUE.

create table if not exists public.competition_entries (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null
    references public.entry_tickets (id) on delete cascade,
  competition_id text not null
    references public.competitions (id) on delete cascade,
  entered_at timestamptz not null default now(),
  eligible boolean not null default true,
  constraint competition_entries_unique unique (ticket_id, competition_id)
);

-- Drawing-pool query: per-competition eligible rows.
create index competition_entries_pool_idx
  on public.competition_entries (competition_id)
  where eligible = true;

-- Cascade target for ticket-side queries.
create index competition_entries_ticket_idx
  on public.competition_entries (ticket_id);

-- ---------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------

alter table public.competition_entries enable row level security;

-- SELECT: only own entries (join through entry_tickets.user_id).
-- The public "총 응모 수" count is served by the public view, NOT
-- by direct table reads, so anon callers never touch this table.
create policy competition_entries_select_own on public.competition_entries
  for select to authenticated
  using (
    exists (
      select 1 from public.entry_tickets t
      where t.id = competition_entries.ticket_id
        and t.user_id = (select auth.uid())
    )
  );

-- INSERT / UPDATE / DELETE: service role only.

comment on table public.competition_entries is
  'Lottery pool join: tickets × active competitions, written at '
  'ticket issuance. eligible flag is the draw-time re-validation '
  'result. Public aggregate counts go through '
  'public_competition_entry_counts view (file 7).';
