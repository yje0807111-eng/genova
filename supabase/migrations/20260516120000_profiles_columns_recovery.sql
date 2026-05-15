-- Recovery migration: columns added directly to public.profiles via
-- Supabase Dashboard SQL Editor without recording a migration file.
-- Captured from a live `information_schema.columns` dump on 2026-05-16.
--
-- All `add column` statements are `if not exists`, so this migration
-- is:
--   - a no-op against the existing live DB (columns already present)
--   - a forward-creator against a fresh database (e.g. `supabase db
--     reset` for local dev or a new staging environment)
--
-- Without this file, `supabase db reset` produced a profiles table
-- missing seven columns, which then made the public_profiles VIEW
-- migration (20260514120600) fail to compile (it SELECTs website_url,
-- twitter_url, instagram_url, youtube_url — none of which any
-- preceding migration creates).

-- Social-link columns referenced by the public_profiles view + the
-- Profile type / mapProfile in src/lib/queries/profile-queries.ts.
alter table public.profiles add column if not exists website_url text;
alter table public.profiles add column if not exists twitter_url text;
alter table public.profiles add column if not exists instagram_url text;
alter table public.profiles add column if not exists youtube_url text;

-- AI tool preferences (jsonb arrays).  Used by ProfileSettingsClient
-- for the "custom tools" / "hidden tools" lists; mapProfile leaves
-- these as raw-row reads since the UI only writes them.
alter table public.profiles
  add column if not exists custom_ai_tools jsonb default '[]'::jsonb;
alter table public.profiles
  add column if not exists hidden_ai_tools jsonb default '[]'::jsonb;

-- Saved hashtag list — read/write by updateSavedHashtagsAction
-- (src/app/actions/profile.ts).
alter table public.profiles
  add column if not exists saved_hashtags jsonb default '[]'::jsonb;
