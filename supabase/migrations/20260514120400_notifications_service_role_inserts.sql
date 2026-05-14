-- 20260514120400_notifications_service_role_inserts.sql
--
-- Closes a recipient-spoof hole on public.notifications.
--
-- Prior policy `notifications_insert_system`:
--   `with check (actor_id is null OR actor_id = auth.uid())`
-- constrained the actor but NOT the recipient (`user_id`).  Any
-- authenticated user could insert a notification targeting any
-- other account's inbox just by setting their own UUID as
-- `actor_id`.
--
-- Fix: drop the policy entirely.  With RLS on and no INSERT policy,
-- only service-role connections can insert.  All notification
-- creation now flows through src/lib/notifications.ts
-- (createNotification()), which uses createServiceSupabaseClient()
-- internally.  Callers are server actions that have already
-- validated the recipient through business logic (e.g. the video
-- uploader, the followed user, the prize winner).
--
-- SELECT and UPDATE remain own-only (auth.uid() = user_id).

alter table public.notifications enable row level security;

-- Drop the broken INSERT policy.
drop policy if exists "notifications_insert_system" on public.notifications;

-- Re-assert read/update policies idempotently.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications
  for update
  to authenticated
  using (auth.uid() = user_id);

comment on table public.notifications is
  'RLS contract: SELECT/UPDATE by recipient (auth.uid() = user_id); '
  'INSERT is service-role only — recipient identity must be validated by '
  'server business logic before calling createNotification() in '
  'src/lib/notifications.ts.';
