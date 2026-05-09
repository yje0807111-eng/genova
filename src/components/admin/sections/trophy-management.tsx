"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { grantCompetitionTrophyAction, runWeeklyGenreTrophiesAction } from "@/app/actions/trophies-admin";
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
          <p className="mb-3 text-[11px] leading-relaxed text-white/40">
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
          <p className="mb-3 text-[11px] leading-relaxed text-white/40">
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
    </div>
  );
}
