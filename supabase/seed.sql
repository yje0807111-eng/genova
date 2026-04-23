create table if not exists creators (
  id text primary key,
  name text not null,
  avatar_url text not null,
  bio text not null,
  is_partner boolean default false,
  award_count integer default 0
);

create table if not exists videos (
  id text primary key,
  title text not null,
  thumbnail_url text not null,
  vimeo_id text not null,
  genre text not null,
  creator_id text not null references creators(id),
  is_original boolean default false,
  is_finalist boolean default false,
  award text,
  runtime text not null,
  created_at timestamptz default now()
);

create table if not exists competitions (
  id text primary key,
  title text not null,
  genre text not null,
  status text not null,
  deadline timestamptz not null,
  vote_end timestamptz not null,
  prize_info text not null,
  sponsor text not null
);

create table if not exists votes (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  video_id text not null references videos(id),
  competition_id text not null references competitions(id),
  created_at timestamptz default now()
);

insert into creators (id, name, avatar_url, bio, is_partner, award_count) values
  ('c1', '이서하', 'https://i.pravatar.cc/200?img=32', '생성형 AI로 감성 SF를 만드는 디렉터', true, 3),
  ('c2', '박도윤', 'https://i.pravatar.cc/200?img=12', '광고와 뮤직비디오를 넘나드는 비주얼 메이커', false, 1),
  ('c3', '정하린', 'https://i.pravatar.cc/200?img=45', '단편 시리즈 세계관 제작 전문 크리에이터', true, 5)
on conflict (id) do nothing;

insert into videos (
  id, title, thumbnail_url, vimeo_id, genre, creator_id, is_original, is_finalist, award, runtime, created_at
) values
  ('v1', '네온 파도', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1000&q=80', '76979871', 'short_film', 'c1', true, true, '대상', '12분', now()),
  ('v2', '오로라 시티 챕터1', 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=1000&q=80', '22439234', 'series', 'c3', true, true, null, '18분', now()),
  ('v3', '광고: Beyond Taste', 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1000&q=80', '146022717', 'commercial_brand', 'c2', false, false, null, '2분', now()),
  ('v4', '폴라리스 MV', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1000&q=80', '357274789', 'mv', 'c2', false, true, '관객상', '4분', now())
on conflict (id) do nothing;

insert into competitions (
  id, title, genre, status, deadline, vote_end, prize_info, sponsor
) values
  ('cp1', 'Genova AI 영상 공모전 2026', '전체', '결선 진행중', '2026-05-31T23:59:59+09:00', '2026-06-15T23:59:59+09:00', '총 상금 5,000만원 + Genova Original 계약', 'GENOVA LABS')
on conflict (id) do nothing;
