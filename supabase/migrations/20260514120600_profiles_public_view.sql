-- 20260514120600_profiles_public_view.sql
--
-- Phase 7a (additive — no breakage): create public.public_profiles
-- view exposing only the "safe public" subset of public.profiles
-- columns. Excludes financial (credits, points), preferences
-- (notify_*, custom_ai_tools, hidden_ai_tools, saved_hashtags),
-- regional (country), and internal-metadata (updated_at) columns.
--
-- The view is defined with `security_invoker = false` (default in
-- PG 15+), so it runs as the view OWNER. The owner role bypasses
-- RLS on public.profiles, meaning the view continues to return
-- rows after a later phase (7c) tightens profiles_select_all to
-- own-only.
--
-- Phase 7a is intentionally additive — no app code is migrated in
-- this commit. Phase 7b will audit and migrate non-own profile
-- reads in app code; phase 7c will then tighten the underlying
-- SELECT policy on public.profiles.

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
