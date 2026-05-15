-- Genova 데모 데이터 (영상·크리에이터·선택 프로필)
-- 사용: 로컬/스테이징에서 `psql` 또는 Supabase SQL Editor로 실행
-- src/lib/mock-data.ts 의 ID·필드와 맞춰 검색·fallback 과 동일하게 동작합니다.

-- ---------------------------------------------------------------------------
-- 카탈로그 크리에이터 (creators)
-- ---------------------------------------------------------------------------
insert into public.creators (id, name, avatar_url, bio, is_partner, award_count)
values
  ('c1', '이서하', 'https://i.pravatar.cc/200?img=32', '생성형 AI로 감성 SF를 만드는 디렉터', true, 3),
  ('c2', '박도윤', 'https://i.pravatar.cc/200?img=12', '광고와 뮤직비디오를 넘나드는 비주얼 메이커', false, 1),
  ('c3', '정하린', 'https://i.pravatar.cc/200?img=45', '단편 시리즈 세계관 제작 전문 크리에이터', true, 5)
on conflict (id) do update
set
  name = excluded.name,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio,
  is_partner = excluded.is_partner,
  award_count = excluded.award_count;

-- ---------------------------------------------------------------------------
-- 영상 (videos) — v1~v8, tags/sub_genre/purpose 포함
-- ---------------------------------------------------------------------------
insert into public.videos (
  id,
  title,
  thumbnail_url,
  genre,
  sub_genre,
  purpose,
  creator_id,
  uploaded_by,
  visibility,
  description,
  tags,
  series_name,
  episode_number,
  is_original,
  is_finalist,
  award,
  runtime,
  view_count
)
values
  (
    'v1',
    '네온 파도',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1000&q=80',
    'short_film',
    'sf',
    'personal',
    'c1',
    null,
    'public',
    '생성형 AI로 만든 감성 SF 숏필름.',
    array['SF', '감성', '숏필름', '네온']::text[],
    null,
    null,
    true,
    true,
    '대상',
    '12분',
    42
  ),
  (
    'v2',
    '오로라 시티 챕터1',
    'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=1000&q=80',
    'series',
    'drama',
    'personal',
    'c3',
    null,
    'public',
    '단편 시리즈 세계관 1화.',
    array['시리즈', '오로라', '드라마']::text[],
    '오로라 시티',
    1,
    true,
    true,
    null,
    '18분',
    30
  ),
  (
    'v3',
    '광고: Beyond Taste',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1000&q=80',
    'commercial_brand',
    'comedy',
    'competition',
    'c2',
    null,
    'public',
    '브랜드 필름 광고.',
    array['광고', '코미디', '브랜드']::text[],
    null,
    null,
    false,
    false,
    null,
    '2분',
    18
  ),
  (
    'v4',
    '폴라리스 MV',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1000&q=80',
    'mv',
    null,
    'competition',
    'c2',
    null,
    'public',
    '뮤직비디오.',
    array['MV', '뮤직비디오', '폴라리스']::text[],
    null,
    null,
    false,
    true,
    '관객상',
    '4분',
    88
  ),
  (
    'v5',
    '한강 다큐: 밤의 낚시',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1000&q=80',
    'documentary',
    'drama',
    'personal',
    'c1',
    null,
    'public',
    '도시와 사람을 담은 다큐멘터리.',
    array['다큐', '한강', '밤']::text[],
    null,
    null,
    true,
    false,
    null,
    '25분',
    12
  ),
  (
    'v6',
    '종이로 만든 별 애니메이션',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&q=80',
    'animation',
    'fantasy',
    'personal',
    'c3',
    null,
    'public',
    '스톱모션 애니메이션.',
    array['애니메이션', '스톱모션', '판타지']::text[],
    null,
    null,
    true,
    false,
    null,
    '7분',
    22
  ),
  (
    'v7',
    '실험 영상: 노이즈의 방',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1000&q=80',
    'experimental_art',
    null,
    'personal',
    'c2',
    null,
    'public',
    '실험 / 아트 필름.',
    array['실험영화', '아트', '노이즈']::text[],
    null,
    null,
    true,
    false,
    null,
    '5분',
    9
  ),
  (
    'v8',
    '밈 모음: 월요일을 보내주세요',
    'https://images.unsplash.com/photo-1514533212735-160cac8046cb?w=1000&q=80',
    'meme_humor',
    'comedy',
    'personal',
    'c1',
    null,
    'public',
    '짧은 유머 클립.',
    array['밈', '유머', '코미디']::text[],
    null,
    null,
    false,
    false,
    null,
    '1분',
    6
  )
on conflict (id) do update
set
  title = excluded.title,
  thumbnail_url = excluded.thumbnail_url,
  genre = excluded.genre,
  sub_genre = excluded.sub_genre,
  purpose = excluded.purpose,
  creator_id = excluded.creator_id,
  visibility = excluded.visibility,
  description = excluded.description,
  tags = excluded.tags,
  series_name = excluded.series_name,
  episode_number = excluded.episode_number,
  is_original = excluded.is_original,
  is_finalist = excluded.is_finalist,
  award = excluded.award,
  runtime = excluded.runtime,
  view_count = excluded.view_count;

-- ---------------------------------------------------------------------------
-- 프로필 (profiles) — auth.users 에 동일 id 가 있어야 합니다.
-- 로컬에서만 사용. Dashboard 로 가입한 계정 UUID 로 바꿔 넣거나,
-- 아래 블록을 활성화하려면 먼저 auth.users + auth.identities 를 맞춰야 합니다.
-- 앱은 profiles 가 비어 있어도 MOCK_SEARCH_PROFILES 로 이름 검색을 제공합니다.
-- ---------------------------------------------------------------------------

-- 예시 (주석 해제 전에 auth 스키마에 맞게 조정 필요):
--
-- (선택) auth.users 에 아래 id 가 있으면 주석 해제 — src/lib/mock-data.ts MOCK_SEARCH_PROFILES 와 동일 UUID
-- insert into public.profiles (id, display_name, avatar_url, bio)
-- values
--   ('00000000-0000-4000-8000-000000000c01', '이서하', 'https://i.pravatar.cc/200?img=32', '생성형 AI로 감성 SF를 만드는 디렉터'),
--   ('00000000-0000-4000-8000-000000000c02', '박도윤', 'https://i.pravatar.cc/200?img=12', '광고와 뮤직비디오를 넘나드는 비주얼 메이커'),
--   ('00000000-0000-4000-8000-000000000c03', '정하린', 'https://i.pravatar.cc/200?img=45', '단편 시리즈 세계관 제작 전문 크리에이터')
-- on conflict (id) do update
-- set display_name = excluded.display_name,
--     avatar_url = excluded.avatar_url,
--     bio = excluded.bio;
