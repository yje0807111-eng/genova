-- Phase 1 of the entry-lottery system: winner-submitted PII.
--
-- Separated from competition_winners so the public results read
-- path (public_competition_winners view) cannot leak legal name,
-- payment account, address, etc.  Insert is via the Phase 5
-- SECURITY DEFINER function submit_winner_info(), which validates
-- the claim_token + a separately-issued 6-digit email code before
-- writing.  Updates are admin-only (service role).

create table if not exists public.winner_info (
  id uuid primary key default gen_random_uuid(),
  -- 1:1 with the winner record.
  winner_id uuid not null unique
    references public.competition_winners (id) on delete cascade,
  -- The email-code verification step is a separate ephemeral table
  -- in Phase 5; this boolean records that it succeeded before the
  -- submit_winner_info function accepted the row.
  email_verified boolean not null default false,
  email_verified_at timestamptz,
  -- Legal identity / address fields.
  legal_name text not null,
  country text not null,             -- ISO 3166-1 alpha-2 (e.g. 'KR')
  contact_extra text not null,       -- secondary contact (email or
                                     -- social handle) for admin
                                     -- escalation
  -- Payment details.
  payment_method text not null check (payment_method in ('paypal', 'wise')),
  payment_email text not null,       -- PayPal email or Wise account email
  payment_currency text check (payment_currency in ('USD', 'KRW', 'JPY')),
  -- Currency only applies to Wise (PayPal sends in whatever currency
  -- the contest declares).  CHECK enforces consistency.
  constraint winner_info_currency_consistency check (
    (payment_method = 'wise' and payment_currency is not null)
    or (payment_method = 'paypal' and payment_currency is null)
  ),
  -- Submission audit.
  submitted_at timestamptz not null default now(),
  submitted_ip inet,
  -- Admin verification.
  admin_verified boolean not null default false,
  admin_verified_at timestamptz,
  admin_verified_by uuid references auth.users (id) on delete set null,
  admin_notes text,
  -- Payout record.
  paid_at timestamptz,
  payment_reference text
);

-- Admin queue (unverified rows).
create index winner_info_admin_queue_idx
  on public.winner_info (admin_verified)
  where admin_verified = false;

-- ---------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------

alter table public.winner_info enable row level security;

-- SELECT: own only — winner can check the status of their own
-- submission.  Joins through winner_id → competition_winners.user_id.
create policy winner_info_select_own on public.winner_info
  for select to authenticated
  using (
    exists (
      select 1 from public.competition_winners w
      where w.id = winner_info.winner_id
        and w.user_id = (select auth.uid())
    )
  );

-- INSERT: service role only.  Phase 5's submit_winner_info()
-- function runs as SECURITY DEFINER, so it bypasses RLS and is the
-- single sanctioned write path.  Direct authenticated INSERTs are
-- denied.
-- UPDATE / DELETE: service role only.

comment on table public.winner_info is
  'Winner-submitted PII (legal name, payment account, address). '
  'Separate from competition_winners to keep public read paths '
  'clean. Insert via Phase 5 SECURITY DEFINER submit_winner_info() '
  'function gated on claim_token + email code. Immutable post-'
  'submission except via service role.';
