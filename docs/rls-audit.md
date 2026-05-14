# RLS Policy Audit

> Generated 2026-05-14. Source of truth: `supabase/migrations/*.sql` (29 files reviewed) plus `src/lib/auth/admin.ts`, `src/lib/supabase/{server,service}.ts`, and call sites under `src/app/actions/` and `src/app/admin/`.

## 1. Overview

Row Level Security (RLS) is a Postgres feature that lets you write per-row authorization predicates evaluated as the user-bearing JWT (via `auth.uid()`, `auth.jwt()`, etc.) on every SELECT/INSERT/UPDATE/DELETE issued through PostgREST. Supabase wires the JWT from the user's session cookie into `auth.uid()`, so policies can reference the current user without explicit binding.

**Critical caveat for Genova: there is NO database-level admin role.**

The only "admin" concept is `isAdminEmail()` in `src/lib/auth/admin.ts`, which compares the logged-in user's email to a comma-separated allowlist in the `ADMIN_EMAILS` environment variable:

```ts
// src/lib/auth/admin.ts
return allow.includes(email.toLowerCase());
```

Consequences:

- **RLS policies cannot tell an admin apart from any other authenticated user.** Postgres only sees `auth.uid()`; there is no `is_admin = true` claim in the JWT and no `admins` table referenced in any policy below.
- Admin protections rely entirely on the app layer (`requireAdmin()` guard at the top of each Server Action and the route guard in `src/app/admin/layout.tsx`).
- When an admin Server Action needs to write a row that the **user session** couldn't write (e.g. updating someone else's video or a `competitions` row), the action **must** call `createServiceSupabaseClient()` to bypass RLS. If it calls `createServerSupabaseClient()` (user session) instead, the write will silently fail with an RLS violation.
- See §5 for the audit of which admin actions are correctly using service role vs. which currently rely on absent RLS policies (some appear to write through the user session against tables where no permissive INSERT/UPDATE/DELETE policy exists — these writes will fail under enforced RLS).

Two Supabase clients are in use:

| Client | File | Bypasses RLS? |
|---|---|---|
| `createServerSupabaseClient()` | `src/lib/supabase/server.ts` | No — uses user session cookie. |
| `createServiceSupabaseClient()` | `src/lib/supabase/service.ts` | Yes — uses `SUPABASE_SERVICE_ROLE_KEY`. |

Only 5 files reference the service-role client: `src/app/actions/trophies-admin.ts`, `src/lib/migrations/{seed_competitions,run_migration}.ts`, `src/app/api/cron/cleanup-mux/route.ts`, and the helper itself.

---

## 2. Table inventory

Alphabetical. "Introduced in" = the earliest migration that touches RLS for that table; column-only migrations aren't listed here.

| Table | RLS enabled? | Introduced in migration |
|---|---|---|
| `public.comment_likes` | Yes | `20260413210000_likes_comments_engagement.sql` |
| `public.comments` | Yes | `20260413210000_likes_comments_engagement.sql` |
| `public.competitions` | Yes | `20260413000000_votes_unique_and_rls.sql` |
| `public.creators` | Yes | `20260413000000_votes_unique_and_rls.sql` |
| `public.credit_transactions` | Yes | `20260422150000_profiles_credits_points_transactions.sql` |
| `public.follows` | Yes | `20260413140000_profiles_follows_saved_storage.sql` |
| `public.hashtag_stats` | ⚠️ Not enabled in migrations | `20260506001000_hashtag_stats.sql` (no `enable row level security`) |
| `public.likes` | Yes | `20260413210000_likes_comments_engagement.sql` |
| `public.notifications` | Yes | `20260414090000_notifications.sql` |
| `public.profiles` | Yes | `20260413140000_profiles_follows_saved_storage.sql` |
| `public.saved_videos` | Yes | `20260413140000_profiles_follows_saved_storage.sql` |
| `public.site_settings` | ⚠️ Not enabled in migrations | `20260503100000_site_settings.sql` (no `enable row level security`) |
| `public.trophies` | Yes | `20260422120000_trophies.sql` |
| `public.user_awards` | Yes | `20260413140000_profiles_follows_saved_storage.sql` |
| `public.video_reports` | Yes | `20260505235500_video_reports_rls.sql` |
| `public.videos` | Yes | `20260413000000_votes_unique_and_rls.sql` (RLS toggle) ; final policy set in `20260413240000_upload_rls_profiles_storage_videos.sql` |
| `public.votes` | Yes | `20260413000000_votes_unique_and_rls.sql` |
| `public.watch_history` | ⚠️ Unclear | Referenced in `20260505230000_watch_history_view_count_increments.sql` (ALTER only); table-creation + RLS migration is not in the audited set |
| `public.business_inquiries` | ⚠️ Unclear | Referenced by `src/app/actions/business-inquiries.ts`; no migration in this set |

