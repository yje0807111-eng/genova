ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS pronouns text,
  ADD COLUMN IF NOT EXISTS available_for_collab boolean DEFAULT false,
  -- `videos.id` is `text` (per seed.sql), so the FK column has to be
  -- `text` as well — `uuid` would type-mismatch the reference.  The
  -- live DB already has this as text (added via Supabase Dashboard
  -- before this migration was authored), so the prior `uuid`
  -- declaration was silently masked by `IF NOT EXISTS` and never
  -- ran.  Corrected here so a fresh `supabase db reset` reproduces
  -- the live shape instead of failing on FK type mismatch.
  ADD COLUMN IF NOT EXISTS pinned_video_id text REFERENCES videos(id) ON DELETE SET NULL;
