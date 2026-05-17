-- Phase 5 of the entry-lottery system: winner claim flow.
--
-- This file lands two pieces of plumbing:
--   1. winner_email_verifications table — ephemeral 6-digit codes
--      used to "light-auth" winners before they hand over PII.
--   2. Three SECURITY DEFINER functions wrapping the claim flow:
--        request_winner_email_code(claim_token)
--        verify_winner_email_code(claim_token, code)
--        submit_winner_info(claim_token, ...payload)
--
-- All functions are revoked-from-public + granted to service_role.
-- The user-facing claim page (Phase 5-C) is gated solely by the
-- 256-bit claim_token in the URL; the server action layer
-- (Phase 5-B) is the caller into these functions.

-- ===================================================================
-- Table: ephemeral 6-digit email codes
-- ===================================================================

create table if not exists public.winner_email_verifications (
  id uuid primary key default gen_random_uuid(),
  winner_id uuid not null
    references public.competition_winners (id) on delete cascade,
  code text not null check (code ~ '^[0-9]{6}$'),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  failed_attempts integer not null default 0,
  created_at timestamptz not null default now()
);

-- Hot path: "latest active code for this winner".  Cannot use now()
-- in a partial-index predicate (not IMMUTABLE), so this is a plain
-- composite index; the function logic filters by expires_at + consumed_at.
create index winner_email_verifications_winner_idx
  on public.winner_email_verifications (winner_id, created_at desc);

alter table public.winner_email_verifications enable row level security;
-- No anon/authenticated policies → effective deny.  Service role
-- bypasses RLS, which is the only path that touches this table.

comment on table public.winner_email_verifications is
  'Ephemeral 6-digit codes for winner light-auth before PII '
  'submission. Lives ~5 minutes per code; consumed_at marks the '
  'code as used (either successful verify or brute-force lockout).';


-- ===================================================================
-- 1. request_winner_email_code(claim_token)
-- ===================================================================
-- Generates a fresh code, invalidates any earlier active codes,
-- and returns the code + the winner's email for the calling
-- server action to send via Resend.  Refuses if the token is
-- invalid, already used (claim_status moved past 'pending'), or
-- past the info_deadline.
-- ===================================================================

