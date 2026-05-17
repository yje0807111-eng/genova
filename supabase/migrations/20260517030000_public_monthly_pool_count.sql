-- 전체(글로벌) 월간 응모권 풀 카운트 공개 뷰.
--
-- 응모권은 공모전별 응모가 아니라 "업로드 시 발급 → 매월 전체
-- 풀에서 추첨" 방식.  공모전 상세의 통계도 공모전별 entry 수가
-- 아니라 이번 달 전체 응모권 수를 보여줘야 한다.
--
-- security_invoker=false (owner-runs) 라 entry_tickets RLS 를
-- 우회해 익명/인증 모두 동일한 집계값만 노출(행 노출 없음).
-- 단일 행: 현재 KST 월의 발급 응모권 총수.

create or replace view public.public_monthly_pool_count
with (security_invoker = false) as
select
  to_char((now() at time zone 'Asia/Seoul'), 'YYYY-MM') as month_key,
  count(*)::int as ticket_count
from public.entry_tickets
where month_key = to_char((now() at time zone 'Asia/Seoul'), 'YYYY-MM');

grant select on public.public_monthly_pool_count to anon, authenticated;

comment on view public.public_monthly_pool_count is
  'Global count of entry tickets issued in the current KST month — '
  'used for the monthly lottery pool stat on competition pages.';

-- 적용 후 PostgREST 스키마 캐시 리로드:
--   NOTIFY pgrst, 'reload schema';
