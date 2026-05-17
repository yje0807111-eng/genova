"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Repeat } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  CommentInput,
  VideoCommentsSection,
} from "@/components/comments/video-comments-section";
import { useI18n } from "@/components/genova/language-provider";
import { FollowButton } from "@/components/profile/follow-button";
import { VideoLikeButton } from "@/components/video/video-like-button";
import { VideoSaveButton } from "@/components/video/video-save-button";
import { SeriesEpisodesList } from "@/components/video/series-episodes-list";
import type { Video, VideoComment } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface Props {
  videoId: string;
  video: Video;
  creatorId: string;
  creatorName: string;
  creatorAvatarUrl: string | null;
  creatorHref: string | null;
  creatorVideoCount: number;
  creatorFollowerCount: number;
  isFollowingCreator: boolean;
  currentUserId: string | null;
  descriptionInner: ReactNode;
  commentCount: number;
  initialComments: VideoComment[];
  isVideoOwner?: boolean;
  playerActions?: ReactNode;
  /** 우측 구석 더보기(신고) 버튼. */
  moreAction?: ReactNode;
  /** 시리즈 시청 중이면 회차 목록 (사이드바 '회차' 탭). */
  seriesEpisodes?: Video[];
}

function formatDate(
  date: string | Date | null | undefined,
  t: (key: string, fallback: string) => string,
): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return t("watchMeta.timeJustNow", "just now");
  if (diff < 3600)
    return t("watchMeta.timeMinutesAgo", "{n} minutes ago").replace(
      "{n}",
      String(Math.floor(diff / 60)),
    );
  if (diff < 86400)
    return t("watchMeta.timeHoursAgo", "{n} hours ago").replace(
      "{n}",
      String(Math.floor(diff / 3600)),
    );
  if (diff < 604800)
    return t("watchMeta.timeDaysAgo", "{n} days ago").replace(
      "{n}",
      String(Math.floor(diff / 86400)),
    );
  return d.toISOString().slice(0, 10);
}

