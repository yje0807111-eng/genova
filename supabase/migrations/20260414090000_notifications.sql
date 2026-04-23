create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  type text not null check (type in ('comment', 'follow', 'competition_result')),
  title text not null,
  body text,
  href text,
  entity_type text,
  entity_id text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created_at on public.notifications (user_id, created_at desc);
create index if not exists idx_notifications_user_unread on public.notifications (user_id, is_read);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select to authenticated using (auth.uid () = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update to authenticated using (auth.uid () = user_id);

drop policy if exists "notifications_insert_system" on public.notifications;
create policy "notifications_insert_system" on public.notifications for insert to authenticated with check (
  actor_id is null
  or actor_id = auth.uid ()
);
