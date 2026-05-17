import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { dispatchWinnerNotifications } from "@/lib/lottery-notify";

/**
 * 월간 자동 추첨 크론.  매월 1일 00:00 KST 직후 실행되어, 직전
 * 달(방금 마감된 풀)의 전체 응모권에서 5명을 추첨한다.
 *
 * - draw_monthly_winners 는 해당 월에 이미 라이브 당첨자가 있으면
 *   'already_drawn' 으로 거부 → 멱등(중복 실행 안전).
 * - 추첨 후 알림/이메일 디스패치까지 수행.
 * - 관리자 수동 추첨과 병행 가능(둘 중 먼저 도는 쪽이 그 달을 확정).
 *
 * Auth: Vercel cron 의 `Authorization: Bearer ${CRON_SECRET}`.
 * Vercel 스케줄 예: 매월 1일 (KST 기준이 되도록 UTC 보정한 cron).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "DB connection failed" }, { status: 500 });
  }

  // 직전 KST 월(YYYY-MM): 지금 KST 기준으로 1일을 빼서 그 달.
  const nowKstParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = Number(nowKstParts.find((p) => p.type === "year")?.value);
  const m = Number(nowKstParts.find((p) => p.type === "month")?.value);
  // 전월 = (y, m-1).  1월이면 전년 12월.
  const prevY = m === 1 ? y - 1 : y;
  const prevM = m === 1 ? 12 : m - 1;
  const targetMonth = `${prevY}-${String(prevM).padStart(2, "0")}`;

  const { data, error } = await supabase
    .rpc("draw_monthly_winners", {
      p_month_key: targetMonth,
      p_admin_id: null,
    })
    .single<{ drawing_log_id: string; winners_count: number }>();

  if (error) {
    // already_drawn / no_eligible_entries → 멱등·정상 종료로 간주.
    const msg = error.message ?? "";
    if (msg.includes("already_drawn")) {
      console.log("[cron/lottery-monthly-draw] already drawn", { targetMonth });
      return NextResponse.json({ ok: true, targetMonth, skipped: "already_drawn" });
    }
    if (msg.includes("no_eligible_entries")) {
      console.log("[cron/lottery-monthly-draw] no entries", { targetMonth });
      return NextResponse.json({ ok: true, targetMonth, skipped: "no_eligible_entries" });
    }
    console.error("[cron/lottery-monthly-draw] rpc failed", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const dispatch = await dispatchWinnerNotifications(supabase, targetMonth);
  console.log("[cron/lottery-monthly-draw] drawn", {
    targetMonth,
    winners: data?.winners_count ?? 0,
    ...dispatch,
  });
  return NextResponse.json({
    ok: true,
    targetMonth,
    winnersCount: data?.winners_count ?? 0,
    notifFailed: dispatch.notifFailed,
    emailFailed: dispatch.emailFailed,
  });
}
