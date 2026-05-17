-- ---------------------------------------------------------------
-- operator_messages: user → operator contact / issue-report channel.
--
-- Any visitor (anon or signed-in) can submit a message (bug report,
-- suggestion, error, other). Operators read/triage it from the admin
-- panel via the service-role client (bypasses RLS).
--
-- RLS contract — mirrors business_inquiries:
--   * INSERT  : public  (anon + authenticated)
--   * SELECT / UPDATE / DELETE : NO policy → service-role only.
-- ---------------------------------------------------------------

create table if not exists public.operator_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- nullable: anonymous submissions allowed. SET NULL keeps the
  -- message if the account is later deleted.
  user_id uuid references public.profiles (id) on delete set null,
  email text,
  category text not null default 'other'
    check (category in ('bug', 'suggestion', 'error', 'other')),
  message text not null,
  page_url text,
  user_agent text,
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved')),
  admin_notes text
);

create index if not exists idx_operator_messages_status
  on public.operator_messages (status);
create index if not exists idx_operator_messages_created_at
  on public.operator_messages (created_at desc);

alter table public.operator_messages enable row level security;

drop policy if exists "operator_messages_insert" on public.operator_messages;
create policy "operator_messages_insert"
  on public.operator_messages
  for insert
  with check (true);

notify pgrst, 'reload schema';
