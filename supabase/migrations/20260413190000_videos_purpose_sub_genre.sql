-- 목적·서브장르·메인 장르(slug) 정리 + visibility/thumbnails (이전 마이그레이션 미적용 환경용 보강)

alter table public.videos add column if not exists visibility text not null default 'public'::text
  check (visibility in ('public', 'private'));

alter table public.videos add column if not exists purpose text not null default 'personal'::text
  check (purpose in ('personal', 'competition'));

alter table public.videos add column if not exists sub_genre text null
  check (
    sub_genre is null
    or sub_genre in (
      'romance',
      'sf',
      'action',
      'comedy',
      'thriller',
      'horror',
      'drama',
      'fantasy',
      'mystery',
      'other'
    )
  );

create index if not exists idx_videos_genre on public.videos (genre);
create index if not exists idx_videos_purpose on public.videos (purpose);

-- 기존 한글/짧은 장르 값 → slug
update public.videos
set genre = case trim(genre)
  when '숏필름' then 'short_film'
  when '단편시리즈' then 'series'
  when '단편 시리즈' then 'series'
  when '장편' then 'feature'
  when '다큐멘터리' then 'documentary'
  when '애니메이션' then 'animation'
  when 'MV' then 'mv'
  when '뮤직비디오' then 'mv'
  when '광고' then 'commercial_brand'
  when '광고 / 브랜드 필름' then 'commercial_brand'
  when '실험 / 아트 필름' then 'experimental_art'
  when '밈 / 유머' then 'meme_humor'
  when '기타' then 'other'
  else genre
end
where genre is not null
  and genre not in (
    'short_film',
    'series',
    'feature',
    'documentary',
    'animation',
    'mv',
    'commercial_brand',
    'experimental_art',
    'meme_humor',
    'other'
  );

-- 공모전 출품으로 이미 연결된 작품은 purpose 정리 (선택)
update public.videos
set purpose = 'competition'
where submitted_competition_id is not null
  and purpose = 'personal';

-- thumbnails 버킷 + 객체 정책 (이전 마이그레이션과 중복 적용 가능)
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "thumbnails_public_read" on storage.objects;
create policy "thumbnails_public_read" on storage.objects for select using (bucket_id = 'thumbnails');

drop policy if exists "thumbnails_authenticated_upload" on storage.objects;
create policy "thumbnails_authenticated_upload" on storage.objects for insert to authenticated
with check (
  bucket_id = 'thumbnails'
  and name like auth.uid ()::text || '/%'
);

drop policy if exists "thumbnails_authenticated_update" on storage.objects;
create policy "thumbnails_authenticated_update" on storage.objects for update to authenticated using (
  bucket_id = 'thumbnails'
  and name like auth.uid ()::text || '/%'
);

drop policy if exists "thumbnails_authenticated_delete" on storage.objects;
create policy "thumbnails_authenticated_delete" on storage.objects for delete to authenticated using (
  bucket_id = 'thumbnails'
  and name like auth.uid ()::text || '/%'
);
