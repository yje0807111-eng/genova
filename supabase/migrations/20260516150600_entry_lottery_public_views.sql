-- Phase 1 of the entry-lottery system: public read views.
--
-- Both `competition_entries` and `competition_winners` deny direct
-- anon/authenticated SELECT (RLS only allows own-row reads for the
-- former, and nothing for the latter).  Public-facing UI surfaces
-- still need aggregate + safe-projection reads — served through
-- these owner-runs views.
--
-- Pattern follows `public.public_profiles` in commit
-- 20260514120600: `security_invoker = false` so the view runs as
-- the view owner (typically `postgres`), bypassing RLS on the
-- underlying tables.

-- ---------------------------------------------------------------
-- 1. Aggregate entry counts per competition.
-- ---------------------------------------------------------------
-- Source for the "총 응모 수: 247개" badge on competition pages.
create or replace view public.public_competition_entry_counts
with (security_invoker = false) as
select
  competition_id,
  count(*) filter (where eligible) as eligible_count,
  count(distinct ticket_id) as ticket_count
from public.competition_entries
group by competition_id;

grant select on public.public_competition_entry_counts to anon, authenticated;

comment on view public.public_competition_entry_counts is
  'Aggregate entry counts per competition for the public-facing '
  '"총 응모 수" badge. Owner-runs (security_invoker = false) so it '
  'bypasses competition_entries RLS (which denies anon read).';

-- ---------------------------------------------------------------
-- 2. Safe projection of winners.
-- ---------------------------------------------------------------
-- Strips claim_token, info_deadline, notified_at, claim_status —
-- the last only when claim_status is 'invalidated' (we don't want
-- the public results page surfacing invalidated rows; the redraw
-- replacement is what shows there).  The view also joins through
-- competition_entries + entry_tickets so the UI can fetch the
-- video_id for embedding without an extra round-trip.
create or replace view public.public_competition_winners
with (security_invoker = false) as
select
  w.id,
  w.competition_id,
  w.user_id,
  w.entry_id,
  w.prize_tier,
  w.prize_amount_usd,
  w.drawn_at,
  w.claim_status,
  e.ticket_id,
  t.video_id
from public.competition_winners w
join public.competition_entries e on e.id = w.entry_id
left join public.entry_tickets t on t.id = e.ticket_id
where w.claim_status <> 'invalidated';

grant select on public.public_competition_winners to anon, authenticated;

comment on view public.public_competition_winners is
  'Public-safe projection of competition_winners (joined with the '
  'backing entry + ticket so the UI gets video_id for embedding). '
  'Strips claim_token, info_deadline, notified_at, and filters out '
  'invalidated rows so the results page shows the LIVE winner set '
  'after any redraws. Owner-runs to bypass competition_winners RLS.';
