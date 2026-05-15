"use client";

import { useI18n } from "@/components/genova/language-provider";
import { adminTokens } from "@/lib/admin-styles";
import { cn } from "@/lib/utils/cn";

/**
 * Heuristic fallback when callers don't pass an explicit `kind`.
 * Conservative — we only mark a message as error when it clearly
 * announces failure.  Anything else (specific success copy in any
 * locale, "Marked verified", etc.) defaults to success-green.
 *
 * Replaces the previous strict "Saved successfully." / "저장되었습니다."
 * string match which mis-classified every other success message
 * (and all of ja) as red error banners.  (G8)
 */
function classifyMessage(text: string): "success" | "error" {
  const lower = text.toLowerCase();
  if (
    lower.includes("error") ||
    lower.includes("failed") ||
    lower.includes("fail") ||
    text.includes("실패") ||
    text.includes("오류") ||
    text.includes("失敗") ||
    text.includes("エラー")
  ) {
    return "error";
  }
  return "success";
}

export type AdminMessageKind = "success" | "error";

export function AdminHero({
  totalVideos,
  totalCompetitions,
  activeCompetitions,
  message,
  messageKind,
}: {
  totalVideos: number;
  totalCompetitions: number;
  activeCompetitions: number;
  message: string | null;
  /** Optional explicit success/error tone — falls through to a
   *  keyword heuristic when omitted (G8). */
  messageKind?: AdminMessageKind;
}) {
  const { t } = useI18n();

  return (
    <div className="mb-6">
      <div className="mb-1 flex items-center gap-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">{t("admin.dashboard", "Dashboard")}</p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[24px] font-bold tracking-tight text-white">{t("admin.title", "Admin")}</h1>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
            <span className="text-[14px] font-bold tabular-nums text-white">{totalVideos}</span>
            <span className="text-[11px] text-white/50">{t("admin.totalFilms", "전체 영상")}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
            <span className="text-[14px] font-bold tabular-nums text-white">{totalCompetitions}</span>
            <span className="text-[11px] text-white/50">{t("admin.competitions", "공모전")}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/15 bg-emerald-500/[0.04] px-3 py-1.5">
            <span className="text-[14px] font-bold tabular-nums text-emerald-400">{activeCompetitions}</span>
            <span className="text-[11px] text-emerald-400/70">{t("admin.active", "진행중")}</span>
          </div>
        </div>
      </div>

      {message ? (
        <>
          <div className={cn(adminTokens.divider, "my-4")} />
          <p
            className={cn(
              "rounded-md border px-3 py-2 text-[11px] font-medium",
              (messageKind ?? classifyMessage(message)) === "success"
                ? "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-400"
                : "border-red-500/20 bg-red-500/[0.05] text-red-400",
            )}
          >
            {message}
          </p>
        </>
      ) : null}
    </div>
  );
}
