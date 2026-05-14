# Security Rollout — 2026-05-14

> Consolidated reference for the security migrations applied during the
> 2026-05-14 session. All migrations are **already applied and verified
> on the production Supabase DB**; this document is for future fresh
> deployments, staging recovery, or audit re-runs.

Related: `docs/rls-audit.md` (audit + threat model), `PROJECT_STATUS.md`
§8 (session log).

---

## 1. Migration inventory

| # | File | Commit | Code Δ |
|---|------|--------|--------|
| 1 | `supabase/migrations/20260514120000_competitions_service_role_writes_only.sql` | `8f9520e` | 5 admin actions → service role; admin.ts helper extracted in subsequent commit |
| 2 | `supabase/migrations/20260514120100_video_reports_service_role_admin_ops.sql` | `e1dce92` | reports.ts 3 admin actions + admin/page.tsx video_reports read → service role; `src/lib/auth/admin-actions.ts` shared helper created |
| 3 | `supabase/migrations/20260514120200_business_inquiries_service_role_admin_ops.sql` | `689995d` | business-inquiries.ts 4 admin actions → service role |
| 4 | `supabase/migrations/20260514120300_site_settings_service_role_writes_only.sql` | `426fe60` | **CRITICAL** — `POST /api/site-settings` was previously unauthenticated; now `requireAdminWithService()` gate + service role write |
| 5 | `supabase/migrations/20260514120400_notifications_service_role_inserts.sql` | `8966341` | `createNotification()` uses service role internally; recipient spoof closed; 8 call sites updated |
| 6 | `supabase/migrations/20260514120500_videos_drop_overpermissive_policies.sql` | `29a23d5` | drops `videos_select using(true)` + `videos_insert with check(true)` + redundant duplicates; 5 admin video write paths → service role |
| 7a | `supabase/migrations/20260514120600_profiles_public_view.sql` | `d829941` | adds `public.public_profiles` view exposing the 20 safe-public columns; additive |
| 7b | (code-only, no SQL) | `5e98bc7` | 30 call sites in 14 files routed through `public_profiles` view; `fetchProfileById` split into `fetchOwnProfile` + `fetchPublicProfileById` |
| 7c | `supabase/migrations/20260514120700_profiles_select_own_only.sql` | `df4e44d` | tightens `profiles.SELECT` to `auth.uid() = id`; non-owner reads must go through the view |

**8 SQL migrations** + **1 code-only refactor** (7b).

---

## 2. Apply order

The migrations are independent of each other in production (each touches
a different table) so they can be applied in any order — but the order
below matches the commit history and the code deployment sequence, so
following it makes the deploy log easier to read.

For phase 7 in particular: **always apply 7a (view creation) before 7c
(SELECT lock)**. Otherwise non-owner profile reads will return zero rows
until the view exists.

Apply phase 7c only after the corresponding code (commit `5e98bc7`,
phase 7b) is deployed — otherwise pages that still call `from("profiles")`
for other users' rows will silently render with empty profile data.

---

## 3. Consolidated re-run script

All migrations are idempotent (every `drop policy if exists` /
`create or replace view` / DO-block-based name-independent drops).
Safe to re-run against a DB that already has them.

> ⚠️ Run inside the Supabase SQL Editor. The whole block fits in a single
> execution; PostgreSQL's transaction model handles it as a single batch
> when wrapped, but the comments below denote logical migration
> boundaries.