`storage.objects` policies (per-bucket) are listed in §4.

---

## 3. Policy matrix

For each cell: ✅ allowed (predicate) / ❌ denied / ⚠️ conditional. Policy names quoted; predicates paraphrased from the final `create policy` in the migration timeline.

### 3.1 `public.comment_likes`

| Op | Anonymous | Authenticated (not owner) | Owner (`auth.uid() = user_id`) |
|---|---|---|---|
| SELECT | ✅ — `comment_likes_select_all` `using (true)` | ✅ same | ✅ same |
| INSERT | ❌ policy restricts to `authenticated` role | ⚠️ — `comment_likes_insert_own` with check `auth.uid() = user_id`; allowed only when inserting your own row | ✅ |
| UPDATE | ❌ no policy | ❌ no policy | ❌ no policy |
| DELETE | ❌ restricted to `authenticated` | ❌ `comment_likes_delete_own` `using (auth.uid() = user_id)` | ✅ |

### 3.2 `public.comments`

| Op | Anonymous | Authenticated (not author) | Author |
|---|---|---|---|
| SELECT | ✅ — `comments_select_all` `using (true)` | ✅ | ✅ |
| INSERT | ❌ | ⚠️ `comments_insert_auth` to `authenticated` with check `auth.uid() = user_id` — can only post as self | ✅ |
| UPDATE | ❌ no policy | ❌ no policy | ❌ no policy (no edits possible under RLS) |
| DELETE | ❌ | ❌ `comments_delete_own` `using (auth.uid() = user_id)` | ✅ |

### 3.3 `public.competitions`

| Op | Anonymous | Authenticated | Admin (app-layer only) |
|---|---|---|---|
| SELECT | ✅ — `Public read competitions` `using (true)` | ✅ | ✅ |
| INSERT | ❌ no policy | ❌ no policy | ❌ via user session (would need service role; see §5) |
| UPDATE | ❌ no policy | ❌ no policy | ❌ via user session |
| DELETE | ❌ no policy | ❌ no policy | ❌ via user session |

### 3.4 `public.creators`

| Op | Anonymous | Authenticated | Notes |
|---|---|---|---|
| SELECT | ✅ — `Public read creators` `using (true)` | ✅ | Legacy seed data (per migration comment). |
| INSERT | ❌ no policy | ❌ no policy | |
| UPDATE | ❌ no policy | ❌ no policy | |
| DELETE | ❌ no policy | ❌ no policy | |

### 3.5 `public.credit_transactions`

| Op | Anonymous | Authenticated (not owner) | Owner |
|---|---|---|---|
| SELECT | ❌ restricted to `authenticated` | ❌ `credit_transactions_select_own` `using (auth.uid() = user_id)` | ✅ |
| INSERT | ❌ | ❌ no policy | ❌ no policy (writes must go through service role) |
| UPDATE | ❌ | ❌ no policy | ❌ no policy |
| DELETE | ❌ | ❌ no policy | ❌ no policy |

### 3.6 `public.follows`

| Op | Anonymous | Authenticated (not follower) | Follower (`auth.uid() = follower_id`) |
|---|---|---|---|
| SELECT | ✅ — `follows_select_all` `using (true)` | ✅ | ✅ |
| INSERT | ❌ (no `to` clause — defaults to `public`, but predicate `auth.uid() = follower_id` excludes anon) | ⚠️ `follows_insert_self` with check `auth.uid() = follower_id` | ✅ |
| UPDATE | ❌ no policy | ❌ no policy | ❌ no policy |
| DELETE | ❌ | ❌ `follows_delete_self` `using (auth.uid() = follower_id)` | ✅ |

