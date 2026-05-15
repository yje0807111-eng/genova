"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
}: {
  competitions: LotteryCompetitionSummary[];
  winners: LotteryWinnerWorkRow[];
  auditLog: LotteryAuditRow[];
  onMessage: (msg: string | null) => void;
}) {
  return (
    <div className="space-y-8">
      <CompetitionsSection
        competitions={competitions}
        onMessage={onMessage}
      />
      <WinnersSection winners={winners} onMessage={onMessage} />
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
  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
      <h3 className={cn(adminTokens.sectionHeader, "mb-3")}>
        Competitions ({competitions.length})
      </h3>
      {competitions.length === 0 ? (
        <p className="text-[12px] text-white/45">No competitions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                <th className="px-2 py-2">Competition</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2 text-right">Entries</th>
                <th className="px-2 py-2">Winners</th>
                <th className="px-2 py-2 text-right">Action</th>
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onDraw = () => {
    if (!confirm(`Draw 5 winners for "${c.title}"? This cannot be undone except by redraw.`)) return;
    startTransition(async () => {
      const res = await triggerCompetitionDrawAction(c.id);
      onMessage(
        res.ok
          ? `Drew ${res.winnersCount ?? 5} winners for "${c.title}"`
          : `Draw failed: ${res.message}`,
      );
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
          <WinnerBuckets buckets={c.winners} />
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
            Results →
          </Link>
        ) : (
          <button
            type="button"
            onClick={onDraw}
            disabled={pending || c.entryCount === 0}
            // G7: admin token 통일 — Draw 는 primary action (솔리드 화이트).
            className={cn(adminTokens.buttonPrimary, "h-7 px-3 text-[11px] disabled:opacity-50")}
          >
            {pending ? "Drawing…" : "Draw"}
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
            {n} {i.key}
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
}: {
  winners: LotteryWinnerWorkRow[];
  onMessage: (msg: string | null) => void;
}) {
  const [filter, setFilter] = useState<
    "all" | "pending" | "submitted" | "confirmed" | "paid" | "expired"
  >("all");
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
        onMessage(`Export failed: ${res.message}`);
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
      onMessage("Winner CSV downloaded.");
    } catch (e) {
      onMessage(e instanceof Error ? `Export failed: ${e.message}` : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className={adminTokens.sectionHeader}>
          Winners ({winners.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || winners.length === 0}
            className={cn(adminTokens.buttonSecondary, "h-8 px-3 text-[11px] disabled:opacity-40")}
            title="Download winners + submitted info as CSV (PII — handle carefully)"
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[11px] text-white/80"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="confirmed">Confirmed</option>
            <option value="paid">Paid</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </header>
      {filtered.length === 0 ? (
        <p className="text-[12px] text-white/45">
          {filter === "all"
            ? "No winners drawn yet."
            : `No winners in "${filter}" state.`}
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const verify = (notes?: string) => {
    startTransition(async () => {
      const res = await markWinnerInfoVerifiedAction({
        winnerId: w.winnerId,
        notes,
      });
      onMessage(res.ok ? "Marked verified" : `Verify failed: ${res.message}`);
      router.refresh();
    });
  };

  const pay = () => {
    const ref = prompt("Payment reference (PayPal/Wise transaction ID):");
    if (!ref?.trim()) return;
    startTransition(async () => {
      const res = await markWinnerInfoPaidAction({
        winnerId: w.winnerId,
        paymentReference: ref.trim(),
      });
      onMessage(res.ok ? "Marked paid" : `Pay failed: ${res.message}`);
      router.refresh();
    });
  };

  const redraw = () => {
    const reason = prompt(
      `Redraw tier ${w.prizeTier} for "${w.competitionTitle}"? Provide reason:`,
    );
    if (!reason?.trim()) return;
    if (!confirm(`Confirm redraw for ${w.userDisplayName ?? "this user"}?`)) return;
    startTransition(async () => {
      const res = await redrawWinnerSlotAction({
        competitionId: w.competitionId,
        prizeTier: w.prizeTier,
        reason: reason.trim(),
      });
      onMessage(res.ok ? "Redraw successful" : `Redraw failed: ${res.message}`);
      router.refresh();
    });
  };

  return (
    <article className="rounded-lg border border-white/[0.06] bg-white/[0.01] px-3 py-3">
      <header className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            adminTokens.badge,
            "shrink-0 bg-amber-400/15 text-amber-300",
          )}
        >
          Tier {w.prizeTier} · ${w.prizeAmountUsd}
        </span>
        <ClaimStatusBadge status={w.claimStatus} />
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
          {expanded ? "Hide info" : "Show info"}
        </button>
      </header>

      {expanded ? (
        <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-[11px] text-white/70 sm:grid-cols-2">
          {w.info ? (
            <>
              <Field k="Legal name" v={w.info.legalName} />
              <Field k="Country" v={w.info.country} />
              <Field k="Contact extra" v={w.info.contactExtra} />
              <Field
                k="Payment"
                v={`${w.info.paymentMethod} · ${w.info.paymentEmail}${
                  w.info.paymentCurrency ? ` · ${w.info.paymentCurrency}` : ""
                }`}
              />
              <Field
                k="Submitted at"
                v={`${w.info.submittedAt}${
                  w.info.submittedIp ? ` (IP ${w.info.submittedIp})` : ""
                }`}
              />
              {w.info.adminVerified ? (
                <Field k="Verified at" v={w.info.adminVerifiedAt ?? "—"} />
              ) : null}
              {w.info.paidAt ? (
                <Field
                  k="Paid"
                  v={`${w.info.paidAt} · ref ${w.info.paymentReference ?? ""}`}
                />
              ) : null}
              {w.info.adminNotes ? (
                <Field k="Admin notes" v={w.info.adminNotes} />
              ) : null}
            </>
          ) : (
            <p className="col-span-full text-white/45">
              No info submitted yet (deadline {w.infoDeadline}).
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
            Mark verified
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
            Mark paid
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
            Redraw tier
          </button>
        ) : null}
      </footer>
    </article>
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
        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]",
        tone,
      )}
    >
      {status}
    </span>
  );
}

/* =====================================================================
 * Audit log section
 * =====================================================================*/

function AuditLogSection({ rows }: { rows: LotteryAuditRow[] }) {
  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
      <h3 className={cn(adminTokens.sectionHeader, "mb-3")}>
        Drawing audit log ({rows.length})
      </h3>
      {rows.length === 0 ? (
        <p className="text-[12px] text-white/45">No draws on record.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-[11px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-left font-semibold uppercase tracking-[0.12em] text-white/45">
                <th className="px-2 py-2">When</th>
                <th className="px-2 py-2">Competition</th>
                <th className="px-2 py-2">Kind</th>
                <th className="px-2 py-2 text-right">Eligible</th>
                <th className="px-2 py-2">Seed</th>
                <th className="px-2 py-2">Reason</th>
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
                        Redraw · tier {r.redrawPrizeTier}
                      </span>
                    ) : (
                      <span className="text-emerald-300">Initial</span>
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