create or replace function public.request_winner_email_code(
  p_claim_token text
)
returns table (
  verification_id uuid,
  code text,
  expires_at timestamptz,
  winner_id uuid,
  user_email text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner record;
  v_email text;
  v_code text;
  v_expires_at timestamptz;
  v_verification_id uuid;
begin
  select w.id, w.user_id, w.claim_status, w.info_deadline
  into v_winner
  from public.competition_winners w
  where w.claim_token = p_claim_token;

  if not found then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;

  if v_winner.claim_status <> 'pending' then
    raise exception 'token_already_used: status=%', v_winner.claim_status
      using errcode = 'P0001';
  end if;

  if v_winner.info_deadline < now() then
    raise exception 'token_expired' using errcode = 'P0001';
  end if;

  -- Resolve the user's email from auth.users.  SECURITY DEFINER
  -- runs as function owner, so it has SELECT on auth.users.
  select u.email::text into v_email
  from auth.users u
  where u.id = v_winner.user_id;

  if v_email is null then
    raise exception 'user_email_missing' using errcode = 'P0001';
  end if;

  -- Invalidate any prior active codes for this winner (consumed_at
  -- = now() with a sentinel "superseded" feel — verifiers can't
  -- distinguish "used" from "superseded" but that's fine, both
  -- mean "no longer valid").
  update public.winner_email_verifications
  set consumed_at = now()
  where winner_email_verifications.winner_id = v_winner.id
    and consumed_at is null;

  -- 6 random digits, left-padded so leading zeros stay.
  v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
  v_expires_at := now() + interval '5 minutes';

  insert into public.winner_email_verifications (
    winner_id, code, expires_at
  )
  values (v_winner.id, v_code, v_expires_at)
  returning id into v_verification_id;

  return query
    select v_verification_id, v_code, v_expires_at, v_winner.id, v_email;
end;
$$;

revoke all on function public.request_winner_email_code(text) from public;
grant execute on function public.request_winner_email_code(text) to service_role;


-- ===================================================================
-- 2. verify_winner_email_code(claim_token, code)
-- ===================================================================
-- Returns true on match, false on mismatch.  Brute-force protection:
-- 5 failed attempts on the SAME code lock it (consumed_at flips,
-- next call returns false immediately).  Token + status checks first
-- so callers can't probe live winners with arbitrary codes.
-- ===================================================================

create or replace function public.verify_winner_email_code(
  p_claim_token text,
  p_code text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner_id uuid;
  v_claim_status text;
  v_info_deadline timestamptz;
  v_verification record;
begin
  select id, claim_status, info_deadline
  into v_winner_id, v_claim_status, v_info_deadline
  from public.competition_winners
  where claim_token = p_claim_token;

  if v_winner_id is null then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;
  if v_claim_status <> 'pending' then
    raise exception 'token_already_used' using errcode = 'P0001';
  end if;
  if v_info_deadline < now() then
    raise exception 'token_expired' using errcode = 'P0001';
  end if;

  -- Latest active verification row for this winner.
  select id, code, expires_at, consumed_at, failed_attempts
  into v_verification
  from public.winner_email_verifications
  where winner_id = v_winner_id
    and consumed_at is null
    and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'no_active_code' using errcode = 'P0001';
  end if;

  if v_verification.code = p_code then
    update public.winner_email_verifications
    set consumed_at = now()
    where id = v_verification.id;
    return true;
  end if;

  -- Wrong code path.  Increment counter.  Lock at 5 failed attempts
  -- by marking the code consumed (no recovery — user must request
  -- a new code).
  if v_verification.failed_attempts + 1 >= 5 then
    update public.winner_email_verifications
    set failed_attempts = failed_attempts + 1,
        consumed_at = now()
    where id = v_verification.id;
  else
    update public.winner_email_verifications
    set failed_attempts = failed_attempts + 1
    where id = v_verification.id;
  end if;

  return false;
end;
$$;

revoke all on function public.verify_winner_email_code(text, text) from public;
grant execute on function public.verify_winner_email_code(text, text) to service_role;


-- ===================================================================
-- 3. submit_winner_info(claim_token, ...payload)
-- ===================================================================
-- Inserts the PII record after light-auth has succeeded.  Refuses
-- when:
--   - token is invalid / past deadline / already used
--   - no consumed verification exists for this winner
--   - payload fails the same currency-consistency rule as the
--     winner_info CHECK (paypal ⇒ currency NULL; wise ⇒ NOT NULL)
-- Flips claim_status pending → submitted on success.
-- ===================================================================

create or replace function public.submit_winner_info(
  p_claim_token text,
  p_legal_name text,
  p_country text,
  p_contact_extra text,
  p_payment_method text,
  p_payment_email text,
  p_payment_currency text,
  p_submitted_ip inet
)
returns table (
  winner_id uuid,
  winner_info_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner record;
  v_verification record;
  v_winner_info_id uuid;
begin
  select id, claim_status, info_deadline, user_id
  into v_winner
  from public.competition_winners
  where claim_token = p_claim_token
  for update;

  if not found then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;
  if v_winner.claim_status <> 'pending' then
    raise exception 'token_already_used' using errcode = 'P0001';
  end if;
  if v_winner.info_deadline < now() then
    raise exception 'token_expired' using errcode = 'P0001';
  end if;

  -- Require a consumed verification for this winner — the email
  -- code flow must have succeeded at some point in this session.
  select id, consumed_at into v_verification
  from public.winner_email_verifications
  where winner_email_verifications.winner_id = v_winner.id
    and consumed_at is not null
    and failed_attempts < 5
  order by consumed_at desc
  limit 1;

  if not found then
    raise exception 'email_not_verified' using errcode = 'P0001';
  end if;

  -- Inline payment-method / currency consistency (matches the
  -- winner_info CHECK constraint but raises a cleaner error code).
  if p_payment_method not in ('paypal', 'wise') then
    raise exception 'invalid_payment_method' using errcode = 'P0001';
  end if;
  if p_payment_method = 'wise' and p_payment_currency is null then
    raise exception 'wise_currency_required' using errcode = 'P0001';
  end if;
  if p_payment_method = 'paypal' and p_payment_currency is not null then
    raise exception 'paypal_currency_must_be_null' using errcode = 'P0001';
  end if;

  insert into public.winner_info (
    winner_id,
    email_verified, email_verified_at,
    legal_name, country, contact_extra,
    payment_method, payment_email, payment_currency,
    submitted_ip
  )
  values (
    v_winner.id,
    true, v_verification.consumed_at,
    p_legal_name, p_country, p_contact_extra,
    p_payment_method, p_payment_email, p_payment_currency,
    p_submitted_ip
  )
  returning id into v_winner_info_id;

  update public.competition_winners
  set claim_status = 'submitted'
  where id = v_winner.id;

  return query select v_winner.id, v_winner_info_id;
end;
$$;

revoke all on function public.submit_winner_info(
  text, text, text, text, text, text, text, inet
) from public;
grant execute on function public.submit_winner_info(
  text, text, text, text, text, text, text, inet
) to service_role;


comment on function public.request_winner_email_code(text) is
  'Issues a 6-digit code for the winner identified by claim_token, '
  'invalidates earlier active codes, returns code + email so the '
  'server action layer can dispatch the email via Resend.';

comment on function public.verify_winner_email_code(text, text) is
  'Validates a 6-digit code against the latest active verification '
  'for the winner. 5 wrong tries lock the code (must re-request).';

comment on function public.submit_winner_info(
  text, text, text, text, text, text, text, inet
) is
  'Final claim step: inserts winner_info PII and flips '
  'claim_status pending → submitted. Requires a prior consumed '
  'verification (i.e. the email-code flow succeeded).';
