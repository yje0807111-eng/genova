-- 태그 · 단편 시리즈 메타
alter table public.videos add column if not exists tags text[] not null default '{}'::text[];

alter table public.videos add column if not exists series_name text null;

alter table public.videos add column if not exists episode_number integer null;

alter table public.videos drop constraint if exists videos_episode_positive;

alter table public.videos
  add constraint videos_episode_positive check (episode_number is null or episode_number >= 1);

create index if not exists idx_videos_series on public.videos (uploaded_by, series_name, episode_number)
  where series_name is not null and episode_number is not null;
