"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/genova/language-provider";
import {
  redrawWinnerSlotAction,
  triggerCompetitionDrawAction,
  markWinnerInfoVerifiedAction,
  markWinnerInfoPaidAction,
  exportLotteryWinnersCsvAction,
} from "@/app/actions/lottery-admin";
import { adminTokens } from "@/lib/admin-styles";
import { cn } from "@/lib/utils/cn";
import type {
  LotteryAuditRow,
  LotteryCompetitionSummary,
  LotteryWinnerWorkRow,
} from "@/lib/queries/lottery-admin-queries";

/**
 * H5-E.3: mask the last octet of an IPv4 / suffix of IPv6 for
 * over-the-shoulder safety.  Full value remains in the DB for
 * forensics.  Returns the raw value if it doesn't look like an IP
 * (so weird debugging strings aren't silently truncated).
 */
function maskIp(ip: string): string {
  // IPv4: a.b.c.d → a.b.c.•
  const v4 = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
  if (v4) return `${v4[1]}.•`;
  // IPv6: keep first 4 hex groups, mask the rest.
  if (ip.includes(":")) {
    const groups = ip.split(":");
    if (groups.length >= 4) {
      return `${groups.slice(0, 4).join(":")}:•••`;
    }
  }
  return ip;
}

/**
 * H5-E.4: mask the local part of an email and any reference / token.
 * Example: jane.doe@example.com → j••••@example.com.  Empty / null
 * inputs return a placeholder.
 */
function maskEmail(email: string | null | undefined): string {
  if (!email) return "•••";
  const at = email.indexOf("@");
  if (at <= 0) return "•••";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 1) return `•${domain}`;
  return `${local[0]}••••${domain}`;
}

function maskReference(ref: string | null | undefined): string {
  if (!ref) return "•••";
  if (ref.length <= 4) return "•".repeat(ref.length);
  return `${ref.slice(0, 2)}••••${ref.slice(-2)}`;
}

/** i18n claim_status 라벨 — UI 표시용 (배지 / 필터 / 버킷 공통). */
const CLAIM_STATUS_EN: Record<string, string> = {
  pending: "Pending",
  submitted: "Submitted",
  confirmed: "Verified",
  paid: "Paid",
  expired: "Expired",
  invalidated: "Invalidated",
};
function useClaimStatusLabel() {
  const { t } = useI18n();
  return (status: string): string =>
    CLAIM_STATUS_EN[status]
      ? t(`adminLottery.status.${status}`, CLAIM_STATUS_EN[status])
      : status;
}

/**
 * Phase 6-B + 6-C: combined admin lottery panel.
 *
 * Three stacked sections (no sub-tabs) so the operator can scroll
 * through the entire workflow on one screen:
 *
 *   1. Competitions — entry counts + draw / redraw triggers
 *   2. Winners      — submitted info + verify / mark-paid workflow
 *   3. Audit log    — recent draw + redraw events
 *
 * All mutations go through Phase 6-A Server Actions; on success
 * we `router.refresh()` so the page loader re-fetches the
 * underlying tables and the panel rebuilds with the new state.
 */
export function LotteryManagement({
  competitions,
  winners,
  auditLog,
  onMessage,
  initialWinnerFilter,
}: {
  competitions: LotteryCompetitionSummary[];
  winners: LotteryWinnerWorkRow[];
  auditLog: LotteryAuditRow[];
  onMessage: (msg: string | null) => void;
  /** 대시보드 액션 칩에서 진입 시 당첨자 섹션 초기 필터
   *  (pending/submitted/confirmed/paid/expired). */
  initialWinnerFilter?: string | null;
}) {
  return (
    <div className="space-y-8">
      <CompetitionsSection
        competitions={competitions}
        onMessage={onMessage}
      />
      <WinnersSection
        winners={winners}
        onMessage={onMessage}
        initialFilter={initialWinnerFilter}
      />
      <AuditLogSection rows={auditLog} />
    </div>
  );
}

/* =====================================================================
 * Competitions section: per-competition draw + redraw controls.
 * =====================================================================*/

