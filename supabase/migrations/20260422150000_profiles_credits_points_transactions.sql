-- Credits / Points balances on profiles + ledger for credit activity
alter table public.profiles add column if not exists credits integer not null default 0;

alter table public.profiles add column if not exists points integer not null default 0;

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null,
  balance_after integer,
  reason text,
  created_at timestamptz not null default now ()
);

create index if not exists idx_credit_transactions_user_created on public.credit_transactions (user_id, created_at desc);

alter table public.credit_transactions enable row level security;

drop policy if exists "credit_transactions_select_own" on public.credit_transactions;

create policy "credit_transactions_select_own" on public.credit_transactions for select to authenticated using (auth.uid () = user_id);
