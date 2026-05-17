import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/auth/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { fetchLotteryMonthlySummary } from "@/lib/queries/lottery-admin-queries";

export const metadata: Metadata = {
  title: "System Health · Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Row = { label: string; status: "ok" | "warn" | "fail"; detail: string };

export default async function AdminHealthPage() {
  // Defense-in-depth (admin/layout.tsx also guards).
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  if (!isAdminEmail(user.email) || !user.email_confirmed_at) redirect("/");

  const rows: Row[] = [];

  // 1. Service-role client + RLS-bypass probe — the exact failure mode
  //    that surfaced as "admin lottery pool = 0" this cycle.
  const service = createServiceSupabaseClient();
  if (!service) {
    rows.push({
      label: "SUPABASE_SERVICE_ROLE_KEY",
      status: "fail",
      detail: "미설정 — 관리자 RLS 우회 불가 (응모권 집계/추첨/CSV 동작 안 함)",
    });
  } else {
    const probe = await service
      .from("entry_tickets")
      .select("id", { count: "exact", head: true });
    if (probe.error) {
      rows.push({
        label: "SUPABASE_SERVICE_ROLE_KEY",
        status: "fail",
        detail: `RLS 우회 실패 — 키가 service_role이 아닐 수 있음: ${probe.error.message}`,
      });
    } else {
      rows.push({
        label: "SUPABASE_SERVICE_ROLE_KEY",
        status: "ok",
        detail: `RLS 우회 정상 (entry_tickets 접근 OK, 총 ${probe.count ?? 0}건)`,
      });
    }
  }

  // 2. Email (Resend)
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const fromEmail = process.env.NOTIFY_FROM_EMAIL;
  rows.push({
    label: "RESEND_API_KEY",
    status: hasResend ? "ok" : "fail",
    detail: hasResend ? "설정됨" : "미설정 — 인증코드/당첨 메일 발송 불가",
  });
  rows.push({
    label: "NOTIFY_FROM_EMAIL",
    status: fromEmail ? "ok" : "warn",
    detail: fromEmail
      ? fromEmail
      : "미설정 — 기본 onboarding@resend.dev (가입 이메일로만 발송됨, 도메인 인증 권장)",
  });

  // 3. Cron secret
  rows.push({
    label: "CRON_SECRET",
    status: process.env.CRON_SECRET ? "ok" : "warn",
    detail: process.env.CRON_SECRET
      ? "설정됨 (월간 자동 추첨/리마인더 인증)"
      : "미설정 — 자동 추첨/리마인더 크론 호출 인증 불가",
  });

  // 4. Site URL (claim/notification links)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  rows.push({
    label: "NEXT_PUBLIC_SITE_URL",
    status: siteUrl ? "ok" : "warn",
    detail: siteUrl
      ? siteUrl
      : "미설정 — 메일/알림의 claim 링크가 잘못된 도메인일 수 있음",
  });

  // 5. This month's lottery operational status
  if (service) {
    try {
      const s = await fetchLotteryMonthlySummary(service);
      rows.push({
        label: `이번 달 응모권 (${s.monthKey})`,
        status: s.poolCount > 0 ? "ok" : "warn",
        detail: `풀 ${s.poolCount}장 · 참여자 ${s.poolUserCount}명 · 추첨 ${
          s.winnersDrawn ? "완료" : "미실시"
        } (대기 ${s.winners.pending}/제출 ${s.winners.submitted}/확인 ${
          s.winners.confirmed
        }/지급 ${s.winners.paid})`,
      });
    } catch (e) {
      rows.push({
        label: "이번 달 응모권",
        status: "fail",
        detail: `집계 조회 실패: ${
          e instanceof Error ? e.message : String(e)
        }`,
      });
    }
  }

  const tone = {
    ok: "border-emerald-400/25 bg-emerald-500/[0.07] text-emerald-300",
    warn: "border-amber-400/25 bg-amber-500/[0.07] text-amber-300",
    fail: "border-red-400/25 bg-red-500/[0.08] text-red-300",
  };
  const dot = { ok: "●", warn: "▲", fail: "✕" };

  return (
    <main className="mx-auto w-full max-w-[860px] px-6 py-10 text-white">
      <h1 className="text-[22px] font-black tracking-tight">시스템 점검</h1>
      <p className="mt-1.5 text-[13px] text-white/45">
        핵심 환경변수·연동·이번 달 응모권 운영 상태. 실시간 조회(요청 시점).
      </p>
      <div className="mt-6 space-y-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-4 py-3 ${tone[r.status]}`}
          >
            <span className="text-[12px]">{dot[r.status]}</span>
            <span className="text-[13px] font-bold text-white">{r.label}</span>
            <span className="ml-auto text-[12px] text-white/60">{r.detail}</span>
          </div>
        ))}
      </div>
      <p className="mt-6 text-[11px] leading-relaxed text-white/30">
        ✕ 즉시 조치 필요 · ▲ 권장/확인 · ● 정상. 환경변수 변경 후에는 Vercel
        재배포가 필요합니다.
      </p>
    </main>
  );
}