function CompetitionsSection({
  competitions,
  onMessage,
}: {
  competitions: LotteryCompetitionSummary[];
  onMessage: (msg: string | null) => void;
}) {
  const { t } = useI18n();
  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
      <h3 className={cn(adminTokens.sectionHeader, "mb-3")}>
        {t("adminLottery.competitions", "Competitions")} ({competitions.length})
      </h3>
      {competitions.length === 0 ? (
        <p className="text-[12px] text-white/45">{t("adminLottery.noCompetitions", "No competitions.")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                <th className="px-2 py-2">{t("adminLottery.colCompetition", "Competition")}</th>
                <th className="px-2 py-2">{t("adminLottery.colStatus", "Status")}</th>
                <th className="px-2 py-2 text-right">{t("adminLottery.colEntries", "Entries")}</th>
                <th className="px-2 py-2">{t("adminLottery.colWinners", "Winners")}</th>
                <th className="px-2 py-2 text-right">{t("adminLottery.colActions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {competitions.map((c) => (
                <CompetitionRow key={c.id} c={c} onMessage={onMessage} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CompetitionRow({
  c,
  onMessage,
}: {
  c: LotteryCompetitionSummary;
  onMessage: (msg: string | null) => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onDraw = () => {
    if (!confirm(t("adminLottery.confirmDraw", `Draw 5 winners for the "${c.title}" competition. This cannot be undone except by a redraw. Continue?`).replace("{title}", c.title))) return;
    startTransition(async () => {
      const res = await triggerCompetitionDrawAction(c.id);
      if (res.ok) {
        // H2-D.6: 알림 발송 실패 건수 노출 (이전엔 로그 확인 필요)
        const warnings: string[] = [];
        if (res.notifFailed) warnings.push(t("adminLottery.notifFailed", `${res.notifFailed} notifications failed`).replace("{n}", String(res.notifFailed)));
        if (res.emailFailed) warnings.push(t("adminLottery.emailFailed", `${res.emailFailed} emails failed`).replace("{n}", String(res.emailFailed)));
        const suffix = warnings.length ? ` · ⚠ ${warnings.join(" · ")}` : "";
        onMessage(`${t("adminLottery.drawDone", `"${c.title}" — ${res.winnersCount ?? 5} winners drawn`).replace("{title}", c.title).replace("{n}", String(res.winnersCount ?? 5))}${suffix}`);
      } else {
        onMessage(`${t("adminLottery.drawFailed", "Draw failed")}: ${res.message}`);
      }
      router.refresh();
    });
  };

  return (
    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02]">
      <td className="px-2 py-3">
        <div className="font-bold text-white">{c.title}</div>
        <div className="text-[10px] text-white/40">{c.id}</div>
      </td>
      <td className="px-2 py-3 text-white/65">{c.status}</td>
      <td className="px-2 py-3 text-right tabular-nums text-white">
        {c.entryCount.toLocaleString()}
      </td>
      <td className="px-2 py-3">
        {c.winnersDrawn ? (
          <div className="flex flex-col gap-1">
            <WinnerBuckets buckets={c.winners} />
            {/* H2-A.4: paid / total payout summary so operators can see
                the disbursement progress at a glance. */}
            {c.liveUsdTotal > 0 ? (
              <span className="text-[10px] tabular-nums text-white/40">
                ${c.paidUsdTotal.toLocaleString()} / ${c.liveUsdTotal.toLocaleString()} 지급
              </span>
            ) : null}
          </div>
        ) : (
          <span className="text-white/35">—</span>
        )}
      </td>
      <td className="px-2 py-3 text-right">
        {c.winnersDrawn ? (
          <Link
            href={`/competition/${c.id}/results`}
            className={cn(adminTokens.buttonGhost, "inline-flex h-7 px-3 text-[11px]")}
            target="_blank"
          >
            {t("adminLottery.results", "Results")} →
          </Link>
        ) : (
          <button
            type="button"
            onClick={onDraw}
            disabled={pending || c.entryCount === 0}
            // G7: admin token 통일 — 추첨은 primary action (솔리드 화이트).
            className={cn(adminTokens.buttonPrimary, "h-7 px-3 text-[11px] disabled:opacity-50")}
          >
            {pending ? t("adminLottery.drawing", "Drawing…") : t("adminLottery.draw", "Draw")}
          </button>
        )}
      </td>
    </tr>
  );
}

function WinnerBuckets({
  buckets,
}: {
  buckets: LotteryCompetitionSummary["winners"];
}) {
  const statusLabel = useClaimStatusLabel();
  const items = [
    { key: "pending", color: "text-white/55" },
    { key: "submitted", color: "text-[#AFA9EC]" },
    { key: "confirmed", color: "text-sky-300" },
    { key: "paid", color: "text-emerald-300" },
    { key: "expired", color: "text-red-300" },
    { key: "invalidated", color: "text-white/30" },
  ] as const;
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px]">
      {items.map((i) => {
        const n = buckets[i.key];
        if (n === 0) return null;
        return (
          <span key={i.key} className={cn("tabular-nums", i.color)}>
            {statusLabel(i.key)} {n}
          </span>
        );
      })}
    </div>
  );
}

/* =====================================================================
 * Winners section: per-winner verify / mark-paid / redraw controls.
 * =====================================================================*/

function WinnersSection({
  winners,
  onMessage,
  initialFilter,
}: {
  winners: LotteryWinnerWorkRow[];
  onMessage: (msg: string | null) => void;
  initialFilter?: string | null;
}) {
  const { t } = useI18n();
  const statusLabel = useClaimStatusLabel();
  const VALID_WINNER_FILTERS = [
    "pending",
    "submitted",
    "confirmed",
    "paid",
    "expired",
  ] as const;
  const [filter, setFilter] = useState<
    "all" | "pending" | "submitted" | "confirmed" | "paid" | "expired"
  >(
    initialFilter &&
      (VALID_WINNER_FILTERS as readonly string[]).includes(initialFilter)
      ? (initialFilter as (typeof VALID_WINNER_FILTERS)[number])
      : "all",
  );
  const [exporting, setExporting] = useState(false);
  const filtered = winners.filter((w) =>
    filter === "all" ? true : w.claimStatus === filter,
  );

  // G6: download a CSV of all winners + their submitted info via a
  // service-role read.  Triggered client-side, but the data lookup
  // runs in the server action so RLS / admin gate are honored.  The
  // resulting Blob is offered to the browser via a hidden <a>.
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportLotteryWinnersCsvAction();
      if (!res.ok) {
        onMessage(`${t("adminLottery.csvExportFailed", "CSV export failed")}: ${res.message}`);
        return;
      }
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onMessage(t("adminLottery.csvDownloaded", "Winners CSV downloaded."));
    } catch (e) {
      onMessage(e instanceof Error ? `${t("adminLottery.csvExportFailed", "CSV export failed")}: ${e.message}` : t("adminLottery.csvExportFailed", "CSV export failed"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className={adminTokens.sectionHeader}>
          {t("adminLottery.winners", "Winners")} ({winners.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || winners.length === 0}
            className={cn(adminTokens.buttonSecondary, "h-8 px-3 text-[11px] disabled:opacity-40")}
            title={t("adminLottery.csvExportTitle", "Download winners + submitted info as CSV (personal data — handle with care)")}
          >
            {exporting ? t("adminLottery.exporting", "Exporting...") : t("adminLottery.csvExport", "Export CSV")}
          </button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[11px] text-white/80"
          >
            <option value="all">{t("adminLottery.filterAll", "All")}</option>
            <option value="pending">{statusLabel("pending")}</option>
            <option value="submitted">{statusLabel("submitted")}</option>
            <option value="confirmed">{statusLabel("confirmed")}</option>
            <option value="paid">{statusLabel("paid")}</option>
            <option value="expired">{statusLabel("expired")}</option>
          </select>
        </div>
      </header>
      {filtered.length === 0 ? (
        <p className="text-[12px] text-white/45">
          {filter === "all"
            ? t("adminLottery.noWinners", "No winners drawn yet.")
            : t("adminLottery.noWinnersForStatus", `No winners with status "${statusLabel(filter)}".`).replace("{status}", statusLabel(filter))}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <WinnerCard key={w.winnerId} w={w} onMessage={onMessage} />
          ))}
        </div>
      )}
    </section>
  );
}

function WinnerCard({
  w,
  onMessage,
}: {
  w: LotteryWinnerWorkRow;
  onMessage: (msg: string | null) => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  // G10: replace native prompt() with branded modal — supports paste,
  // multiline reasons, esc-to-cancel, and matches admin design tokens.
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [redrawModalOpen, setRedrawModalOpen] = useState(false);

  const verify = (notes?: string) => {
    startTransition(async () => {
      const res = await markWinnerInfoVerifiedAction({
        winnerId: w.winnerId,
        notes,
      });
      onMessage(res.ok ? t("adminLottery.verifyDone", "Marked as verified") : `${t("adminLottery.verifyFailed", "Verification failed")}: ${res.message}`);
      router.refresh();
    });
  };

  const handlePayConfirm = (ref: string) => {
    setPayModalOpen(false);
    const trimmed = ref.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const res = await markWinnerInfoPaidAction({
        winnerId: w.winnerId,
        paymentReference: trimmed,
      });
      onMessage(res.ok ? t("adminLottery.payDone", "Marked as paid") : `${t("adminLottery.payFailed", "Payment failed")}: ${res.message}`);
      router.refresh();
    });
  };

  const handleRedrawConfirm = (reason: string) => {
    setRedrawModalOpen(false);
    const trimmed = reason.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const res = await redrawWinnerSlotAction({
        competitionId: w.competitionId,
        prizeTier: w.prizeTier,
        reason: trimmed,
      });
      if (res.ok) {
        // H2-D.6: 알림 발송 실패 건수 노출
        const warnings: string[] = [];
        if (res.notifFailed) warnings.push(t("adminLottery.notifFailed", `${res.notifFailed} notifications failed`).replace("{n}", String(res.notifFailed)));
        if (res.emailFailed) warnings.push(t("adminLottery.emailFailed", `${res.emailFailed} emails failed`).replace("{n}", String(res.emailFailed)));
        const suffix = warnings.length ? ` · ⚠ ${warnings.join(" · ")}` : "";
        onMessage(`${t("adminLottery.redrawDone", "Redraw complete")}${suffix}`);
      } else {
        onMessage(`${t("adminLottery.redrawFailed", "Redraw failed")}: ${res.message}`);
      }
      router.refresh();
    });
  };

  const pay = () => setPayModalOpen(true);
  const redraw = () => setRedrawModalOpen(true);

  // H5-E.4: payment info is the most sensitive field on the dashboard
  // — mask by default, click to reveal.  Reveal is a UI-only choice,
  // but combined with the H5-E.3 IP mask + audit-friendly Show info
  // toggle, casual screenshots can't leak full PII.
  const [paymentRevealed, setPaymentRevealed] = useState(false);

  // H2-A.1: deadline countdown for pending claims.  Only render when
  // the winner hasn't submitted yet — submitted/confirmed/paid rows
  // already cleared the deadline.
  const daysToDeadline =
    w.claimStatus === "pending"
      ? Math.ceil(
          (new Date(w.infoDeadline).getTime() - Date.now()) / 86_400_000,
        )
      : null;
  const deadlineRibbon =
    daysToDeadline !== null
      ? daysToDeadline < 0
        ? { tone: "danger" as const, text: t("adminLottery.daysOverdue", `${-daysToDeadline} days overdue`).replace("{n}", String(-daysToDeadline)) }
        : daysToDeadline === 0
          ? { tone: "danger" as const, text: t("adminLottery.dueToday", "Due today") }
          : daysToDeadline <= 1
            ? { tone: "danger" as const, text: `D-${daysToDeadline}` }
            : daysToDeadline <= 3
              ? { tone: "warning" as const, text: `D-${daysToDeadline}` }
              : null
      : null;

  return (
    <article className="rounded-lg border border-white/[0.06] bg-white/[0.01] px-3 py-3">
      <header className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            adminTokens.badge,
            "shrink-0 bg-amber-400/15 text-amber-300",
          )}
        >
          {t("adminLottery.prizeRank", `Rank ${w.prizeTier}`).replace("{n}", String(w.prizeTier))} · ${w.prizeAmountUsd}
        </span>
        <ClaimStatusBadge status={w.claimStatus} />
        {deadlineRibbon ? (
          <span
            className={cn(
              adminTokens.badge,
              deadlineRibbon.tone === "danger"
                ? adminTokens.badgeDanger
                : adminTokens.badgeWarning,
            )}
            title={`info_deadline ${w.infoDeadline}`}
          >
            ⏰ {deadlineRibbon.text}
          </span>
        ) : null}
        <span className="min-w-0 truncate text-[12px] font-bold text-white">
          {w.userDisplayName ?? `user_${w.userId.slice(0, 8)}`}
        </span>
        <span className="text-[10px] text-white/45">
          {w.competitionTitle}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((x) => !x)}
          className="ml-auto text-[11px] text-white/45 hover:text-white"
        >
          {expanded ? t("adminLottery.hideInfo", "Hide info") : t("adminLottery.showInfo", "Show info")}
        </button>
      </header>

      {expanded ? (
        <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-[11px] text-white/70 sm:grid-cols-2">
          {w.info ? (
            <>
              <Field k={t("adminLottery.fieldLegalName", "Legal name")} v={w.info.legalName} />
              <Field k={t("adminLottery.fieldCountry", "Country")} v={w.info.country} />
              <Field k={t("adminLottery.fieldContactExtra", "Additional contact")} v={w.info.contactExtra} />
              {/* H5-E.4: payment info masked until explicit reveal */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-white/35">
                  {t("adminLottery.fieldPaymentInfo", "Payment info")}
                </span>
                <span className="font-medium text-white/80">
                  {paymentRevealed
                    ? `${w.info.paymentMethod} · ${w.info.paymentEmail}${
                        w.info.paymentCurrency ? ` · ${w.info.paymentCurrency}` : ""
                      }`
                    : `${w.info.paymentMethod} · ${maskEmail(w.info.paymentEmail)}${
                        w.info.paymentCurrency ? ` · ${w.info.paymentCurrency}` : ""
                      }`}
                  <button
                    type="button"
                    onClick={() => setPaymentRevealed((v) => !v)}
                    className="ml-2 text-[10px] text-white/45 underline-offset-2 hover:text-white hover:underline"
                  >
                    {paymentRevealed ? t("adminLottery.hide", "Hide") : t("adminLottery.reveal", "Reveal")}
                  </button>
                </span>
              </div>
              <Field
                k={t("adminLottery.fieldSubmittedAt", "Submitted at")}
                // H5-E.3: mask the IP's last octet so over-the-shoulder
                // screenshots leak less.  Full value is still in the
                // DB for forensics.
                v={`${w.info.submittedAt}${
                  w.info.submittedIp ? ` (IP ${maskIp(w.info.submittedIp)})` : ""
                }`}
              />
              {w.info.adminVerified ? (
                <Field k={t("adminLottery.fieldVerifiedAt", "Verified at")} v={w.info.adminVerifiedAt ?? "—"} />
              ) : null}
              {w.info.paidAt ? (
                <Field
                  k={t("adminLottery.fieldPaid", "Paid")}
                  v={
                    paymentRevealed
                      ? `${w.info.paidAt} · ${t("adminLottery.ref", "Ref")} ${w.info.paymentReference ?? ""}`
                      : `${w.info.paidAt} · ${t("adminLottery.ref", "Ref")} ${maskReference(w.info.paymentReference)}`
                  }
                />
              ) : null}
              {w.info.adminNotes ? (
                <Field k={t("adminLottery.fieldAdminNotes", "Admin notes")} v={w.info.adminNotes} />
              ) : null}
            </>
          ) : (
            <p className="col-span-full text-white/45">
              {t("adminLottery.noInfoYet", "Info not submitted yet")} ({t("adminLottery.deadline", "deadline")} {w.infoDeadline}).
            </p>
          )}
        </div>
      ) : null}

      <footer className="mt-3 flex flex-wrap items-center gap-2">
        {w.claimStatus === "submitted" && w.info && !w.info.adminVerified ? (
          <button
            type="button"
            onClick={() => verify()}
            disabled={pending}
            className={cn(
              adminTokens.buttonGhost,
              "h-7 px-3 text-[11px] text-sky-300",
            )}
          >
            {t("adminLottery.verify", "Verify")}
          </button>
        ) : null}
        {w.claimStatus === "confirmed" ? (
          <button
            type="button"
            onClick={pay}
            disabled={pending}
            className={cn(
              adminTokens.buttonGhost,
              "h-7 px-3 text-[11px] text-emerald-300",
            )}
          >
            {t("adminLottery.markPaid", "Mark paid")}
          </button>
        ) : null}
        {/* Redraw is available for pending / submitted / confirmed; refused
            server-side for paid (post-payment is manual follow-up). */}
        {(["pending", "submitted", "expired"] as const).includes(
          w.claimStatus as "pending" | "submitted" | "expired",
        ) ? (
          <button
            type="button"
            onClick={redraw}
            disabled={pending}
            className={cn(
              adminTokens.buttonGhost,
              "h-7 px-3 text-[11px] text-amber-300",
            )}
          >
            {t("adminLottery.redraw", "Redraw")}
          </button>
        ) : null}
      </footer>

      {/* G10: branded prompt modals replacing native prompt() calls. */}
      <PromptModal
        open={payModalOpen}
        title={t("adminLottery.payModalTitle", "Mark as paid")}
        description={`${t("adminLottery.prizeRank", `Rank ${w.prizeTier}`).replace("{n}", String(w.prizeTier))} · $${w.prizeAmountUsd} USD · ${w.userDisplayName ?? t("adminLottery.user", "User")}`}
        label={t("adminLottery.paymentRefLabel", "Payment reference")}
        placeholder={t("adminLottery.paymentRefPlaceholder", "PayPal / Wise transaction ID")}
        confirmLabel={t("adminLottery.markPaid", "Mark paid")}
        onCancel={() => setPayModalOpen(false)}
        onConfirm={handlePayConfirm}
      />
      <PromptModal
        open={redrawModalOpen}
        title={t("adminLottery.redrawModalTitle", `Rank ${w.prizeTier} redraw`).replace("{n}", String(w.prizeTier))}
        description={t("adminLottery.redrawModalDesc", `"${w.competitionTitle}" — ${w.userDisplayName ?? "the user"} will be permanently excluded from this competition's draw pool.`).replace("{title}", w.competitionTitle).replace("{user}", w.userDisplayName ?? t("adminLottery.user", "User"))}
        label={t("adminLottery.redrawReasonLabel", "Reason (required, recorded in the audit log)")}
        placeholder={t("adminLottery.redrawReasonPlaceholder", "Why this slot is being redrawn")}
        confirmLabel={t("adminLottery.redraw", "Redraw")}
        confirmDanger
        multiline
        onCancel={() => setRedrawModalOpen(false)}
        onConfirm={handleRedrawConfirm}
      />
    </article>
  );
}