### 3.7 `public.hashtag_stats`

⚠️ **RLS not enabled in migrations.** Writes happen exclusively through `public.increment_hashtag_stat(text, text)` (SECURITY DEFINER, granted to anon + authenticated). Direct table writes from a session that has no RLS protection are unrestricted by Postgres. Verify on the live DB whether RLS was enabled manually.

### 3.8 `public.likes`

| Op | Anonymous | Authenticated (not owner) | Owner |
|---|---|---|---|
| SELECT | ✅ — `likes_select_all` `using (true)` | ✅ | ✅ |
| INSERT | ❌ | ⚠️ `likes_insert_own` to `authenticated` with check `auth.uid() = user_id` | ✅ |
| UPDATE | ❌ no policy | ❌ no policy | ❌ no policy |
| DELETE | ❌ | ❌ `likes_delete_own` to `authenticated` `using (auth.uid() = user_id)` | ✅ |

### 3.9 `public.notifications`

| Op | Anonymous | Authenticated (not recipient) | Recipient (`auth.uid() = user_id`) |
|---|---|---|---|
| SELECT | ❌ restricted to `authenticated` | ❌ `notifications_select_own` `using (auth.uid() = user_id)` | ✅ |
| INSERT | ❌ | ⚠️ `notifications_insert_system` to `authenticated` with check `actor_id is null OR actor_id = auth.uid()` — any authenticated user can insert a notification **for any recipient**, as long as they declare themselves as `actor_id` (or null actor). The `user_id` (recipient) is NOT constrained. See §5. | ⚠️ same |
| UPDATE | ❌ | ❌ `notifications_update_own` `using (auth.uid() = user_id)` — recipient can mark own notifications read | ✅ |
| DELETE | ❌ no policy | ❌ no policy | ❌ no policy |

### 3.10 `public.profiles`

| Op | Anonymous | Authenticated (not owner) | Owner (`auth.uid() = id`) |
|---|---|---|---|
| SELECT | ✅ — `profiles_select_all` `using (true)` | ✅ | ✅ |
| INSERT | ❌ — final state is `profiles_insert_own` to `authenticated` with check `auth.uid() = id` (final form in `20260413240000`) | ⚠️ predicate fails (id must equal `auth.uid()`) | ✅ |
| UPDATE | ❌ | ❌ `profiles_update_own` `using (auth.uid() = id)` — no WITH CHECK; PostgREST defaults to USING for both. | ✅ |
| DELETE | ❌ no policy | ❌ no policy | ❌ no policy (cascade via auth.users delete only) |

### 3.11 `public.saved_videos`

| Op | Anonymous | Authenticated (not owner) | Owner |
|---|---|---|---|
| SELECT | ❌ predicate `auth.uid() = user_id` fails for anon | ❌ `saved_select_own` | ✅ |
| INSERT | ❌ | ❌ `saved_insert_own` with check `auth.uid() = user_id` | ✅ |
| UPDATE | ❌ no policy | ❌ no policy | ❌ no policy |
| DELETE | ❌ | ❌ `saved_delete_own` `using (auth.uid() = user_id)` | ✅ |

### 3.12 `public.site_settings`

⚠️ **RLS not enabled in migrations.** Treat as fully accessible until verified on the live DB.

### 3.13 `public.trophies`

| Op | Anonymous | Authenticated | Notes |
|---|---|---|---|
| SELECT | ✅ — `trophies_select_public` `using (true)` | ✅ | |
| INSERT | ❌ no policy | ❌ no policy | Writes via service role (see comment in migration: "Writes are performed with the service role"). Confirmed: `trophies-admin.ts` uses `createServiceSupabaseClient()`. |
| UPDATE | ❌ no policy | ❌ no policy | |
| DELETE | ❌ no policy | ❌ no policy | |

### 3.14 `public.user_awards`