```sql
-- ============================================================================
-- (1/8) competitions: SELECT public; INSERT/UPDATE/DELETE service-role only
-- ============================================================================

alter table public.competitions enable row level security;

do $$
declare pol record;
begin
  for pol in
    select polname from pg_policy
    where polrelid = 'public.competitions'::regclass
      and polcmd <> 'r'
  loop
    execute format('drop policy if exists %I on public.competitions', pol.polname);
  end loop;
end $$;

drop policy if exists "Public read competitions" on public.competitions;
create policy "Public read competitions"
  on public.competitions for select using (true);

comment on table public.competitions is
  'RLS contract: SELECT is public; INSERT/UPDATE/DELETE are service-role only. '
  'Admin write paths live in src/app/actions/admin.ts and must use '
  'createServiceSupabaseClient(). App-layer admin guard via isAdminEmail() '
  'is the security boundary; RLS cannot distinguish admins from other '
  'authenticated users because there is no DB-level admin role.';


-- ============================================================================
-- (2/8) video_reports: INSERT by own reporter; SELECT/UPDATE/DELETE service-role
-- ============================================================================

alter table public.video_reports enable row level security;

do $$
declare pol record;
begin
  for pol in
    select polname from pg_policy
    where polrelid = 'public.video_reports'::regclass
      and polcmd <> 'a'
  loop
    execute format('drop policy if exists %I on public.video_reports', pol.polname);
  end loop;
end $$;

drop policy if exists "video_reports_insert_own" on public.video_reports;
create policy "video_reports_insert_own"
  on public.video_reports for insert to authenticated
  with check (auth.uid() = reporter_user_id);

comment on table public.video_reports is
  'RLS contract: INSERT by authenticated user where reporter_user_id = auth.uid(); '
  'SELECT/UPDATE/DELETE are service-role only. Admin reads happen in '
  'src/app/admin/page.tsx and admin writes in src/app/actions/reports.ts, '
  'both using createServiceSupabaseClient() after isAdminEmail() verification.';


-- ============================================================================
-- (3/8) business_inquiries: INSERT public; SELECT/UPDATE/DELETE service-role
-- ============================================================================

alter table public.business_inquiries enable row level security;

do $$
declare pol record;
begin
  for pol in
    select polname from pg_policy
    where polrelid = 'public.business_inquiries'::regclass
      and polcmd <> 'a'
  loop
    execute format('drop policy if exists %I on public.business_inquiries', pol.polname);
  end loop;
end $$;

drop policy if exists "Anyone can submit inquiries" on public.business_inquiries;
create policy "Anyone can submit inquiries"
  on public.business_inquiries for insert with check (true);

comment on table public.business_inquiries is
  'RLS contract: INSERT public (anyone can submit); '
  'SELECT/UPDATE/DELETE are service-role only. Admin reads/writes in '
  'src/app/actions/business-inquiries.ts use createServiceSupabaseClient() '
  'after isAdminEmail() verification.';


-- ============================================================================
-- (4/8) site_settings: SELECT public; INSERT/UPDATE/DELETE service-role
-- ============================================================================

alter table public.site_settings enable row level security;

do $$
declare pol record;
begin
  for pol in
    select polname from pg_policy
    where polrelid = 'public.site_settings'::regclass
  loop
    execute format('drop policy if exists %I on public.site_settings', pol.polname);
  end loop;
end $$;

create policy "site_settings_public_read"
  on public.site_settings for select using (true);

comment on table public.site_settings is
  'RLS contract: SELECT is public; INSERT/UPDATE/DELETE are service-role only. '
  'Admin write surface is POST /api/site-settings, which uses '
  'createServiceSupabaseClient() after isAdminEmail() verification.';


-- ============================================================================
-- (5/8) notifications: SELECT/UPDATE own; INSERT service-role only
-- ============================================================================

alter table public.notifications enable row level security;

drop policy if exists "notifications_insert_system" on public.notifications;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id);

comment on table public.notifications is
  'RLS contract: SELECT/UPDATE by recipient (auth.uid() = user_id); '
  'INSERT is service-role only — recipient identity must be validated by '
  'server business logic before calling createNotification() in '
  'src/lib/notifications.ts.';


-- ============================================================================
-- (6/8) videos: drop over-permissive `using(true)` + duplicate policies
-- ============================================================================

alter table public.videos enable row level security;

drop policy if exists "videos_select" on public.videos;
drop policy if exists "videos_insert" on public.videos;
drop policy if exists "videos_delete" on public.videos;
drop policy if exists "videos_update" on public.videos;

drop policy if exists "videos_select_visible" on public.videos;
create policy "videos_select_visible"
  on public.videos for select
  using (uploaded_by is null OR visibility = 'public' OR auth.uid() = uploaded_by);

drop policy if exists "videos_insert_owner" on public.videos;
create policy "videos_insert_owner"
  on public.videos for insert to authenticated
  with check (uploaded_by = auth.uid());

drop policy if exists "videos_update_owner" on public.videos;
create policy "videos_update_owner"
  on public.videos for update to authenticated
  using (uploaded_by = auth.uid())
  with check (uploaded_by = auth.uid());

drop policy if exists "videos_delete_owner" on public.videos;
create policy "videos_delete_owner"
  on public.videos for delete to authenticated
  using (uploaded_by = auth.uid());

comment on table public.videos is
  'RLS contract: SELECT — uploaded_by IS NULL (legacy) OR visibility = ''public'' OR auth.uid() = uploaded_by. '
  'INSERT/UPDATE/DELETE — uploaded_by = auth.uid() only. Admin overrides '
  '(setVideo*Action, toggleCompetitionFeaturedAction, getCompetitionVideosAction) '
  'use createServiceSupabaseClient() in src/app/actions/admin.ts after isAdminEmail() verification.';


-- ============================================================================
-- (7a/8) profiles: create public_profiles view (additive — depends on
-- 7b code being deployed before 7c is applied)
-- ============================================================================

create or replace view public.public_profiles
with (security_invoker = false)
as
select
  id,
  display_name,
  avatar_url,
  bio,
  banner_url,
  tagline,
  pronouns,
  main_genre,
  subscription_tier,
  is_genova_partner,
  total_awards,
  tools,
  website_url,
  twitter_url,
  instagram_url,
  youtube_url,
  tiktok_url,
  vimeo_url,
  available_for_collab,
  pinned_video_id,
  created_at
from public.profiles;

grant select on public.public_profiles to anon, authenticated;

comment on view public.public_profiles is
  'Public-safe projection of public.profiles. Exposes only the 20 '
  'columns safe for arbitrary readers. Excludes: credits, points '
  '(financial); notify_likes, notify_comments, notify_follows, '
  'custom_ai_tools, hidden_ai_tools, saved_hashtags (preferences); '
  'country (regional); updated_at (internal). View runs as owner '
  '(security_invoker = false) so it survives a future tightening of '
  'public.profiles SELECT policy. Use this view for any read where '
  'the caller is NOT the profile owner — see docs/rls-audit.md §7.';


-- ============================================================================
-- (7c/8) profiles: tighten SELECT to own-only
-- ============================================================================
-- ⚠️ Apply ONLY after the 7b code refactor (commit 5e98bc7) is live.
-- Public profile reads then go through public_profiles (created in 7a).

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

comment on table public.profiles is
  'RLS contract: SELECT — own row only (auth.uid() = id). '
  'For public-safe reads of other users, use the public.public_profiles view. '
  'INSERT/UPDATE remain own-row only. Admin reads via service role.';
```