/**
 * G10: branded admin prompt modal — replacement for native prompt()
 * which has no styling, no paste-friendly behavior, no esc-to-cancel
 * on all platforms, and breaks the dashboard look.
 *
 * Single-input or textarea variants via the `multiline` flag.  Empty
 * confirm is blocked client-side (the caller's onConfirm receives
 * the trimmed value, but we also short-circuit at the button level
 * for visual feedback).
 */
function PromptModal({
  open,
  title,
  description,
  label,
  placeholder,
  confirmLabel,
  confirmDanger,
  multiline,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  confirmLabel: string;
  confirmDanger?: boolean;
  multiline?: boolean;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  // No explicit reset needed: when `open` flips false the component
  // unmounts (`return null` below), so the next open mounts fresh
  // with the useState initializer.  Prevents previous session's
  // draft from leaking between different tier slots.

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className={cn(adminTokens.card, "w-full max-w-md")}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-[14px] font-bold text-white">{title}</h3>
        {description ? (
          <p className="mb-4 text-[12px] text-white/55">{description}</p>
        ) : null}
        <label className={adminTokens.inputLabel}>{label}</label>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
            rows={3}
            className={cn(adminTokens.input, "mt-1 h-auto w-full resize-y py-2")}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className={cn(adminTokens.input, "mt-1 w-full")}
          />
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={cn(adminTokens.buttonSecondary, "h-8 px-3 text-[12px]")}
          >
            {t("adminLottery.cancel", "Cancel")}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(value)}
            disabled={!value.trim()}
            className={cn(
              confirmDanger ? adminTokens.buttonDanger : adminTokens.buttonPrimary,
              "h-8 px-3 text-[12px] disabled:opacity-40",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <span className="text-white/40">{k}:</span> {v}
    </div>
  );
}

function ClaimStatusBadge({ status }: { status: string }) {
  const statusLabel = useClaimStatusLabel();
  const tone =
    status === "paid"
      ? "bg-emerald-400/15 text-emerald-300"
      : status === "confirmed"
      ? "bg-sky-400/15 text-sky-300"
      : status === "submitted"
      ? "bg-[#7F77DD]/15 text-[#AFA9EC]"
      : status === "expired"
      ? "bg-red-400/15 text-red-300"
      : status === "invalidated"
      ? "bg-white/[0.04] text-white/35"
      : "bg-white/[0.04] text-white/55";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.05em]",
        tone,
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

/* =====================================================================
 * Audit log section
 * =====================================================================*/

function AuditLogSection({ rows }: { rows: LotteryAuditRow[] }) {
  const { t } = useI18n();
  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
      <h3 className={cn(adminTokens.sectionHeader, "mb-3")}>
        {t("adminLottery.auditLog", "Draw audit log")} ({rows.length})
      </h3>
      {rows.length === 0 ? (
        <p className="text-[12px] text-white/45">{t("adminLottery.noAuditRecords", "No draw records.")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-[11px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-left font-semibold uppercase tracking-[0.12em] text-white/45">
                <th className="px-2 py-2">{t("adminLottery.colTime", "Time")}</th>
                <th className="px-2 py-2">{t("adminLottery.colCompetition", "Competition")}</th>
                <th className="px-2 py-2">{t("adminLottery.colType", "Type")}</th>
                <th className="px-2 py-2 text-right">{t("adminLottery.colTarget", "Target")}</th>
                <th className="px-2 py-2">{t("adminLottery.colSeed", "Seed")}</th>
                <th className="px-2 py-2">{t("adminLottery.colReason", "Reason")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                >
                  <td className="px-2 py-2 tabular-nums text-white/70">
                    {r.drawnAt.replace("T", " ").slice(0, 19)}
                  </td>
                  <td className="px-2 py-2 text-white/80">
                    {r.competitionTitle}
                  </td>
                  <td className="px-2 py-2">
                    {r.isRedraw ? (
                      <span className="text-amber-300">
                        {t("adminLottery.redraw", "Redraw")} · {t("adminLottery.prizeRank", `Rank ${r.redrawPrizeTier}`).replace("{n}", String(r.redrawPrizeTier))}
                      </span>
                    ) : (
                      <span className="text-emerald-300">{t("adminLottery.initial", "Initial")}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-white/70">
                    {r.eligibleEntryCount} / {r.eligibleUserCount}
                  </td>
                  <td className="px-2 py-2 font-mono text-[10px] text-white/40">
                    {r.seedValue.slice(0, 12)}…
                  </td>
                  <td className="px-2 py-2 text-white/55">
                    {r.redrawReason ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