| Op | Anonymous | Authenticated (not owner) | Owner |
|---|---|---|---|
| SELECT | ✅ — `user_awards_select_all` `using (true)` | ✅ | ✅ |
| INSERT | ❌ | ⚠️ `user_awards_insert_own` with check `auth.uid() = user_id` (no `to` clause; anon would fail because `auth.uid()` is null) | ✅ |
| UPDATE | ❌ no policy | ❌ no policy | ❌ no policy |
| DELETE | ❌ | ❌ `user_awards_delete_own` `using (auth.uid() = user_id)` | ✅ |

### 3.15 `public.video_reports`

| Op | Anonymous | Authenticated (any) | Reporter (self) |
|---|---|---|---|
| SELECT | ❌ restricted to `authenticated` | ✅ `video_reports_select_authenticated` `using (true)` — **any logged-in user can read every report** (see §5) | ✅ |
| INSERT | ❌ | ⚠️ `video_reports_insert_own` to `authenticated` with check `auth.uid() = reporter_user_id` | ✅ |
| UPDATE | ❌ | ✅ `video_reports_update_authenticated` `using (true) with check (true)` — **any logged-in user can update any report's status field** (see §5) | ✅ |
| DELETE | ❌ | ✅ `video_reports_delete_authenticated` to `authenticated` `using (true)` — **any logged-in user can delete any report** (see §5) | ✅ |

### 3.16 `public.videos`

The policy set was rewritten in `20260413240000_upload_rls_profiles_storage_videos.sql`. The migration explicitly drops the legacy `"Public read videos"` (`using (true)`) policy first.

| Op | Anonymous | Authenticated (not uploader) | Uploader (`auth.uid() = uploaded_by`) |
|---|---|---|---|
| SELECT | ⚠️ `videos_select_visible` `using (uploaded_by is null OR visibility = 'public' OR auth.uid() = uploaded_by)` — anon can read all rows where `uploaded_by IS NULL` (legacy / seed rows) **and** all `visibility = 'public'` rows. | ⚠️ same predicate — also see own private rows. | ✅ |
| INSERT | ❌ restricted to `authenticated` | ⚠️ `videos_insert_owner` to `authenticated` with check `uploaded_by = auth.uid()` | ✅ |
| UPDATE | ❌ | ❌ `videos_update_owner` to `authenticated` `using (uploaded_by = auth.uid()) with check (uploaded_by = auth.uid())` | ✅ |
| DELETE | ❌ | ❌ `videos_delete_owner` to `authenticated` `using (uploaded_by = auth.uid())` | ✅ |

### 3.17 `public.votes`

| Op | Anonymous | Authenticated (not voter) | Voter (`auth.uid() = user_id`) |
|---|---|---|---|
| SELECT | ❌ predicate fails for anon | ❌ `Users read own votes` `using (auth.uid() = user_id)` — **no one can see other users' votes** | ✅ |
| INSERT | ❌ | ⚠️ `Users insert own votes` with check `auth.uid() = user_id` (no `to` clause — defaults to public; anon fails on null `auth.uid()`) | ✅ |
| UPDATE | ❌ no policy | ❌ no policy | ❌ no policy |
| DELETE | ❌ no policy | ❌ no policy | ❌ no policy (votes cannot be retracted under RLS) |

### 3.18 `public.watch_history`

⚠️ **Unclear** — table is referenced in `20260505230000_watch_history_view_count_increments.sql` (ALTER ADD COLUMN only); the original `CREATE TABLE` + `enable row level security` migration is not in the audited set. Code under `src/lib/queries/watch-history-queries.ts` performs upsert+select via `createServerSupabaseClient` (user session), implying owner-bound policies exist. Verify on the live DB.

### 3.19 `public.business_inquiries`

⚠️ **Unclear** — referenced by `src/app/actions/business-inquiries.ts`; no migration in this set creates the table or its policies. Verify on the live DB.

---

## 4. Storage buckets

Bucket definitions are in `storage.buckets`; access control is in `storage.objects` policies. All policies use the convention `bucket_id = '<bucket>' AND name like 'auth.uid()::text/%'` (or `split_part(name, '/', 1) = auth.uid()::text` in the rewritten thumbnails set).

