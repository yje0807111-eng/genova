-- 평가 배점(judging_weights) 구조화.
--
-- 공모전 상세 "심사 및 시상"의 평가 배점(창의성/기술/스토리/임팩트
-- 등)을 운영자가 항목·비율(%)로 직접 구성한다.  비어 있으면 상세
-- 페이지는 기존 기본 4항목(35/25/25/15)으로 fallback.
--
-- 예시:
-- [
--   { "label_ko":"창의성","label_en":"Creativity","label_ja":"創造性","percent":40 },
--   { "label_ko":"기술 완성도","label_en":"Technical","label_ja":"技術","percent":30 },
--   { "label_ko":"스토리","label_en":"Story","label_ja":"ストーリー","percent":30 }
-- ]

alter table public.competitions
  add column if not exists judging_weights jsonb;

-- 적용 후 PostgREST 스키마 캐시 리로드:
--   NOTIFY pgrst, 'reload schema';
