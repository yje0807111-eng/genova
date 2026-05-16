-- 심사 방법(judging_process) 다국어 컬럼 추가.
--
-- 공모전 상세 "심사 및 시상" 탭의 심사 방법(단계별 진행) 블록은
-- 그동안 i18n 하드코딩 템플릿(judgingRound1/2/Final)으로만 노출돼
-- 운영자가 공모전별로 직접 설정할 수 없었다.  judging_criteria 와
-- 동일한 _ko/_en/_ja 패턴으로 운영자 편집 가능한 컬럼을 추가한다.
--
-- 입력 규칙: 한 줄 = 한 단계.  "제목 — 설명" 형태로 적으면 제목/설명
-- 으로 분리 렌더, 구분자가 없으면 줄 전체가 단계 제목.
-- 비어 있으면 상세 페이지는 기존 기본 템플릿으로 fallback.

alter table public.competitions
  add column if not exists judging_process text,
  add column if not exists judging_process_ko text,
  add column if not exists judging_process_en text,
  add column if not exists judging_process_ja text;

-- 적용 후 PostgREST 스키마 캐시 리로드:
--   NOTIFY pgrst, 'reload schema';
