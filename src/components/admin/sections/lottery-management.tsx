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

// 하이드레이션 안전 날짜 포맷터.  toLocaleString 은 서버(전체 ICU)
// vs 브라우저의 로케일 데이터·타임존이 달라 "오후"/"PM" 같은
// SSR 불일치를 유발한다.  KST 고정 + 숫자 전용(en-CA, 24h)으로
// 서버·클라이언트 출력이 항상 동일하게 한다.
function fmtKST(iso: string, withTime = true): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso ?? "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime
      ? { hour: "2-digit", minute: "2-digit", hour12: false }
      : {}),
  }).formatToParts(d);
  const g = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
  const date = `${g("year")}.${g("month")}.${g("day")}`;
  return withTime ? `${date} ${g("hour")}:${g("minute")}` : date;
}

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(
    new Set(),
  );

  const toggleMonth = (mk: string) =>
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(mk)) next.delete(mk);
      else next.add(mk);
      return next;
    });

  const [collapsedAuditMonths, setCollapsedAuditMonths] = useState<
    Set<string>
  >(new Set());
  const toggleAuditMonth = (mk: string) =>
    setCollapsedAuditMonths((prev) => {
      const next = new Set(prev);
      if (next.has(mk)) next.delete(mk);
      else next.add(mk);
      return next;
    });

  const refresh = () => router.refresh();

  const copy = (text: string, key: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    });
  };

  // YY.M.tier 지명 번호 (claim 페이지와 동일 표기).
  const winnerNo = (monthKey: string, tier: number) => {
    const [y, m] = (monthKey ?? "").split("-");
    return y && m ? `${y.slice(2)}.${parseInt(m, 10)}.${tier}` : String(tier);
  };

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
    if (
      !confirm(
        "제출된 지급 계정 정보(법적 이름·국가·결제수단·계정 이메일)를 모두 확인했습니까?\n확인 시 '검수 완료' 상태가 되어 지급 단계로 넘어갑니다.",
      )
    )
      return;
    const notes =
      prompt("내부 메모 (선택 — 특이사항이 있으면 기록, 없으면 비워두세요)")?.trim() ||
      undefined;
    start(async () => {
      const res = await markWinnerInfoVerifiedAction({ winnerId, notes });
      onMessage(res.ok ? "검수 완료 처리됨" : `검수 실패: ${res.message}`);
      if (res.ok) refresh();
    });
  };

  const onPay = (winnerId: string) => {
    const ref = prompt(
      "실제 송금을 완료한 뒤, 거래 참조번호(PayPal/Wise/Payoneer 거래 ID 등)를 입력하세요. (필수)",
    )?.trim();
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

  // 추첨 월(draw_month_key)별로 묶어 섹션 단위 관리. 최신 월 먼저.
  const monthGroups = Object.entries(
    filtered.reduce<Record<string, LotteryWinnerWorkRow[]>>((acc, w) => {
      (acc[w.drawMonthKey] ??= []).push(w);
      return acc;
    }, {}),
  ).sort(([a], [b]) => b.localeCompare(a));

  // 추첨 이력도 동일하게 월별 그룹화(최신 월 우선).
  const auditGroups = Object.entries(
    auditLog.reduce<Record<string, LotteryAuditRow[]>>((acc, r) => {
      (acc[r.drawMonthKey] ??= []).push(r);
      return acc;
    }, {}),
  ).sort(([a], [b]) => b.localeCompare(a));

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
          <div className="space-y-5">
            {monthGroups.map(([mk, rows]) => (
              <div key={mk}>
                <button
                  type="button"
                  onClick={() => toggleMonth(mk)}
                  className="mb-2 flex w-full items-center gap-2 border-b border-white/[0.06] pb-1.5 text-left transition hover:border-white/15"
                >
                  <span
                    className={cn(
                      "inline-block text-[10px] text-white/40 transition-transform",
                      !collapsedMonths.has(mk) && "rotate-90",
                    )}
                  >
                    ▶
                  </span>
                  <h4 className="text-[12px] font-black tabular-nums text-[#AFA9EC]">
                    {mk}
                  </h4>
                  <span className="text-[11px] text-white/35">
                    당첨자 {rows.length}명
                  </span>
                  <span className="ml-auto text-[10px] text-white/30">
                    제출 {rows.filter((r) => r.info).length} / 미제출{" "}
                    {rows.filter((r) => !r.info).length}
                  </span>
                </button>
                {collapsedMonths.has(mk) ? null : (
                <div className="space-y-2">
                  {rows.map((w) => {
                    const open = expandedId === w.winnerId;
              const dday = Math.ceil(
                (new Date(w.infoDeadline).getTime() - Date.now()) / 86_400_000,
              );
              return (
                <div
                  key={w.winnerId}
                  className={cn(
                    "overflow-hidden rounded-xl border bg-white/[0.02] transition",
                    open
                      ? "border-[#7F77DD]/30"
                      : "border-white/[0.07]",
                  )}
                >
                  {/* 헤더 — 클릭하면 상세 펼침 */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(open ? null : w.winnerId)
                    }
                    className="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 px-3.5 py-3 text-left text-[12px] transition hover:bg-white/[0.015]"
                  >
                    <span className="rounded-md bg-[#534AB7]/15 px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#AFA9EC]">
                      {winnerNo(w.drawMonthKey, w.prizeTier)}
                    </span>
                    <span className="font-semibold text-white">
                      {w.userDisplayName ?? w.userId.slice(0, 8)}
                    </span>
                    <span className="font-bold tabular-nums text-[#F5D182]">
                      ${w.prizeAmountUsd}
                    </span>
                    <StatusPill status={w.claimStatus} label={statusLabel(w.claimStatus)} />
                    {w.info ? (
                      <span className="rounded bg-emerald-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300/85">
                        정보 제출됨
                      </span>
                    ) : (
                      <span className="rounded bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300/85">
                        미제출 · {dday >= 0 ? `D-${dday}` : `마감 +${-dday}일`}
                      </span>
                    )}
                    <span className="ml-auto flex items-center gap-1.5 text-white/40">
                      <span className="text-[11px]">
                        {open ? "접기" : "정보 보기"}
                      </span>
                      <span
                        className={cn(
                          "inline-block text-[10px] transition-transform",
                          open && "rotate-180",
                        )}
                      >
                        ▾
                      </span>
                    </span>
                  </button>

                  {open ? (
                    <div className="space-y-3.5 border-t border-white/[0.06] px-3.5 py-3.5">
                      {w.info ? (
                        <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                          <InfoField label="법적 이름 (지급 계정과 일치)" value={w.info.legalName} />
                          <InfoField label="국가" value={w.info.country} />
                          <InfoField
                            label="결제 수단"
                            value={
                              w.info.paymentMethod +
                              (w.info.paymentCurrency
                                ? ` · ${w.info.paymentCurrency}`
                                : "")
                            }
                          />
                          <InfoField
                            label="결제 계정 이메일"
                            value={w.info.paymentEmail}
                            onCopy={() =>
                              copy(w.info!.paymentEmail, `${w.winnerId}:email`)
                            }
                            copied={copied === `${w.winnerId}:email`}
                          />
                          {w.info.contactExtra ? (
                            <InfoField label="추가 연락처" value={w.info.contactExtra} />
                          ) : null}
                          <InfoField
                            label="제출 일시"
                            value={fmtKST(w.info.submittedAt)}
                          />
                          {w.info.adminVerified ? (
                            <InfoField
                              label="검수"
                              value={`완료 · ${
                                w.info.adminVerifiedAt
                                  ? fmtKST(w.info.adminVerifiedAt)
                                  : ""
                              }`}
                            />
                          ) : null}
                          {w.info.adminNotes ? (
                            <InfoField label="내부 메모" value={w.info.adminNotes} />
                          ) : null}
                          {w.info.paidAt ? (
                            <InfoField
                              label="지급"
                              value={`완료 · ${fmtKST(w.info.paidAt)}${
                                w.info.paymentReference
                                  ? ` · ${w.info.paymentReference}`
                                  : ""
                              }`}
                            />
                          ) : null}
                        </div>
                      ) : (
                        <p className="rounded-lg border border-amber-400/20 bg-amber-500/[0.06] px-3 py-2.5 text-[12px] leading-relaxed text-amber-200/85">
                          당첨자가 아직 지급 정보를 제출하지 않았습니다. 제출 마감{" "}
                          <b className="text-amber-100">
                            {fmtKST(w.infoDeadline, false)}
                          </b>{" "}
                          ({dday >= 0 ? `D-${dday}` : `마감 ${-dday}일 경과`}). 마감 후
                          미제출 시 자동 만료됩니다. 알림이 안 갔다면 아래 “재발송”.
                        </p>
                      )}

                      {/* 처리 액션 + 가이드 */}
                      <div className="space-y-2 border-t border-white/[0.05] pt-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {w.claimStatus === "submitted" ? (
                            <button
                              type="button"
                              onClick={() => onVerify(w.winnerId)}
                              disabled={pending}
                              className="rounded-lg bg-gradient-to-br from-[#6B5FD4] to-[#534AB7] px-3.5 py-2 text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(83,74,183,0.35)] transition hover:brightness-110 disabled:opacity-50"
                            >
                              검수 완료 →
                            </button>
                          ) : null}
                          {w.claimStatus === "confirmed" ? (
                            <button
                              type="button"
                              onClick={() => onPay(w.winnerId)}
                              disabled={pending}
                              className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-3.5 py-2 text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(16,185,129,0.3)] transition hover:brightness-110 disabled:opacity-50"
                            >
                              지급 완료 처리 →
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => onResend(w.winnerId)}
                            disabled={pending}
                            className="rounded-lg border border-white/15 px-3 py-2 text-[12px] font-semibold text-white/65 transition hover:text-white"
                          >
                            알림·이메일 재발송
                          </button>
                          {["pending", "submitted", "expired"].includes(
                            w.claimStatus,
                          ) ? (
                            <button
                              type="button"
                              onClick={() => onRedraw(w.prizeTier)}
                              disabled={pending}
                              className="ml-auto rounded-lg border border-red-400/20 px-3 py-2 text-[12px] font-semibold text-red-300/70 transition hover:border-red-400/40 hover:text-red-300"
                            >
                              이 자리 재추첨
                            </button>
                          ) : null}
                        </div>
                        <p className="text-[11px] leading-relaxed text-white/35">
                          {w.claimStatus === "submitted"
                            ? "① 위 지급 계정 정보(이름·국가·결제수단·이메일)를 검토 → ‘검수 완료’를 누르면 지급 단계로 넘어갑니다."
                            : w.claimStatus === "confirmed"
                              ? "② 실제로 송금을 보낸 뒤 ‘지급 완료 처리’를 누르고 거래 참조번호를 입력하세요."
                              : w.claimStatus === "paid"
                                ? "지급까지 완료된 건입니다. 추가 조치가 필요 없습니다."
                                : "미제출 상태입니다. 마감 전이면 재발송으로 안내, 마감/만료 시 ‘이 자리 재추첨’으로 다른 당첨자를 뽑을 수 있습니다."}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
                  })}
                </div>
                )}
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
          <div className="space-y-4">
            {auditGroups.map(([mk, logs]) => (
              <div key={mk}>
                <button
                  type="button"
                  onClick={() => toggleAuditMonth(mk)}
                  className="mb-2 flex w-full items-center gap-2 border-b border-white/[0.06] pb-1.5 text-left transition hover:border-white/15"
                >
                  <span
                    className={cn(
                      "inline-block text-[10px] text-white/40 transition-transform",
                      !collapsedAuditMonths.has(mk) && "rotate-90",
                    )}
                  >
                    ▶
                  </span>
                  <h4 className="text-[12px] font-black tabular-nums text-[#AFA9EC]">
                    {mk}
                  </h4>
                  <span className="text-[11px] text-white/35">
                    {logs.length}건
                  </span>
                  <span className="ml-auto text-[10px] text-white/30">
                    재추첨 {logs.filter((l) => l.isRedraw).length} / 최초{" "}
                    {logs.filter((l) => !l.isRedraw).length}
                  </span>
                </button>
                {collapsedAuditMonths.has(mk) ? null : (
                  <div className="space-y-1.5">
                    {logs.map((r) => (
                      <div
                        key={r.id}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-white/[0.06] px-3 py-1.5 text-[11px] text-white/55"
                      >
                        <span>{fmtKST(r.drawnAt)}</span>
                        {r.isRedraw ? (
                          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-300">
                            재추첨 · {winnerNo(r.drawMonthKey, r.redrawPrizeTier ?? 0)}
                          </span>
                        ) : (
                          <span className="rounded bg-white/[0.06] px-1.5 py-0.5">
                            최초 추첨
                          </span>
                        )}
                        <span>
                          응모 {r.eligibleEntryCount} · 참여{" "}
                          {r.eligibleUserCount}
                        </span>
                        <span className="font-mono text-white/30">
                          seed {r.seedValue.slice(0, 10)}…
                        </span>
                        {r.redrawReason ? (
                          <span className="text-white/40">
                            · {r.redrawReason}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoField({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
        {label}
      </p>
      <div className="mt-0.5 flex items-center gap-2">
        <p className="min-w-0 break-all text-[13px] font-medium text-white/85">
          {value || "—"}
        </p>
        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className="shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/45 transition hover:text-white"
          >
            {copied ? "복사됨" : "복사"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function StatusPill({ status, label }: { status: string; label: string }) {
  const tone =
    status === "paid"
      ? "bg-emerald-500/15 text-emerald-300"
      : status === "confirmed"
        ? "bg-[#7F77DD]/15 text-[#AFA9EC]"
        : status === "submitted"
          ? "bg-sky-500/15 text-sky-300"
          : status === "expired" || status === "invalidated"
            ? "bg-red-500/12 text-red-300/80"
            : "bg-white/[0.06] text-white/55";
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-bold",
        tone,
      )}
    >
      {label}
    </span>
  );
}