| Bucket | Public | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `avatars` | Yes | `avatars_public_read` — anyone (anon + auth): `using (bucket_id = 'avatars')` | `avatars_authenticated_upload` to `authenticated` with check `name like auth.uid()::text || '/%'` | `avatars_authenticated_update` to `authenticated` `using (...)` (same predicate) | `avatars_authenticated_delete` to `authenticated` `using (...)` (same predicate) |
| `thumbnails` | Yes | `thumbnails_public_read` — anyone: `using (bucket_id = 'thumbnails')` | `thumbnails_authenticated_upload` to `authenticated` with check `split_part(name, '/', 1) = auth.uid()::text` (final form per `20260413240000`) | `thumbnails_authenticated_update` to `authenticated` `using (...)` | `thumbnails_authenticated_delete` to `authenticated` `using (...)` |

Notes:
- Every other `storage.objects` row in any other bucket (if any exist — none defined in migrations) would be **fully denied** since storage.objects RLS is on by default in Supabase managed projects.
- The migration history rewrites thumbnails policies twice. The final version uses `split_part(name, '/', 1)` to avoid the LIKE pattern false-positive risk where a path like `<some-uuid>othertext/...` would match `<some-uuid>/%`. **Avatars policies still use the LIKE form** — see §5.

---

## 5. Regression risks & known concerns

### 5.1 Tables with `using (true)` on SELECT (public read)

The following tables expose every row to **anonymous (unauthenticated) clients**. Verify that this is intentional and that no sensitive columns leak:

- `public.comment_likes` (`comment_likes_select_all`)
- `public.comments` (`comments_select_all`)
- `public.competitions` (`Public read competitions`)
- `public.creators` (`Public read creators`)
- `public.follows` (`follows_select_all`) — **the follow graph is fully public.** Any anonymous client can enumerate `follower_id → following_id` pairs.
- `public.likes` (`likes_select_all`)
- `public.profiles` (`profiles_select_all`) — exposes `credits`, `points`, `country`, `notify_*` preferences, contact URLs, `is_genova_partner`, `subscription_tier`. Consider whether financial/personal columns should be restricted.
- `public.trophies` (`trophies_select_public`)
- `public.user_awards` (`user_awards_select_all`)

### 5.2 `video_reports` is over-permissive

Per migration `20260505235500_video_reports_rls.sql` and `20260506000000_video_reports_delete_policy.sql`:

- SELECT: any authenticated user can read **every** report (`using (true)`), including PII inside `detail`.
- UPDATE: any authenticated user can change **any** report's status (`using (true) with check (true)`).
- DELETE: any authenticated user can delete **any** report (`using (true)`).

There is no DB-level admin distinction; the intent is "admin dashboard reads/edits reports," but RLS gives the same powers to every signed-in user. The app-layer `requireAdmin()` in `src/app/actions/reports.ts` is the only guard. If admin Server Actions are ever bypassed (e.g. someone hits PostgREST directly with a logged-in token), the data is exposed.

### 5.3 `notifications.insert` allows spoofed recipients

`notifications_insert_system` has `with check (actor_id is null OR actor_id = auth.uid())`. The `user_id` (recipient) is **not constrained**. Any authenticated user can insert a notification targeting any other user's inbox, as long as `actor_id` is themselves (or null).

### 5.4 Tables without DELETE policies — deletes silently fail under RLS

These tables have RLS on but no `for delete` policy, so user-session DELETEs will return 0 rows affected (PostgREST returns success with empty result; no error):

- `public.comment_likes` — covered ✅ (has delete)
- `public.competitions` — **no delete policy.** `deleteCompetitionAction()` in `src/app/actions/admin.ts:215-226` calls `supabase.from("competitions").delete().eq("id", id)` on the **user-session** client. **This will silently fail.** It only worked historically if RLS was off, or relied on service-role behavior elsewhere.
- `public.credit_transactions` — no delete policy (intended; financial ledger).
- `public.creators` — no delete policy.
- `public.notifications` — no delete policy.
- `public.profiles` — no delete policy (cascade only via `auth.users` delete).
- `public.trophies` — no delete policy (service-role only).
- `public.user_awards` — has delete ✅ (owner only).
- `public.videos` — has delete ✅ (uploader only).
- `public.votes` — **no delete policy.** Votes are immutable from the user's perspective.

### 5.5 Tables where INSERT predicate does NOT tie to `auth.uid()` — spoof risk