---

## 4. Final verification

After running the consolidated script, verify the final state matches
the documented contracts:

```sql
-- A. All policies on the affected tables, in a single dump.
select
  c.relname                                        as table_name,
  pol.polname                                      as policy_name,
  case pol.polcmd
    when 'r' then 'SELECT' when 'a' then 'INSERT'
    when 'w' then 'UPDATE' when 'd' then 'DELETE'
    when '*' then 'ALL'
  end                                              as command,
  pg_get_expr(pol.polqual, pol.polrelid)           as using_expr,
  pg_get_expr(pol.polwithcheck, pol.polrelid)      as with_check_expr
from pg_class c
left join pg_policy pol on pol.polrelid = c.oid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'competitions','video_reports','business_inquiries',
    'site_settings','notifications','videos','profiles'
  )
order by c.relname, command nulls first;
```

**Expected** (11 rows total):

| table_name | policy_name | command | using_expr | with_check_expr |
|------------|-------------|---------|-----------|-----------------|
| business_inquiries | Anyone can submit inquiries | INSERT | null | true |
| competitions | Public read competitions | SELECT | true | null |
| notifications | notifications_select_own | SELECT | (auth.uid() = user_id) | null |
| notifications | notifications_update_own | UPDATE | (auth.uid() = user_id) | null |
| profiles | profiles_insert_own | INSERT | null | (auth.uid() = id) |
| profiles | profiles_select_own | SELECT | (auth.uid() = id) | null |
| profiles | profiles_update_own | UPDATE | (auth.uid() = id) | null |
| site_settings | site_settings_public_read | SELECT | true | null |
| video_reports | video_reports_insert_own | INSERT | null | (auth.uid() = reporter_user_id) |
| videos | videos_select_visible | SELECT | ((uploaded_by IS NULL) OR (visibility = 'public') OR (auth.uid() = uploaded_by)) | null |
| videos | videos_insert_owner | INSERT | null | (uploaded_by = auth.uid()) |
| videos | videos_update_owner | UPDATE | (uploaded_by = auth.uid()) | (uploaded_by = auth.uid()) |
| videos | videos_delete_owner | DELETE | (uploaded_by = auth.uid()) | null |

