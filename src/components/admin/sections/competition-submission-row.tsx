"use client";

import { useState } from "react";
import { ExternalLink, EyeOff, Star, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { setVideoAwardAction, setVideoFinalistAction, type CompetitionSubmissionVideo } from "@/app/actions/admin";
import { deleteVideoAction, updateVideoVisibilityAction } from "@/app/actions/video";
import { adminTokens } from "@/lib/admin-styles";
import { useI18n } from "@/components/genova/language-provider";
import { cn } from "@/lib/utils/cn";

// 공모전 수상 등급 — trophies-admin 의 COMPETITION_AWARDS 와 일치.
const AWARD_GRADES = ["대상", "금상", "은상", "입선", "장려상"] as const;

function formatRelativeTime(date: string | Date, t: (key: string, fallback: string) => string) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return t("adminSubRow.timeJustNow", "just now");
  if (hours < 24)
    return t("adminSubRow.timeHoursAgo", "{n}h ago").replace("{n}", String(hours));
  const days = Math.floor(hours / 24);
  if (days < 7)
    return t("adminSubRow.timeDaysAgo", "{n}d ago").replace("{n}", String(days));
  return new Date(date).toLocaleDateString("ko-KR");
}

export function CompetitionSubmissionRow({
  video,
  compId,
  loading,
  pendingFeaturedId,
  onToggleFeatured,
  onRunVideoAction,
}: {
  video: CompetitionSubmissionVideo;
  compId: string;
  loading: boolean;
  pendingFeaturedId: string | null;
  onToggleFeatured: (compId: string, videoId: string, currentFeatured: boolean) => void;
  onRunVideoAction: (compId: string, fn: () => Promise<{ ok: boolean; message?: string }>) => Promise<void>;
}) {
  const { t } = useI18n();
  const [awardMenuOpen, setAwardMenuOpen] = useState(false);

  const applyAward = (grade: string) => {
    setAwardMenuOpen(false);
    void onRunVideoAction(compId, () => setVideoAwardAction(video.id, grade));
  };

  return (
    <div
      className={cn(
        "group rounded-md transition",
        video.is_competition_featured
          ? "border border-[#7F77DD]/30 bg-[#7F77DD]/[0.05]"
          : "border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] hover:bg-white/[0.03]",
      )}
    >
      <div className="flex flex-wrap items-center gap-2 px-2.5 py-2 sm:flex-nowrap sm:gap-3">
      <div className="relative h-10 w-[72px] shrink-0 overflow-hidden rounded">
        {video.thumbnail_url?.trim() ? (
          <Image src={video.thumbnail_url} alt="" fill sizes="72px" className="object-cover" />
        ) : (
          <div className="h-full w-full bg-white/[0.04]" />
        )}
      </div>

      <div className="min-w-0 flex-1 basis-[140px]">
        <div className="flex min-w-0 items-center gap-1.5">
          {video.is_competition_featured ? (
            <Star size={11} className="shrink-0 fill-[#AFA9EC] text-[#AFA9EC]" aria-hidden />
          ) : null}
          <p className="truncate text-[12px] font-medium text-white">{video.title}</p>
        </div>
        <p className="truncate text-[10px] text-white/35">{video.profiles?.display_name ?? t("adminSubRow.anonymous", "Anonymous")}</p>
      </div>

      <div className="flex shrink-0 items-center gap-3 font-mono text-[10px] text-white/35">
        <span title={t("adminSubRow.views", "Views")}>{video.view_count ?? 0}</span>
        <span title={t("adminSubRow.likes", "Likes")} className="text-[#FF6B9D]/70">
          ♥ {video.like_count}
        </span>
        <span className="text-white/30">{formatRelativeTime(video.created_at, t)}</span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          disabled={loading || pendingFeaturedId === video.id}
          onClick={() => void onToggleFeatured(compId, video.id, video.is_competition_featured)}
          className={cn(
            "h-7 rounded-md px-2 text-[11px] font-medium transition",
            video.is_competition_featured
              ? "border border-[#7F77DD]/30 bg-[#7F77DD]/20 text-[#AFA9EC] hover:bg-[#7F77DD]/30"
              : "border border-white/[0.08] bg-white/[0.02] text-white/50 opacity-100 hover:bg-white/[0.06] hover:text-white/80 [@media(hover:hover)]:sm:opacity-0 [@media(hover:hover)]:sm:group-hover:opacity-100",
          )}
          title={video.is_competition_featured ? t("adminSubRow.unfeature", "Unfeature") : t("adminSubRow.feature", "Feature")}
        >
          {video.is_competition_featured ? t("adminSubRow.featured", "✦ Featured") : t("adminSubRow.featureShort", "Feature")}
        </button>
        <Link
          href={`/watch/${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            adminTokens.iconButton,
            "h-7 w-7 opacity-100 transition-opacity [@media(hover:hover)]:sm:opacity-0 [@media(hover:hover)]:sm:group-hover:opacity-100",
          )}
          title={t("adminSubRow.view", "View")}
        >
          <ExternalLink size={12} />
        </Link>
      </div>

      <div className="flex w-full shrink-0 flex-wrap items-center gap-1 opacity-100 transition-opacity sm:ml-auto sm:w-auto [@media(hover:hover)]:sm:opacity-0 [@media(hover:hover)]:sm:group-hover:opacity-100">
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            void onRunVideoAction(compId, () => setVideoFinalistAction(video.id, !video.is_finalist))
          }
          className={cn(adminTokens.buttonGhost, "h-7 px-2 text-[10px]")}
        >
          {video.is_finalist ? t("adminSubRow.finalist", "✓ Finalist") : t("adminSubRow.setFinalist", "Set finalist")}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => setAwardMenuOpen((v) => !v)}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-medium transition",
            video.award
              ? "border border-amber-400/30 bg-amber-400/15 text-amber-300 hover:bg-amber-400/25"
              : "text-white/50 hover:bg-white/[0.06] hover:text-white/80",
            awardMenuOpen && "bg-white/[0.06] text-white/80",
          )}
          title={t("adminSubRow.setAward", "Set award grade")}
        >
          <Trophy size={11} />
          {video.award ? video.award : t("adminSubRow.trophy", "Trophy")}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            void onRunVideoAction(compId, () =>
              updateVideoVisibilityAction(video.id, video.visibility === "private" ? "public" : "private"),
            )
          }
          className={cn(adminTokens.buttonGhost, "inline-flex h-7 items-center gap-1 px-2 text-[10px]")}
        >
          {video.visibility === "private" ? (
            <>
              <EyeOff size={11} /> {t("adminSubRow.private", "Private")}
            </>
          ) : (
            t("adminSubRow.private", "Private")
          )}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            if (
              !confirm(
                t("adminSubRow.deleteConfirm", 'Delete the video "{title}"?').replace(
                  "{title}",
                  video.title,
                ),
              )
            )
              return;
            void onRunVideoAction(compId, () => deleteVideoAction(video.id));
          }}
          className={cn(adminTokens.buttonGhost, "h-7 px-2 text-[10px] text-red-400/80 hover:text-red-400")}
        >
          {t("adminSubRow.delete", "Delete")}
        </button>
      </div>
      </div>

      {/* 수상 등급 inline 펼침 — absolute 드롭다운은 스크롤
          컨테이너(max-h overflow-y-auto)에 잘려서, 일반 흐름 줄로
          펼친다.  overflow 와 무관하게 항상 보임. */}
      {awardMenuOpen ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] px-2.5 py-2">
          <span className="mr-1 text-[10px] text-white/40">{t("adminSubRow.awardGrade", "Award grade")}</span>
          {AWARD_GRADES.map((grade) => (
            <button
              key={grade}
              type="button"
              disabled={loading}
              onClick={() => applyAward(grade)}
              className={cn(
                "h-7 rounded-md px-2.5 text-[11px] font-medium transition",
                video.award === grade
                  ? "border border-amber-400/40 bg-amber-400/20 text-amber-300"
                  : "border border-white/[0.08] bg-white/[0.02] text-white/60 hover:bg-white/[0.06] hover:text-white/90",
              )}
            >
              {grade}
            </button>
          ))}
          {video.award ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => applyAward("")}
              className="h-7 rounded-md px-2.5 text-[11px] font-medium text-red-400/80 transition hover:bg-red-500/10 hover:text-red-400"
            >
              {t("adminSubRow.clearAward", "Clear award")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