- `public.notifications` — `user_id` not constrained (see 5.3).
- `public.video_reports` — `reporter_user_id` is constrained (`auth.uid() = reporter_user_id`). OK.
- `public.videos` — `uploaded_by = auth.uid()` enforced. OK.
- All other tables: their INSERT predicates correctly bind a user-ID column to `auth.uid()`.

### 5.6 Admin actions that depend on absent RLS policies (will FAIL under enforced RLS, user session)

`src/app/actions/admin.ts` uses `createServerSupabaseClient()` (user session) — NOT service role — for the following writes:

| Action | Target | Op | RLS policy exists? | Result |
|---|---|---|---|---|
| `createCompetitionAction` | `competitions` | INSERT | ❌ none | **Will fail** under RLS |
| `updateCompetitionAction` | `competitions` | UPDATE | ❌ none | **Will fail** under RLS |
| `updateCompetitionStatusAction` | `competitions` | UPDATE | ❌ none | **Will fail** under RLS |
| `deleteCompetitionAction` | `competitions` | DELETE | ❌ none | **Will fail** under RLS |
| `setVideoFinalistAction` | `videos` (any uploader) | UPDATE | ⚠️ `videos_update_owner` only allows uploader | **Will fail** if admin is not the uploader |
| `setVideoOriginalAction` | `videos` (any uploader) | UPDATE | ⚠️ same | **Will fail** if admin is not the uploader |
| `setVideoAwardAction` | `videos` (any uploader) | UPDATE | ⚠️ same | **Will fail** if admin is not the uploader |
| `toggleCompetitionFeaturedAction` | `videos` (any uploader) | UPDATE | ⚠️ same | **Will fail** if admin is not the uploader |
| `toggleCompetitionFeaturedFlagAction` | `competitions` | UPDATE | ❌ none | **Will fail** under RLS |

**Either** the live DB has additional RLS policies not present in `supabase/migrations/`, **or** these admin actions are currently broken in production for the documented RLS state. Verify by running the SQL probes in §6 against the live DB.

`src/app/actions/trophies-admin.ts` correctly uses `createServiceSupabaseClient()` for `trophies` writes. `src/app/actions/reports.ts` uses user session, which works because `video_reports` has `using (true)` on update/delete (see 5.2).

### 5.7 Tables with RLS enabled but ZERO policies (fully locked except service role)

None in the migration set — every table that has `enable row level security` also has at least one policy. (`competitions`, `creators`, `trophies` have only SELECT; their other ops are effectively service-role-only, which is the intended pattern.)

### 5.8 Avatars storage uses LIKE — minor edge case

`avatars_*` policies use `name like auth.uid()::text || '/%'`. If a UUID-prefixed name were also a prefix of another UUID (impossible given hyphenated UUID format, but a brittle convention), this would over-match. The `thumbnails_*` policies were already rewritten to `split_part(name, '/', 1) = auth.uid()::text`; consider aligning `avatars_*` for consistency.

### 5.9 Tables of unverified RLS state

- `public.watch_history` — RLS state and policy set unknown from this migration set.
- `public.business_inquiries` — table and RLS unknown from this migration set.
- `public.hashtag_stats` — RLS not enabled in migration; verify live DB.
- `public.site_settings` — RLS not enabled in migration; verify live DB. Admin Server Actions write to this table through user session (see `src/app/actions/admin.ts` or related). If RLS is off, fine; if it's on with no policies, those writes will fail.

---

## 6. Verification SQL snippets

Paste into Supabase SQL Editor. The `set local role` + `set local request.jwt.claim.sub` pattern simulates a specific user. Run inside a single transaction so the `set local` resets after `commit/rollback`.

> Replace `<UUID-A>`, `<UUID-B>`, `<VIDEO-ID>`, `<COMP-ID>` with real values from your DB.

### 6.1 `public.videos`

