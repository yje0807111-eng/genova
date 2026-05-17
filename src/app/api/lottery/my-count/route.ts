import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchMyMonthlyTicketCount } from "@/lib/queries/lottery-queries";

/**
 * 사이드바 응모권 칸용 — 현재 로그인 사용자의 이번 달 응모권
 * 카운트.  비로그인/미설정 시 { count: null }.
 *
 * SlimSidebar 가 client 컴포넌트라 server 쿼리
 * fetchMyMonthlyTicketCount 를 직접 못 써서 이 경량 GET 으로
 * 노출.  current_month_ticket_counts 뷰는 security_invoker=true 라
 * RLS 가 호출자 본인 행으로 클립한다.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ count: null });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ count: null });

  const count = await fetchMyMonthlyTicketCount(user.id);
  if (!count) return NextResponse.json({ count: null });

  // 사이드바는 유효 응모권(total - revoked) 을 표시 — revoked 는
  // 추첨에서 빠진 회수분이라 사용자에게 보이는 숫자에서 제외한다.
  // (5장/월 한도 계산은 서버 RPC 가 여전히 total 기준 = 페널티 유지)
  return NextResponse.json({
    count: {
      total: count.total,
      remaining: count.remaining,
      revoked: count.revoked,
    },
  });
}
