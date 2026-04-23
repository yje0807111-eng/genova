-- videos 테이블 필수 컬럼 일괄 보강 (이전 마이그레이션 미적용·부분 적용 환경용)
-- 기존 파일에 이미 정의된 경우 IF NOT EXISTS 로 스킵됩니다:
--   20260413160000, 20260413190000 — visibility, purpose, sub_genre
--   20260413200000 — tags, series_name, episode_number
--   20260413220000 — view_count

-- 공개 범위
alter table public.videos add column if not exists visibility text not null default 'public'::text
  check (visibility in ('public', 'private'));

-- 업로드 목적
alter table public.videos add column if not exists purpose text not null default 'personal'::text
  check (purpose in ('personal', 'competition'));

-- 서브 장르 (메인 장르별 slug; null 허용)
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

-- 해시태그(문자열 배열)
alter table public.videos add column if not exists tags text[] not null default '{}'::text[];

-- 단편 시리즈 메타
alter table public.videos add column if not exists series_name text null;

alter table public.videos add column if not exists episode_number integer null;

-- 조회수
alter table public.videos add column if not exists view_count integer not null default 0;

-- episode_number 양수 제약 (컬럼 존재 후)
alter table public.videos drop constraint if exists videos_episode_positive;

alter table public.videos
  add constraint videos_episode_positive check (episode_number is null or episode_number >= 1);