```sql
-- 6.1.a anon can SELECT public + null-uploader rows
begin;
set local role anon;
select count(*) from public.videos where visibility = 'public';  -- expect: > 0
select count(*) from public.videos where visibility = 'private';  -- expect: 0
rollback;

-- 6.1.b authenticated non-uploader CANNOT see another user's private rows
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-A>';
select count(*) from public.videos where uploaded_by = '<UUID-B>' and visibility = 'private';  -- expect: 0
rollback;

-- 6.1.c uploader CAN see own private rows
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-A>';
select count(*) from public.videos where uploaded_by = '<UUID-A>' and visibility = 'private';
rollback;

-- 6.1.d anon CANNOT update
begin;
set local role anon;
update public.videos set title = 'x' where id = '<VIDEO-ID>';  -- expect: 0 rows; no error
rollback;

-- 6.1.e non-uploader CANNOT update someone else's video (regression for admin actions)
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-A>';
update public.videos set award = 'test' where uploaded_by = '<UUID-B>';  -- expect: 0 rows
rollback;
```

### 6.2 `public.profiles`

```sql
-- 6.2.a anon can SELECT all profiles (intentional?)
begin;
set local role anon;
select count(*) from public.profiles;  -- expect: total profile count
rollback;

-- 6.2.b sensitive columns are visible to anon (intentional?)
begin;
set local role anon;
select id, credits, points, country from public.profiles limit 5;  -- expect: rows returned
rollback;

-- 6.2.c authenticated CANNOT update another user's profile
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-A>';
update public.profiles set display_name = 'spoof' where id = '<UUID-B>';  -- expect: 0 rows
rollback;

-- 6.2.d owner CAN update own profile
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-A>';
update public.profiles set tagline = 'self update' where id = '<UUID-A>';  -- expect: 1 row
rollback;
```

### 6.3 `public.competitions`

```sql
-- 6.3.a anon can SELECT competitions
begin;
set local role anon;
select count(*) from public.competitions;  -- expect: total
rollback;

-- 6.3.b authenticated CANNOT insert a competition (admin uses user session — verify it really fails)
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-OF-ADMIN-EMAIL-USER>';
insert into public.competitions (id, title, genre, status) values ('test-rls', 'x', 'All', 'Open');  -- expect: ERROR new row violates RLS
rollback;

-- 6.3.c authenticated CANNOT delete (regression for deleteCompetitionAction)
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-OF-ADMIN-EMAIL-USER>';
delete from public.competitions where id = '<COMP-ID>';  -- expect: 0 rows; deleteCompetitionAction is broken
rollback;
```

### 6.4 `public.votes`

```sql
-- 6.4.a anon CANNOT read any vote
begin;
set local role anon;
select count(*) from public.votes;  -- expect: 0
rollback;

-- 6.4.b authenticated user can only see own votes
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-A>';
select count(*) from public.votes where user_id <> '<UUID-A>';  -- expect: 0
rollback;

-- 6.4.c authenticated cannot insert a vote spoofing another user
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-A>';
insert into public.votes (user_id, video_id, competition_id) values ('<UUID-B>', '<VIDEO-ID>', '<COMP-ID>');  -- expect: ERROR violates RLS
rollback;

-- 6.4.d votes are immutable — no UPDATE or DELETE policy
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-A>';
delete from public.votes where user_id = '<UUID-A>';  -- expect: 0 rows
rollback;
```

### 6.5 `public.video_reports`

```sql
-- 6.5.a anon CANNOT read reports
begin;
set local role anon;
select count(*) from public.video_reports;  -- expect: 0
rollback;

-- 6.5.b ANY authenticated user can read EVERY report (over-permissive)
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-OF-NON-ADMIN>';
select count(*) from public.video_reports;  -- expect: total count (regression — should be admin-only)
rollback;

-- 6.5.c ANY authenticated user can DELETE any report (over-permissive)
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-OF-NON-ADMIN>';
delete from public.video_reports where id = '<REPORT-ID>';  -- expect: 1 row (regression)
rollback;

-- 6.5.d Reporter constraint on insert is enforced
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-A>';
insert into public.video_reports (video_id, reporter_user_id, scope, reason)
values ('<VIDEO-ID>', '<UUID-B>', 'video', 'spam');  -- expect: ERROR violates RLS
rollback;
```

### 6.6 `public.notifications`