function formatRuntime(runtime: string | number | null | undefined): string {
  if (!runtime) return "";
  const seconds = typeof runtime === "string" ? parseFloat(runtime) : runtime;
  if (isNaN(seconds) || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WatchMetaSidebar({
  videoId,
  video,
  creatorId,
  creatorName,
  creatorAvatarUrl,
  creatorHref,
  creatorVideoCount,
  creatorFollowerCount,
  isFollowingCreator,
  currentUserId,
  descriptionInner,
  commentCount,
  initialComments,
  isVideoOwner,
  playerActions,
  moreAction,
  seriesEpisodes,
}: Props) {
  const hasSeries = (seriesEpisodes?.length ?? 0) > 1;
  const [activeTab, setActiveTab] = useState<
    "episodes" | "comments" | "details"
  >(hasSeries ? "episodes" : "comments");
  const { t } = useI18n();
  const [autoplay, setAutoplay] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("genova_autoplay");
    setAutoplay(saved === "true");
  }, []);

  const toggleAutoplay = () => {
    const next = !autoplay;
    setAutoplay(next);
    localStorage.setItem("genova_autoplay", String(next));
  };

  const metaParts: string[] = [];
  if (video.genre) metaParts.push(video.genre.toUpperCase());
  const rt = formatRuntime(video.runtime);
  if (rt) metaParts.push(rt);
  if (video.viewCount != null)
    metaParts.push(`${video.viewCount.toLocaleString()} ${t("watch.views", "views")}`);
  const dateStr = formatDate(video.createdAt, t);
  if (dateStr) metaParts.push(dateStr);

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* Title + meta + creator + engagement */}
      <div className="shrink-0 space-y-4 border-b border-white/[0.06] px-4 pb-3 pt-4">
        {/* Video title (top) */}
        <div>
          <h2 className="text-[17px] font-bold leading-tight text-white">
            {video.title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/45">
            {video.genre && (
              <>
                <span className="font-semibold uppercase tracking-[0.1em] text-white/55">
                  {video.genre}
                </span>
                <span className="text-white/15">·</span>
              </>
            )}
            <span>{(video.viewCount ?? 0).toLocaleString()} {t("watch.views", "회 시청")}</span>
            <span className="text-white/15">·</span>
            <span>{formatDate(video.createdAt, t)}</span>
          </div>
        </div>

        {/* Creator row */}
        <div className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.02] p-2">
          <Link
            href={creatorHref ?? "#"}
            className="group flex min-w-0 items-center gap-2"
          >
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/[0.08]">
              <Image src={creatorAvatarUrl || "/default-avatar.png"} alt={creatorName} width={32} height={32} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="line-clamp-1 text-[13px] font-bold text-white transition group-hover:text-[#AFA9EC]">
                {creatorName}
              </p>
              <p className="text-[10px] text-white/45">
                {creatorVideoCount} {t("watch.works", "작품")} · {creatorFollowerCount.toLocaleString()} {t("watch.followers", "팔로워")}
              </p>
            </div>
          </Link>

          {currentUserId && currentUserId !== creatorId && (
            <div className="shrink-0">
              <FollowButton
                targetUserId={creatorId}
                initialFollowing={isFollowingCreator}
              />
            </div>
          )}
        </div>

        {/* Engagement + actions — 풀폭 균등 액션 바 (좋아요·저장이
            동일 너비로 늘어나고, 공유·더보기는 우측 고정). 기존의
            왼쪽 정렬 축소 클러스터 구조 폐기. */}
        <div className="flex items-center gap-1.5">
          {/* 좋아요·저장·공유 — 동일 크기(flex-1, 가운데 정렬) */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5 [&>button]:!h-9 [&>button]:!flex-1 [&>button]:!justify-center [&>button]:!gap-1 [&>button]:!rounded-md [&>button]:!px-2 [&>button]:!text-[12px] [&>button>svg]:!h-3.5 [&>button>svg]:!w-3.5">
            <VideoLikeButton
              videoId={videoId}
              initialCount={video.likeCount ?? 0}
              initialLiked={video.likedByMe ?? false}
            />
            <VideoSaveButton
              videoId={videoId}
              initialSaved={video.savedByMe ?? false}
              initialCount={video.saveCount ?? 0}
            />
            {playerActions}
          </div>
          {/* 더보기 — 우측 구석 고정 (스타일은 컴포넌트 자체에서) */}
          {moreAction && <div className="shrink-0">{moreAction}</div>}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex shrink-0 items-center border-b border-white/10 pr-2">
        {(hasSeries
          ? (["episodes", "comments", "details"] as const)
          : (["comments", "details"] as const)
        ).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2.5 text-xs font-semibold transition",
              activeTab === tab
                ? "border-b-2 border-[#7F77DD] text-white"
                : "text-white/45 hover:text-white/80",
            )}
          >
            {tab === "episodes"
              ? `${t("watch.tab.episodes", "Episodes")} (${seriesEpisodes?.length ?? 0})`
              : tab === "comments"
                ? `${t("watch.tab.comments", "Comments")} (${commentCount})`
                : t("watch.tab.details", "Details")}
          </button>
        ))}

        <button
          type="button"
          onClick={toggleAutoplay}
          title={autoplay ? t("watch.autoplay.on", "자동재생 켜짐") : t("watch.autoplay.off", "자동재생 꺼짐")}
          className={cn(
            "ml-auto hidden shrink-0 items-center gap-1.5 rounded-md px-2 py-1 transition lg:inline-flex",
            autoplay
              ? "bg-white/[0.04] text-[#AFA9EC]"
              : "text-white/40 hover:text-white/70",
          )}
        >
          <Repeat className="h-3 w-3" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
            {t("watch.autoplay.short", "자동")}
          </span>
        </button>
      </div>

      {/* Tab content — 모바일은 댓글이 무한히 아래로 늘어나지 않도록
          최대 높이 제한 + 내부 스크롤. 데스크톱은 기존 flex 채움. */}
      <div
        className="max-h-[65vh] min-h-0 flex-1 overflow-y-auto overscroll-contain md:max-h-none"
        onWheel={(e) => e.stopPropagation()}
      >
        {activeTab === "episodes" && seriesEpisodes ? (
          <div className="px-3 py-3">
            <SeriesEpisodesList
              episodes={seriesEpisodes}
              currentVideoId={videoId}
            />
          </div>
        ) : activeTab === "comments" ? (
          <div className="px-4 py-3">
            <VideoCommentsSection
              videoId={videoId}
              initialComments={initialComments}
              currentUserId={currentUserId}
              hideInput
              isVideoOwner={isVideoOwner}
            />
          </div>
        ) : (
          <div className="px-4 py-3">
            {descriptionInner}

            {video.purpose === "competition" && (
              <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/70">
                  {video.isFinalist ? "FINALIST" : "ENTRY"}
                </p>
                {video.award && (
                  <p className="mt-1 text-[11px] text-amber-300">🏆 {video.award}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comment input pinned at bottom */}
      {activeTab === "comments" && (
        <div className="shrink-0 border-t border-white/10 px-4 py-3">
          <CommentInput videoId={videoId} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  );
}
