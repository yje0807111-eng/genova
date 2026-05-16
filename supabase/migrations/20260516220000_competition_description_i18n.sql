-- 서브제목(description) 다국어화.
--
-- competitions.description 은 단일(언어 공통) 컬럼이라 한국어로
-- 입력하면 영어/일본어 사용자에게도 한국어가 노출됐다.  title /
-- prize_info / concept / rules 등과 동일한 _ko/_en/_ja 패턴으로
-- 로케일별 컬럼을 추가한다.  레거시 `description` 은 fallback(주
-- 언어 대표값)으로 계속 채워진다(updateCompetitionAction 이
-- ko||en||ja 로 도출).

alter table public.competitions
  add column if not exists description_ko text,
  add column if not exists description_en text,
  add column if not exists description_ja text;

-- 적용 후 PostgREST 스키마 캐시 리로드:
--   NOTIFY pgrst, 'reload schema';
