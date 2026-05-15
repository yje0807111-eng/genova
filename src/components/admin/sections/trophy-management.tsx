"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RefreshCw } from "lucide-react";
import {
  fetchRecentTrophiesAction,
  grantCompetitionTrophyAction,
  revokeTrophyAction,
  runWeeklyGenreTrophiesAction,
  type AdminTrophyRow,
} from "@/app/actions/trophies-admin";
import { adminTokens } from "@/lib/admin-styles";
import type { Competition } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { useI18n } from "@/components/genova/language-provider";

export function TrophyManagement({
  competitions,
  onMessage,
}: {
  competitions: Competition[];
  onMessage: (message: string) => void;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const tr = t; // alias for use inside recent.map() where loop var shadows `t`
  const [loading, setLoading] = useState(false);
  const [trophyUserId, setTrophyUserId] = useState("");
  const [trophyCompetitionId, setTrophyCompetitionId] = useState("");
  const [trophyAward, setTrophyAward] = useState("대상");
  const [weeklyWeekStart, setWeeklyWeekStart] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // H3-A.7: recent trophies list + revoke
  const [recent, setRecent] = useState<AdminTrophyRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadRecent = async () => {
    setRecentLoading(true);
    try {
      const rows = await fetchRecentTrophiesAction(50);
      setRecent(rows);
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    void loadRecent();
  }, []);

  const handleRevoke = async (row: AdminTrophyRow) => {
    const label =
      row.type === "competition"
        ? `${row.competitionTitle ?? row.competitionId ?? "competition"} · ${row.award ?? ""}`
        : t("adminTrophy.weeklyRankLabel", "{genre} weekly rank {rank}")
            .replace("{genre}", String(row.genre ?? ""))
            .replace("{rank}", String(row.rank ?? ""));
    if (
      !confirm(
        t(
          "adminTrophy.revokeConfirm",
          "Revoke trophy?\n  {label}\n  user: {user}\n\nThis cannot be undone.",
        )
          .replace("{label}", label)
          .replace("{user}", String(row.userDisplayName ?? row.userId)),
      )
    )
      return;
    setRevokingId(row.id);
    try {
      const res = await revokeTrophyAction(row.id);
      if (res.ok) {
        onMessage(t("adminTrophy.revokeSuccess", "Trophy revoked."));
        setRecent((prev) => prev.filter((r) => r.id !== row.id));
        router.refresh();
      } else {
        onMessage(
          t("adminTrophy.revokeFailed", "Revoke failed: {message}").replace(
            "{message}",
            String(res.message),
          ),
        );
      }
    } finally {
      setRevokingId(null);
    }
  };

  const call = async (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fn();
      onMessage(
        res.ok
          ? t("adminTrophy.saved", "Saved.")
          : res.message ?? t("adminTrophy.failed", "Failed."),
      );
      if (res.ok) {
        setSuccessMessage(t("adminTrophy.saved", "Saved."));
        router.refresh();
      } else {
        setErrorMessage(res.message ?? t("adminTrophy.failed", "Failed."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={adminTokens.card}>
      <h2 className={adminTokens.sectionHeader}>{t("adminTrophy.title", "Trophies")}</h2>

      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-[12px] font-semibold text-white/70">
            {t("adminTrophy.manualGrantHeader", "Manual Trophy Grant")}
          </h3>
          <p className="mb-3 text-[11px] leading-relaxed text-white/35">
            {t(
              "adminTrophy.manualGrantDesc",
              "Select the winner's profile UUID and competition, then specify the award tier. The User UUID can be found in Supabase → Authentication → Users.",
            )}
          </p>

          <div className="space-y-2">
            <input
              value={trophyUserId}
              onChange={(e) => setTrophyUserId(e.target.value)}
              className={cn(adminTokens.input, "w-full font-mono")}
              placeholder="User UUID (e.g. 91fb0109-...)"
            />
            <select
              value={trophyCompetitionId}
              onChange={(e) => setTrophyCompetitionId(e.target.value)}
              className={cn(adminTokens.input, "w-full")}
            >
              <option value="">{t("adminTrophy.selectCompetition", "Select competition")}</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <select value={trophyAward} onChange={(e) => setTrophyAward(e.target.value)} className={cn(adminTokens.input, "w-full")}>
              {(
                [
                  ["대상", t("adminTrophy.awardGrand", "Grand Prize")],
                  ["금상", t("adminTrophy.awardGold", "Gold Prize")],
                  ["은상", t("adminTrophy.awardSilver", "Silver Prize")],
                  ["입선", t("adminTrophy.awardSelected", "Selection")],
                  ["장려상", t("adminTrophy.awardEncouragement", "Encouragement Award")],
                ] as const
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                void call(() =>
                  grantCompetitionTrophyAction({
                    userId: trophyUserId.trim(),
                    competitionId: trophyCompetitionId.trim(),
                    award: trophyAward,
                  }),
                )
              }
              className={cn(adminTokens.buttonPrimary, "mt-1 h-9 w-full")}
            >
              {t("adminTrophy.grantButton", "Grant Trophy")}
            </button>
          </div>
        </div>

        <div className={adminTokens.divider} />

        <div>
          <h3 className="mb-2 text-[12px] font-semibold text-white/70">
            {t("adminTrophy.weeklyGenreHeader", "Weekly Genre Trophies")}
          </h3>
          <p className="mb-3 text-[11px] leading-relaxed text-white/35">
            {t(
              "adminTrophy.weeklyGenreDesc",
              "Automatically grants trophies to the top 3 creators by views in each genre every week. Leave the date empty to auto-select the most recently completed week (Monday-based).",
            )}
          </p>

          <div className="space-y-2">
            <input
              type="date"
              value={weeklyWeekStart}
              onChange={(e) => setWeeklyWeekStart(e.target.value)}
              className={cn(adminTokens.input, "w-full")}
              placeholder="Week start YYYY-MM-DD"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => void call(() => runWeeklyGenreTrophiesAction(weeklyWeekStart.trim() || undefined))}
              className={cn(adminTokens.buttonSecondary, "h-9 w-full")}
            >
              {t("adminTrophy.runWeeklyButton", "Run Weekly Aggregation")}
            </button>
          </div>
        </div>
      </div>

      {successMessage ? (
        <div className="mt-3 rounded-md border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-2 text-[11px] text-emerald-400">{successMessage}</div>
      ) : null}

      {errorMessage ? (
        <div className="mt-3 rounded-md border border-red-500/20 bg-red-500/[0.05] px-3 py-2 text-[11px] text-red-400">{errorMessage}</div>
      ) : null}

      {/* H3-A.7: recent trophies list + revoke */}
      <div className={cn(adminTokens.divider, "my-4")} />
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[12px] font-semibold text-white/70">
            {t("adminTrophy.recentHeader", "Recent Trophies (50)")}
          </h3>
          <button
            type="button"
            onClick={() => void loadRecent()}
            disabled={recentLoading}
            className={cn(adminTokens.buttonGhost, "inline-flex items-center gap-1 text-[11px]")}
            title={t("adminTrophy.refresh", "Refresh")}
          >
            <RefreshCw size={12} className={recentLoading ? "animate-spin" : ""} />
            {t("adminTrophy.refresh", "Refresh")}
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-md border border-white/[0.06] bg-white/[0.01] px-3 py-6 text-center text-[11px] text-white/35">
            {recentLoading
              ? t("adminTrophy.loading", "Loading…")
              : t("adminTrophy.empty", "No trophies have been granted.")}
          </p>
        ) : (
          <ul className="max-h-[320px] space-y-1 overflow-y-auto pr-0.5">
            {recent.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.01] px-2 py-1.5 text-[11px]"
              >
                <span
                  className={cn(
                    adminTokens.badge,
                    t.type === "competition" ? adminTokens.badgeInfo : adminTokens.badgeWarning,
                  )}
                >
                  {t.type === "competition" ? "Competition" : "Weekly"}
                </span>
                <span className="min-w-0 flex-1 truncate text-white/80">
                  {t.type === "competition"
                    ? `${t.competitionTitle ?? t.competitionId ?? "—"} · ${t.award ?? ""}`
                    : tr("adminTrophy.weeklyRowLabel", "{genre} weekly rank {rank} ({week})")
                        .replace("{genre}", String(t.genre ?? ""))
                        .replace("{rank}", String(t.rank ?? ""))
                        .replace("{week}", String(t.weekStart ?? ""))}
                </span>
                <span className="hidden truncate text-white/40 sm:inline">
                  {t.userDisplayName ?? t.userId.slice(0, 8)}
                </span>
                <button
                  type="button"
                  onClick={() => void handleRevoke(t)}
                  disabled={revokingId === t.id}
                  className={cn(adminTokens.iconButton, "text-red-400 hover:text-red-300 disabled:opacity-40")}
                  title={tr("adminTrophy.revokeAction", "Revoke")}
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
