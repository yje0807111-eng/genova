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

export function TrophyManagement({
  competitions,
  onMessage,
}: {
  competitions: Competition[];
  onMessage: (message: string) => void;
}) {
  const router = useRouter();
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
        : `${row.genre ?? ""} 주간 ${row.rank ?? ""}위`;
    if (!confirm(`Revoke trophy?\n  ${label}\n  user: ${row.userDisplayName ?? row.userId}\n\nThis cannot be undone.`)) return;
    setRevokingId(row.id);
    try {
      const res = await revokeTrophyAction(row.id);
      if (res.ok) {
        onMessage("Trophy revoked.");
        setRecent((prev) => prev.filter((r) => r.id !== row.id));
        router.refresh();
      } else {
        onMessage(`Revoke failed: ${res.message}`);
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
      onMessage(res.ok ? "저장되었습니다." : res.message ?? "실패했습니다.");
      if (res.ok) {
        setSuccessMessage("저장되었습니다.");
        router.refresh();
      } else {
        setErrorMessage(res.message ?? "실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={adminTokens.card}>
      <h2 className={adminTokens.sectionHeader}>트로피</h2>

      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-[12px] font-semibold text-white/70">수동 트로피 지급</h3>
          <p className="mb-3 text-[11px] leading-relaxed text-white/35">
            수상자의 프로필 UUID와 공모전을 선택하고 수상 등급을 지정하세요.
            User UUID는 Supabase → Authentication → Users 에서 확인할 수 있습니다.
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
              <option value="">공모전 선택</option>
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <select value={trophyAward} onChange={(e) => setTrophyAward(e.target.value)} className={cn(adminTokens.input, "w-full")}>
              {["대상", "금상", "은상", "입선", "장려상"].map((a) => (
                <option key={a} value={a}>
                  {a}
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
              트로피 지급
            </button>
          </div>
        </div>

        <div className={adminTokens.divider} />

        <div>
          <h3 className="mb-2 text-[12px] font-semibold text-white/70">주간 장르 트로피</h3>
          <p className="mb-3 text-[11px] leading-relaxed text-white/35">
            매주 장르별 조회수 상위 크리에이터 3명에게 자동으로 트로피를 지급합니다.
            날짜를 비워두면 가장 최근 완료된 주(월요일 기준)가 자동 선택됩니다.
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
              주간 집계 실행
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
          <h3 className="text-[12px] font-semibold text-white/70">최근 트로피 (50건)</h3>
          <button
            type="button"
            onClick={() => void loadRecent()}
            disabled={recentLoading}
            className={cn(adminTokens.buttonGhost, "inline-flex items-center gap-1 text-[11px]")}
            title="새로고침"
          >
            <RefreshCw size={12} className={recentLoading ? "animate-spin" : ""} />
            새로고침
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-md border border-white/[0.06] bg-white/[0.01] px-3 py-6 text-center text-[11px] text-white/35">
            {recentLoading ? "불러오는 중…" : "지급된 트로피가 없습니다."}
          </p>
        ) : (
          <ul className="space-y-1">
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
                    : `${t.genre ?? ""} 주간 ${t.rank ?? ""}위 (${t.weekStart ?? ""})`}
                </span>
                <span className="hidden truncate text-white/40 sm:inline">
                  {t.userDisplayName ?? t.userId.slice(0, 8)}
                </span>
                <button
                  type="button"
                  onClick={() => void handleRevoke(t)}
                  disabled={revokingId === t.id}
                  className={cn(adminTokens.iconButton, "text-red-400 hover:text-red-300 disabled:opacity-40")}
                  title="회수"
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
