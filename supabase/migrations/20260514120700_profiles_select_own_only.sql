-- 20260514120700_profiles_select_own_only.sql
--
-- Phase 7c (final lockdown): tightens public.profiles SELECT to
-- own-only.  After this migration, direct SELECT against
-- public.profiles returns only the caller's own row.  Public
-- profile reads (uploader sidebars, search results, comments,
-- chat partners, etc.) flow through the public_profiles view
-- created in phase 7a (commit d829941) and exercised by phase 7b
-- (commit 5e98bc7).
--
-- DO NOT apply this migration to the live DB until phase 7b has
-- been deployed and verified in production.  Suggested smoke
-- coverage before flipping:
--
--   - Anon home / /watch/[id] / /profile/[id] / /competition/[id]
--   - Authenticated non-owner viewing another user's /profile/[id]
--   - Authenticated viewing /credits and /profile/settings (own —
--     these still use fetchOwnProfile against public.profiles)
--   - Chat drawer (browser client) — conversations, following,
--     discover tabs
--   - Search results video uploader display_name
--
-- Rollback (if a regression appears):
--
--   drop policy if exists "profiles_select_own" on public.profiles;
--   create policy "profiles_select_all"
--     on public.profiles for select using (true);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

comment on table public.profiles is
  'RLS contract: SELECT — own row only (auth.uid() = id). '
  'For public-safe reads of other users (display_name, avatar_url, '
  'bio, banner_url, tagline, pronouns, main_genre, subscription_tier, '
  'is_genova_partner, total_awards, tools, social URLs, '
  'available_for_collab, pinned_video_id, created_at), use the '
  'public.public_profiles view instead.  INSERT/UPDATE remain own-row '
  'only (profiles_insert_own, profiles_update_own).  Admin reads of '
  'arbitrary profiles must go through createServiceSupabaseClient().';
