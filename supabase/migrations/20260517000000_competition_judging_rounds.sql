-- 심사 진행 단계 구조화(judging_rounds).
--
-- 자유 텍스트 judging_process 를 대체하는 구조화 데이터.
-- 차시(라운드)별로 제목(다국어)과 심사 주체(staff=운영진,
-- jury=심사위원, audience=시청자 투표)별 비율(%)을 운영자가
-- 직접 설정한다.  비어 있으면 상세 페이지는 기존 judging_process
-- → 기본 템플릿 순으로 fallback 한다.
--
-- 예시:
-- [
--   { "title_ko":"1차 예선","title_en":"Round 1","title_ja":"1次",
--     "evaluators":[ { "type":"staff", "percent":100 } ] },
--   { "title_ko":"본선","title_en":"Final","title_ja":"本選",
--     "evaluators":[ { "type":"jury","percent":60 },
--                    { "type":"audience","percent":40 } ] }
-- ]

alter table public.competitions
  add column if not exists judging_rounds jsonb;

-- 적용 후 PostgREST 스키마 캐시 리로드:
--   NOTIFY pgrst, 'reload schema';
