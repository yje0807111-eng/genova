-- Phase 1 of the entry-lottery system: drawn winners.
--
-- 5 rows per (initial) draw event.  Re-draws on revocation insert
-- additional rows for the same competition_id + prize_tier, but the
-- prior row's claim_status flips to 'invalidated' first.  The
-- partial unique indexes below enforce uniqueness only across
-- non-invalidated rows, so the same tier can be re-occupied.
--
-- Concurrent draw protection (two admins simultaneously triggering
-- a draw for the same competition):
--   - Phase 2 draw function acquires
--     pg_advisory_xact_lock(hashtext('draw:' || competition_id))
--     before doing the SELECT/INSERT, serializing the work.
--   - If the lock were skipped, the UNIQUE constraints below would
--     still prevent corruption (one txn wins, the other unique-
--     violations and rolls back) — the lock just turns that into
--     a cleaner error path.

create table if not exists public.competition_winners (
  id uuid primary key default gen_random_uuid(),
  competition_id text not null
    references public.competitions (id) on delete cascade,
  -- The winning entry.  RESTRICT because winners are historical
  -- record — you cannot delete an entry that produced a winner
  -- (Phase 2 redraw flow flips eligible=false instead).
  entry_id uuid not null
    references public.competition_entries (id) on delete restrict,
  user_id uuid not null
    references auth.users (id) on delete cascade,
  prize_tier integer not null check (prize_tier between 1 and 5),
  -- USD snapshot of prize at draw time; intentionally a column on
  -- the winner (not joined from competitions) so future tier-amount
  -- changes don't rewrite historical wins.
  prize_amount_usd integer not null default 100,
  drawn_at timestamptz not null default now(),
  info_deadline timestamptz not null,
  -- 256-bit (64-hex) random claim token.  Phase 2 generates with
  -- encode(gen_random_bytes(32), 'hex'). Never exposed through the
  -- public_competition_winners view; surfaced to the winner via
  -- a separate SECURITY DEFINER read function (Phase 5).
  claim_token text not null unique,
  claim_status text not null default 'pending'
    check (claim_status in (
      'pending',      -- drawn, awaiting winner submission
      'submitted',    -- winner submitted info, awaiting admin verify
      'confirmed',    -- admin verified, ready for payment
      'paid',         -- payment dispatched
      'expired',      -- deadline passed without submission
      'invalidated'   -- post-draw revocation (report violation,
                      -- admin invalidation) — slot is then redrawn
    )),
  notified_at timestamptz,
  created_at timestamptz not null default now()
);

-- Partial uniqueness: prevents two LIVE winners for the same tier or
-- the same user-per-competition, but allows redraws to insert new
-- rows once the prior winner's claim_status flips to 'invalidated'.
create unique index competition_winners_tier_unique
  on public.competition_winners (competition_id, prize_tier)
  where claim_status <> 'invalidated';

create unique index competition_winners_user_unique
  on public.competition_winners (competition_id, user_id)
  where claim_status <> 'invalidated';

create index competition_winners_user_idx
  on public.competition_winners (user_id);

create index competition_winners_status_idx
  on public.competition_winners (claim_status);

-- Expiry cron lookup (Phase 5): pending winners whose deadline passed.
create index competition_winners_deadline_idx
  on public.competition_winners (info_deadline)
  where claim_status = 'pending';

-- ---------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------

alter table public.competition_winners enable row level security;

-- NO direct SELECT for anon/authenticated.  Public read goes through
-- public_competition_winners view (file 7) which strips claim_token
-- + info_deadline.  Winners retrieve their own claim_token via the
-- Phase 5 SECURITY DEFINER function get_my_claim_token(winner_id).
-- Service role bypasses RLS for issuance, redraw, and admin flows.

comment on table public.competition_winners is
  '5 drawn winners per competition draw event. Redraws insert new '
  'rows (same prize_tier) once the prior row is invalidated. '
  'claim_token is the unguessable URL slug for the Phase 5 info-'
  'submission flow — never exposed via public views.';
