ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS pronouns text,
  ADD COLUMN IF NOT EXISTS available_for_collab boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_video_id uuid REFERENCES videos(id) ON DELETE SET NULL;
