-- Support multi-genre selection on uploads:
-- - `genre` remains primary genre (first selected)
-- - `additional_genres` stores extra selected primary genres
-- Also expands sub_genre constraint to match the extended selectable set.

alter table public.videos
  add column if not exists additional_genres text[] not null default '{}'::text[];

alter table public.videos
  drop constraint if exists videos_additional_genres_check;

alter table public.videos
  add constraint videos_additional_genres_check
  check (
    additional_genres <@ array['film','animation','music','daily','art']::text[]
  );

alter table public.videos
  drop constraint if exists videos_sub_genre_check;

alter table public.videos
  add constraint videos_sub_genre_check
  check (
    sub_genre is null
    or sub_genre in (
      'short_film',
      'feature',
      'series',
      'documentary',
      'animation',
      'mv',
      'feed_drama',
      'feed_romance',
      'feed_thriller',
      'feed_horror',
      'feed_sci_fi',
      'feed_action',
      'feed_comedy',
      'feed_fantasy',
      'feed_cinematic_emotional',
      'feed_soundscape',
      'feed_daily_life',
      'feed_travel',
      'feed_food',
      'feed_pets_animals',
      'feed_sports',
      'feed_tutorial',
      'feed_landscape_nature',
      'feed_city_architecture',
      'feed_shocking_viral',
      'feed_dynamic_speed',
      'feed_funny_meme',
      'feed_gaming',
      'feed_fashion_beauty',
      'experimental_art',
      'feed_cyberpunk',
      'feed_asmr_healing',
      'feed_twist',
      'commercial_brand',
      'other'
    )
  );

create index if not exists idx_videos_additional_genres
  on public.videos using gin (additional_genres);
