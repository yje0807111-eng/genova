"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  triggerMonthlyDrawAction,
  redrawMonthlySlotAction,
  markWinnerInfoVerifiedAction,
  markWinnerInfoPaidAction,
  resendWinnerNotificationAction,
  exportLotteryWinnersCsvAction,
} from "@/app/actions/lottery-admin";
import { cn } from "@/lib/utils/cn";
import type {
  LotteryMonthlySummary,
  LotteryWinnerWorkRow,
  LotteryAuditRow,
} from "@/lib/queries/lottery-admin-queries";

// 글로벌 월간 응모권 추첨 관리 (공모전 무관). 핵심만: 이번 달 풀
// 현황 / 추첨 / 당첨자 큐(정보확인·지급·재추첨) / CSV / 이력.
export function LotteryManagement({
  summary,
  winners,
  auditLog,
  onMessage,
  initialWinnerFilter,
}: {
  summary: LotteryMonthlySummary;
  winners: LotteryWinnerWorkRow[];
  auditLog: LotteryAuditRow[];
  onMessage: (m: string) => void;
  initialWinnerFilter?: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState<string>(initialWinnerFilter ?? "all");

  const refresh = () => router.refresh();

  const onDraw = () => {
    if (
      !confirm(
        `${summary.monthKey} 전체 응모권 풀에서 5명을 추첨합니다. 되돌릴 수 없습니다(재추첨만 가능). 계속할까요?`,
      )
    )
      return;
    start(async () => {
      const res = await triggerMonthlyDrawAction(summary.monthKey);
      if (res.ok) {
        const warn: string[] = [];
        if (res.notifFailed) warn.push(`알림 ${res.notifFailed}건 실패`);
        if (res.emailFailed) warn.push(`이메일 ${res.emailFailed}건 실패`);
        onMessage(
          `${summary.monthKey} 추첨 완료 — ${res.winnersCount ?? 5}명${warn.length ? ` (${warn.join(", ")})` : ""}`,
        );
        refresh();
      } else {
        onMessage(`추첨 실패: ${res.message}`);
      }
    });
  };

  const onRedraw = (tier: number) => {
    const reason = prompt("재추첨 사유 (필수)")?.trim();
    if (!reason) return;
    start(async () => {
      const res = await redrawMonthlySlotAction({
        monthKey: summary.monthKey,
        prizeTier: tier,
        reason,
      });
      onMessage(res.ok ? `${tier}위 재추첨 완료` : `재추첨 실패: ${res.message}`);
      if (res.ok) refresh();
    });
  };

  const onVerify = (winnerId: string) => {
    const notes = prompt("검수 메모 (선택)")?.trim() || undefined;
    start(async () => {
      const res = await markWinnerInfoVerifiedAction({ winnerId, notes });
      onMessage(res.ok ? "정보 확인 완료" : `확인 실패: ${res.message}`);
      if (res.ok) refresh();
    });
  };

  const onPay = (winnerId: string) => {
    const ref = prompt("지급 참조(거래 ID 등, 필수)")?.trim();
    if (!ref) return;
    start(async () => {
      const res = await markWinnerInfoPaidAction({
        winnerId,
        paymentReference: ref,
      });
      onMessage(res.ok ? "지급 완료 처리됨" : `지급 처리 실패: ${res.message}`);
      if (res.ok) refresh();
    });
  };

  const onResend = (winnerId: string) => {
    if (!confirm("이 당첨자에게 알림·이메일을 다시 보낼까요?")) return;
    start(async () => {
      const res = await resendWinnerNotificationAction({ winnerId });
      if (res.ok) {
        const warn: string[] = [];
        if (res.notifFailed) warn.push(`알림 ${res.notifFailed}건 실패`);
        if (res.emailFailed) warn.push(`이메일 ${res.emailFailed}건 실패`);
        onMessage(
          warn.length
            ? `재발송 시도 — ${warn.join(", ")}`
            : "재발송 완료 (알림·이메일 발송됨)",
        );
        refresh();
      } else {
        onMessage(`재발송 실패: ${res.message}`);
      }
    });
  };

  const onCsv = () => {
    start(async () => {
      const res = await exportLotteryWinnersCsvAction();
      if (!res.ok) {
        onMessage(`CSV 실패: ${res.message}`);
        return;
      }
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
      onMessage("당첨자 CSV 다운로드됨");
    });
  };

  const statusLabel = (s: string): string =>
    ({
      pending: "대기",
      submitted: "제출",
      confirmed: "확인",
      paid: "지급",
      expired: "만료",
      invalidated: "무효",
    })[s] ?? s;

  const filtered = winners.filter((w) =>
    filter === "all" ? true : w.claimStatus === filter,
  );

  const stat = (label: string, value: string | number) => (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-0.5 text-[16px] font-bold tabular-nums text-white">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 이번 달 풀 + 추첨 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-white">
            {summary.monthKey} 월간 추첨
          </h3>
          {!summary.winnersDrawn ? (
            <button
              type="button"
              onClick={onDraw}
              disabled={pending}
              className="rounded-full bg-white px-4 py-1.5 text-[12px] font-bold text-[#0a0a0a] transition hover:bg-white/90 disabled:opacity-50"
            >
              {pending ? "처리 중…" : "이번 달 추첨"}
            </button>
          ) : (
            <span className="rounded-md bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
              추첨 완료
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stat("전체 응모권", summary.poolCount)}
          {stat("참여자 수", summary.poolUserCount)}
          {stat("지급 완료($)", summary.paidUsdTotal)}
          {stat("진행 중($)", summary.liveUsdTotal)}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/45">
          <span>대기 {summary.winners.pending}</span>
          <span>제출 {summary.winners.submitted}</span>
          <span>확인 {summary.winners.confirmed}</span>
          <span>지급 {summary.winners.paid}</span>
          <span>만료 {summary.winners.expired}</span>
          <span>무효 {summary.winners.invalidated}</span>
        </div>
      </section>

      {/* 당첨자 큐 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[14px] font-bold text-white">
            당첨자 ({filtered.length})
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[
                { key: "all", label: "전체" },
                { key: "pending", label: "대기" },
                { key: "submitted", label: "제출" },
                { key: "confirmed", label: "확인" },
                { key: "paid", label: "지급" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-semibold transition",
                    filter === f.key
                      ? "bg-white text-[#0a0a0a]"
                      : "border border-white/10 text-white/55",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onCsv}
              disabled={pending}
              className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/60 transition hover:text-white"
            >
              CSV
            </button>
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-white/35">당첨자 없음</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((w) => (
              <div
                key={w.winnerId}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px]"
              >
                <span className="font-bold text-[#AFA9EC]">{w.drawMonthKey}</span>
                <span className="font-bold text-white">{w.prizeTier}위</span>
                <span className="text-white/70">
                  {w.userDisplayName ?? w.userId.slice(0, 8)}
                </span>
                <span className="tabular-nums text-[#F5D182]">
                  ${w.prizeAmountUsd}
                </span>
                <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/55">
                  {statusLabel(w.claimStatus)}
                </span>
                {w.info ? (
                  <span className="text-white/40">
                    {w.info.legalName} · {w.info.paymentMethod} ·{" "}
                    {w.info.paymentEmail}
                  </span>
                ) : null}
                <span className="ml-auto flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onResend(w.winnerId)}
                    disabled={pending}
                    className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-white/60 hover:text-white"
                  >
                    재발송
                  </button>
                  {w.claimStatus === "submitted" ? (
                    <button
                      type="button"
                      onClick={() => onVerify(w.winnerId)}
                      disabled={pending}
                      className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-white/70 hover:text-white"
                    >
                      정보 확인
                    </button>
                  ) : null}
                  {w.claimStatus === "confirmed" ? (
                    <button
                      type="button"
                      onClick={() => onPay(w.winnerId)}
                      disabled={pending}
                      className="rounded-md border border-emerald-400/30 px-2 py-1 text-[11px] text-emerald-300 hover:text-emerald-200"
                    >
                      지급 완료
                    </button>
                  ) : null}
                  {["pending", "submitted", "expired"].includes(
                    w.claimStatus,
                  ) ? (
                    <button
                      type="button"
                      onClick={() => onRedraw(w.prizeTier)}
                      disabled={pending}
                      className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-white/45 hover:text-red-300"
                    >
                      재추첨
                    </button>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 추첨 이력 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h3 className="mb-3 text-[14px] font-bold text-white">
          추첨 이력 ({auditLog.length})
        </h3>
        {auditLog.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-white/35">이력 없음</p>
        ) : (
          <div className="space-y-1.5">
            {auditLog.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-white/[0.06] px-3 py-1.5 text-[11px] text-white/55"
              >
                <span className="font-bold text-[#AFA9EC]">{r.drawMonthKey}</span>
                <span>{new Date(r.drawnAt).toLocaleString("ko-KR")}</span>
                {r.isRedraw ? (
                  <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-300">
                    재추첨 {r.redrawPrizeTier}위
                  </span>
                ) : (
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5">
                    최초 추첨
                  </span>
                )}
                <span>
                  응모 {r.eligibleEntryCount} · 참여 {r.eligibleUserCount}
                </span>
                <span className="font-mono text-white/30">
                  seed {r.seedValue.slice(0, 10)}…
                </span>
                {r.redrawReason ? (
                  <span className="text-white/40">· {r.redrawReason}</span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