```sql
-- 6.6.a anon CANNOT read
begin;
set local role anon;
select count(*) from public.notifications;  -- expect: 0
rollback;

-- 6.6.b authenticated user only sees own notifications
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-A>';
select count(*) from public.notifications where user_id <> '<UUID-A>';  -- expect: 0
rollback;

-- 6.6.c any authenticated user CAN insert a notification with arbitrary recipient (spoof risk)
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-A>';
insert into public.notifications (user_id, actor_id, type, title)
values ('<UUID-B>', '<UUID-A>', 'comment', 'spoofed notification');  -- expect: 1 row (regression — see §5.3)
rollback;

-- 6.6.d no delete policy exists
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-A>';
delete from public.notifications where user_id = '<UUID-A>';  -- expect: 0 rows
rollback;
```

### 6.7 Storage smoke tests

```sql
-- Avatars: anyone can read; only owner-prefixed path can write
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-A>';
insert into storage.objects (bucket_id, name, owner)
values ('avatars', '<UUID-B>/test.png', '<UUID-A>'::uuid);  -- expect: ERROR (name does not start with auth.uid())
rollback;

-- Thumbnails: split_part check
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = '<UUID-A>';
insert into storage.objects (bucket_id, name, owner)
values ('thumbnails', '<UUID-A>/x.jpg', '<UUID-A>'::uuid);  -- expect: 1 row
rollback;
```

---

## 7. Recommended regression checklist

Re-run after any migration touching policies. Each item maps to a probe in §6.

- [ ] `videos`: anon sees only `visibility='public'` rows + `uploaded_by IS NULL` legacy rows (§6.1.a/b).
- [ ] `videos`: a non-uploader authenticated user CANNOT update someone else's video — verify `setVideoFinalistAction` / `setVideoOriginalAction` / `setVideoAwardAction` / `toggleCompetitionFeaturedAction` either (a) target the uploader's own video, or (b) have been migrated to use `createServiceSupabaseClient()` (§6.1.e, §5.6).
- [ ] `competitions`: confirm whether INSERT/UPDATE/DELETE policies exist on the live DB. If not, migrate `createCompetitionAction`, `updateCompetitionAction`, `updateCompetitionStatusAction`, `deleteCompetitionAction`, `toggleCompetitionFeaturedFlagAction` in `src/app/actions/admin.ts` to use `createServiceSupabaseClient()` (§6.3.b/c, §5.6).
- [ ] `votes`: anon read returns 0; cross-user vote read returns 0; vote spoof insert rejected; votes have no delete path (§6.4).
- [ ] `video_reports`: confirm if the broad `using (true)` policies are intentional. If they should be admin-only, replace with a check that the caller's email is in the admins list — but since there's no DB admin concept, the right fix is to move report SELECT/UPDATE/DELETE through service-role server actions and tighten policies to deny non-reporter access (§6.5.b/c, §5.2).
- [ ] `notifications`: confirm that the open `with check (actor_id is null OR actor_id = auth.uid())` predicate is acceptable. If unwanted, add a constraint that recipient `user_id` matches a target the actor is permitted to notify (e.g. a videoʼs uploader for `like`/`comment` types) (§6.6.c, §5.3).
- [ ] `profiles`: confirm anon read access to financial columns (`credits`, `points`) and creator settings is intentional. If not, split into a public view + a private table, or replace the policy with a column-aware one (§6.2.b, §5.1).
- [ ] `follows`: confirm anon read of the full follow graph is intentional (§5.1).
- [ ] `comments` / `likes` / `comment_likes`: confirm anon read of every comment / like is intentional (§5.1).
- [ ] `trophies`: confirm `trophies-admin.ts` continues to use `createServiceSupabaseClient()`; no user-session writes (§5.6 OK row).
- [ ] `storage.objects` avatars: consider migrating the `LIKE` predicate to `split_part(name, '/', 1) = auth.uid()::text` for parity with `thumbnails` (§5.8).
- [ ] `hashtag_stats`: verify RLS state on the live DB and either enable RLS with explicit policies or document the intent to leave it open (§5.9).
- [ ] `site_settings`: verify RLS state on the live DB; if RLS is enabled there, ensure admin writes use service role (§5.9).
- [ ] `watch_history`, `business_inquiries`: locate the original creation migrations on the live DB or in the broader migration history; document their RLS shape in this report on next pass (§5.9).
