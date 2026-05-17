-- 심사 날짜 / 시상식 날짜 컬럼 추가.
--
-- 기존 일정: start_date(접수 시작) · deadline(접수 마감) ·
-- vote_end(투표 마감) 만 존재.  주요 일정 타임라인의 "심사"·
-- "시상식" 단계 날짜를 운영자가 직접 설정할 수 있도록 추가한다.

alter table public.competitions
  add column if not exists review_date   timestamptz,
  add column if not exists ceremony_date timestamptz;

-- 적용 후 PostgREST 스키마 캐시 리로드:
--   NOTIFY pgrst, 'reload schema';
