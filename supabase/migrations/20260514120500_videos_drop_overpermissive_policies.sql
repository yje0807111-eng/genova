-- 20260514120500_videos_drop_overpermissive_policies.sql
--
-- Removes two ACTIVE security holes plus two redundant duplicates
-- on public.videos:
--
--   1. `videos_select` with `using (true)` — overrode the
--      `videos_select_visible` privacy logic.  Postgres OR's all
--      SELECT policies, so visibility = 'private' had no effect.
--      Every video (including private ones) was readable by anon
--      and authenticated alike.
--
--   2. `videos_insert` with `with check (true)` — let any
--      authenticated user INSERT a row with any `uploaded_by`,
--      enabling ownership spoofing.  Bypasses `videos_insert_owner`'s
--      `uploaded_by = auth.uid()` constraint.
--
--   3. `videos_delete` was a duplicate of `videos_delete_owner`
--      (both predicates: `auth.uid() = uploaded_by`).
--
--   4. `videos_update` was a duplicate of `videos_update_owner`.
--
-- Admin write paths in src/app/actions/admin.ts
-- (setVideoFinalistAction, setVideoOriginalAction,
-- setVideoAwardAction, toggleCompetitionFeaturedAction,
-- getCompetitionVideosAction) move to service-role in the same
-- commit because RLS cannot distinguish admins from regular
-- authenticated users.

alter table public.videos enable row level security;

-- 1. Drop the two over-permissive policies and two redundant duplicates.
drop policy if exists "videos_select" on public.videos;
drop policy if exists "videos_insert" on public.videos;
drop policy if exists "videos_delete" on public.videos;
drop policy if exists "videos_update" on public.videos;

-- 2. Re-assert the four owner-bound policies idempotently so the
--    canonical state is captured in one place.
drop policy if exists "videos_select_visible" on public.videos;
create policy "videos_select_visible"
  on public.videos
  for select
  using (uploaded_by is null OR visibility = 'public' OR auth.uid() = uploaded_by);

drop policy if exists "videos_insert_owner" on public.videos;
create policy "videos_insert_owner"
  on public.videos
  for insert
  to authenticated
  with check (uploaded_by = auth.uid());

drop policy if exists "videos_update_owner" on public.videos;
create policy "videos_update_owner"
  on public.videos
  for update
  to authenticated
  using (uploaded_by = auth.uid())
  with check (uploaded_by = auth.uid());

drop policy if exists "videos_delete_owner" on public.videos;
create policy "videos_delete_owner"
  on public.videos
  for delete
  to authenticated
  using (uploaded_by = auth.uid());

comment on table public.videos is
  'RLS contract: SELECT — uploaded_by IS NULL (legacy) OR visibility = ''public'' OR auth.uid() = uploaded_by. '
  'INSERT/UPDATE/DELETE — uploaded_by = auth.uid() only. Admin overrides '
  '(setVideo*Action, toggleCompetitionFeaturedAction, getCompetitionVideosAction) '
  'use createServiceSupabaseClient() in src/app/actions/admin.ts after isAdminEmail() verification.';
