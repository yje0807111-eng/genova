-- Recovery migration: columns added directly to public.videos via the
-- Supabase Dashboard without recording a migration file.  Discovered
-- by the B3 schema/types drift audit on 2026-05-15: both columns are
-- read and written by application code but no migration declared them,
-- so a fresh `supabase db reset` or CI seed would break the upload
-- edit flow + backdrop rendering.
--
-- Same shape as 20260516120100_competitions_columns_recovery.sql:
--   - all statements `if not exists`, so this is a no-op against the
--     existing live DB
--   - forward-creator against a fresh database
--
-- Code references that depend on these columns:
--   videos.backdrop_url
--     - src/app/actions/video.ts (createVideoAction, updateVideoAction)
--     - src/lib/mappers.ts (mapVideo)
--     - src/lib/types.ts (VideoRow)
--     - src/components/upload/edit-video-form-simple.tsx
--     - src/components/upload/upload-context.tsx
--   videos.genre_changed_at
--     - src/app/actions/video.ts:352,370,401 (one-time genre lock)
--     - src/components/upload/edit-video-form-simple.tsx:45,96
--       (genreLocked flag — disables the genre select after first edit)

alter table public.videos
  add column if not exists backdrop_url text;

comment on column public.videos.backdrop_url is
  'Optional 16:9 hero/backdrop image URL — separate from `thumbnail_url` '
  '(card / list usage).  Used by the watch page hero and feed banner.';

alter table public.videos
  add column if not exists genre_changed_at timestamptz;

comment on column public.videos.genre_changed_at is
  'Stamps the first time the uploader changes the video''s main / sub / '
  'additional genres via /upload/edit.  Once set, the edit form disables '
  'the genre controls (genreLocked) — only one user-initiated genre '
  'change is allowed; operator override requires a manual SQL update.';