(That's actually 13 rows once `profiles_insert_own` / `profiles_update_own`
and `videos_*_owner` are all counted — the existing insert/update policies
on profiles are preserved by phase 7c.)

```sql
-- B. Sanity probes: anon should NOT be able to read profiles directly,
-- but SHOULD be able to read public_profiles.
begin;
set local role anon;
select count(*) from public.profiles;        -- expect 0
rollback;

begin;
set local role anon;
select count(*) from public.public_profiles; -- expect > 0
rollback;
```

```sql
-- C. View column inventory — should be exactly 20 safe-public columns.
select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'public_profiles'
order by ordinal_position;
```

Expected columns (20): `id, display_name, avatar_url, bio, banner_url,
tagline, pronouns, main_genre, subscription_tier, is_genova_partner,
total_awards, tools, website_url, twitter_url, instagram_url,
youtube_url, tiktok_url, vimeo_url, available_for_collab,
pinned_video_id, created_at`.

---

## 5. Rollback procedures

Per-migration rollback. Each block undoes one migration and is safe to
run independently.

### Rollback (1) competitions
```sql
-- Restores the (unsafe) prior state where any authenticated user could
-- write competitions. Use only for emergency recovery.
create policy "competitions_insert_authenticated"
  on public.competitions for insert to authenticated with check (true);
create policy "competitions_update_authenticated"
  on public.competitions for update to authenticated using (true);
create policy "competitions_delete_authenticated"
  on public.competitions for delete to authenticated using (true);
```

### Rollback (2) video_reports
```sql
create policy "video_reports_select_authenticated"
  on public.video_reports for select to authenticated using (true);
create policy "video_reports_update_authenticated"
  on public.video_reports for update to authenticated using (true) with check (true);
create policy "video_reports_delete_authenticated"
  on public.video_reports for delete to authenticated using (true);
```

### Rollback (3) business_inquiries
```sql
create policy "Authenticated users can read inquiries"
  on public.business_inquiries for select using (auth.uid() IS NOT NULL);
create policy "Authenticated users can update inquiries"
  on public.business_inquiries for update using (auth.uid() IS NOT NULL);
create policy "Authenticated users can delete inquiries"
  on public.business_inquiries for delete using (auth.uid() IS NOT NULL);
```

### Rollback (4) site_settings
```sql
drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "Admin only"
  on public.site_settings for all using (true);
-- NOTE: also revert the route guard in src/app/api/site-settings/route.ts
-- if rolling back the security model fully.
```

### Rollback (5) notifications
```sql
create policy "notifications_insert_system"
  on public.notifications for insert to authenticated
  with check (actor_id IS NULL OR actor_id = auth.uid());
```

### Rollback (6) videos
```sql
create policy "videos_select"
  on public.videos for select using (true);
create policy "videos_insert"
  on public.videos for insert to authenticated with check (true);
create policy "videos_update"
  on public.videos for update to authenticated using (auth.uid() = uploaded_by);
create policy "videos_delete"
  on public.videos for delete to authenticated using (auth.uid() = uploaded_by);
```

### Rollback (7a) public_profiles view
```sql
revoke select on public.public_profiles from anon, authenticated;
drop view if exists public.public_profiles;
```

### Rollback (7c) profiles SELECT
```sql
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select using (true);
```

If rolling back 7c, you do **not** need to touch the view — public_profiles
is independent and remains as the canonical read path for other-user
profile fields.

---

## 6. Open follow-ups

- `hashtag_stats`, `watch_history` tables — RLS state was flagged
  "unverified" in `docs/rls-audit.md §3.18-3.19`. A live dump confirmed
  `hashtag_stats` has RLS on with a single public-SELECT policy
  (safe). `watch_history` was not dumped — check separately if needed.
- Re-runnable verification queries are in `docs/rls-audit.md §6`. Run
  them after any future migration that touches these tables.
- App-layer admin guard (`isAdminEmail()` via `ADMIN_EMAILS` env) is the
  only "admin" concept. There is no DB-level admin role. Any future
  table that admins need to manage should follow the
  `requireAdminWithService()` + service-role pattern documented in
  `src/lib/auth/admin-actions.ts`.
