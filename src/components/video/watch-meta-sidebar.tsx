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
import { MobileCommentPeek } from "@/components/video/mobile-comment-peek";
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
      <div className="shrink-0 space-y-2.5 border-b border-white/[0.06] px-3 pb-2.5 pt-1.5 sm:space-y-4 sm:px-4 sm:pb-3 sm:pt-4">
        {/* Video title (top) */}
        <div>
          <div className="flex items-start gap-2">
            <h2 className="min-w-0 flex-1 text-[16px] font-bold leading-tight text-white sm:text-[17px]">
              {video.title}
            </h2>
            {video.purpose === "competition" && (
              <span className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-semibold text-white/90 ring-1 ring-white/10">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: "#F5C451",
                    boxShadow: "0 0 6px rgba(245,196,81,0.8)",
                  }}
                  aria-hidden
                />
                {video.isFinalist
                  ? t("profile.finalist", "Finalist")
                  : t("profile.submission", "Submission")}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/45">
            {video.genre && (
              <>
                <span className="font-semibold uppercase tracking-[0.1em] text-white/55">
                  {video.genre}
                </span>
                <span className="text-white/15">·</span>
              </>
            )}
            <span>
              {t("watch.viewsCount", "조회수 {n}회").replace(
                "{n}",
                (video.viewCount ?? 0).toLocaleString(),
              )}
            </span>
            <span className="text-white/15">·</span>
            <span>{formatDate(video.createdAt, t)}</span>
          </div>
        </div>

        {/* 모바일 — 유튜브식: [아바타+이름→프로필] + [좋아요·저장·공유·⋯]
            (작품/팔로워·팔로우 버튼 없음) */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href={creatorHref ?? "#"}
            className="group flex min-w-0 flex-1 items-center gap-2.5"
          >
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/[0.10]">
              <Image
                src={creatorAvatarUrl || "/default-avatar.png"}
                alt={creatorName}
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="line-clamp-1 text-[13px] font-bold text-white">
              {creatorName}
            </p>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5 [&>button]:!h-7 [&>button]:!flex-none [&>button]:!justify-center [&>button]:!gap-0.5 [&>button]:!rounded-full [&>button]:!px-2.5 [&>button]:!text-[11px] [&>button>svg]:!h-3 [&>button>svg]:!w-3">
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
            {moreAction}
          </div>
        </div>

        {/* Creator row (데스크톱) — 아바타·이름·작품·팔로워·팔로우 */}
        <div
          className="hidden items-center gap-3 rounded-xl border border-white/[0.06] px-3 py-2.5 md:flex"
          style={{
            background:
              "linear-gradient(150deg, rgba(127,119,221,0.07) 0%, rgba(255,255,255,0.015) 55%)",
          }}
        >
          <Link
            href={creatorHref ?? "#"}
            className="group flex min-w-0 flex-1 items-center gap-2.5"
          >
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/[0.10]">
              <Image
                src={creatorAvatarUrl || "/default-avatar.png"}
                alt={creatorName}
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="line-clamp-1 text-[13px] font-bold text-white transition group-hover:text-[#AFA9EC]">
              {creatorName}
            </p>
          </Link>

          <div className="flex shrink-0 items-center gap-3">
            <div className="text-center leading-none">
              <p className="text-[13px] font-black tabular-nums text-white">
                {creatorVideoCount.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white/40">
                {t("watch.works", "작품")}
              </p>
            </div>
            <span className="h-6 w-px bg-white/[0.08]" aria-hidden />
            <div className="text-center leading-none">
              <p className="text-[13px] font-black tabular-nums text-white">
                {creatorFollowerCount.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white/40">
                {t("watch.followers", "팔로워")}
              </p>
            </div>

            {currentUserId && currentUserId !== creatorId && (
              <FollowButton
                targetUserId={creatorId}
                initialFollowing={isFollowingCreator}
              />
            )}
          </div>
        </div>

        {/* Engagement + actions — 풀폭 균등 액션 바 (좋아요·저장이
            동일 너비로 늘어나고, 공유·더보기는 우측 고정). 기존의
            왼쪽 정렬 축소 클러스터 구조 폐기. */}
        <div className="hidden items-center gap-1.5 md:flex">
          {/* 데스크톱 전용 — 풀폭 균등 액션 바 */}
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

      {/* 모바일: 탭바+내용+입력을 한 박스로 묶어 통일감.
          데스크톱은 md:contents 로 래퍼 해제(기존 레이아웃 유지). */}
      <div className="mx-3 mb-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.015] md:mx-0 md:mb-0 md:rounded-none md:border-0 md:bg-transparent md:contents">

      {/* Tab bar — 세그먼트 알약형 + 자동재생 토글 */}
      <div className="flex shrink-0 items-center gap-2 px-2 py-2">
        <div className="flex flex-1 items-center gap-0.5 rounded-xl bg-white/[0.03] p-1">
          {(hasSeries
            ? (["episodes", "comments", "details"] as const)
            : (["comments", "details"] as const)
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-[12px] font-semibold transition",
                activeTab === tab
                  ? "bg-white/[0.08] text-white shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]"
                  : "text-white/40 hover:text-white/75",
              )}
            >
              {tab === "episodes"
                ? `${t("watch.tab.episodes", "Episodes")} · ${seriesEpisodes?.length ?? 0}`
                : tab === "comments"
                  ? `${t("watch.tab.comments", "Comments")} · ${commentCount}`
                  : t("watch.tab.details", "Details")}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleAutoplay}
          title={
            autoplay
              ? t("watch.autoplay.on", "자동재생 켜짐")
              : t("watch.autoplay.off", "자동재생 꺼짐")
          }
          aria-pressed={autoplay}
          className={cn(
            "hidden shrink-0 items-center gap-1.5 rounded-full py-1.5 pl-2 pr-2.5 text-[11px] font-semibold transition lg:inline-flex",
            autoplay
              ? "bg-[#7F77DD]/[0.16] text-[#C7C2F0] ring-1 ring-[#7F77DD]/30"
              : "text-white/35 ring-1 ring-white/[0.07] hover:text-white/60 hover:ring-white/15",
          )}
        >
          <Repeat className="h-3 w-3" />
          {t("watch.autoplay.short", "자동")}
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
          <>
            {/* 모바일: 한 줄 회전 미리보기 → 탭 시 하단 시트 */}
            <div className="md:hidden">
              <MobileCommentPeek
                videoId={videoId}
                comments={initialComments}
                currentUserId={currentUserId}
                isVideoOwner={isVideoOwner}
              />
            </div>
            {/* 데스크톱: 기존 인라인 목록 */}
            <div className="hidden px-4 py-3 md:block">
              <VideoCommentsSection
                videoId={videoId}
                initialComments={initialComments}
                currentUserId={currentUserId}
                hideInput
                isVideoOwner={isVideoOwner}
              />
            </div>
          </>
        ) : (
          <div className="px-4 py-3">{descriptionInner}</div>
        )}
      </div>

      {/* Comment input pinned at bottom — 모바일은 시트 내부 입력 사용 */}
      {activeTab === "comments" && (
        <div className="hidden shrink-0 border-t border-white/10 px-4 py-3 md:block">
          <CommentInput videoId={videoId} currentUserId={currentUserId} />
        </div>
      )}
      </div>
    </div>
  );
}
