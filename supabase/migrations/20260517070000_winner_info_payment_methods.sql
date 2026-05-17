-- Winner claim improvements:
--  1. Fix ambiguous "winner_id" in submit_winner_info (same class of
--     bug as request_winner_email_code — RETURNS TABLE output column
--     name collides with winner_email_verifications.winner_id).
--  2. Add 'payoneer' as a payout method (email-based, like PayPal;
--     currency must stay NULL — payout in USD).
--  3. contact_extra becomes optional (UI field removed) — keep the
--     column but allow empty/NULL.

-- ---- 2 & 3: winner_info constraints --------------------------------
alter table public.winner_info
  alter column contact_extra drop not null;

alter table public.winner_info
  drop constraint if exists winner_info_payment_method_check;
alter table public.winner_info
  add constraint winner_info_payment_method_check
  check (payment_method in ('paypal', 'wise', 'payoneer'));

alter table public.winner_info
  drop constraint if exists winner_info_currency_consistency;
alter table public.winner_info
  add constraint winner_info_currency_consistency
  check (
    (payment_method = 'wise' and payment_currency is not null)
    or (payment_method in ('paypal', 'payoneer') and payment_currency is null)
  );

-- ---- 1 & 2: submit_winner_info ------------------------------------
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

  if p_payment_method not in ('paypal', 'wise', 'payoneer') then
    raise exception 'invalid_payment_method' using errcode = 'P0001';
  end if;
  if p_payment_method = 'wise' and p_payment_currency is null then
    raise exception 'wise_currency_required' using errcode = 'P0001';
  end if;
  if p_payment_method in ('paypal', 'payoneer')
     and p_payment_currency is not null then
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
    p_legal_name, p_country, nullif(p_contact_extra, ''),
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

notify pgrst, 'reload schema';
