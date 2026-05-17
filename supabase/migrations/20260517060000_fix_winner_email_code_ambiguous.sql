-- Fix: request_winner_email_code RPC raised
--   "column reference \"winner_id\" is ambiguous"
--
-- The function is `returns table (... winner_id uuid ...)`, so the
-- RETURNS TABLE output column `winner_id` is an in-scope name inside
-- the PL/pgSQL body.  The UPDATE ... WHERE winner_id = ... clause was
-- then ambiguous between that output column and
-- winner_email_verifications.winner_id.  Qualify the table column.
--
-- Idempotent: plain create-or-replace of the whole function.

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

  select u.email::text into v_email
  from auth.users u
  where u.id = v_winner.user_id;

  if v_email is null then
    raise exception 'user_email_missing' using errcode = 'P0001';
  end if;

  update public.winner_email_verifications
  set consumed_at = now()
  where winner_email_verifications.winner_id = v_winner.id
    and consumed_at is null;

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

notify pgrst, 'reload schema';
