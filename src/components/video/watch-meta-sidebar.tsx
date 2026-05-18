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
      <div className="shrink-0 space-y-2.5 border-b border-white/[0.06] px-2 pb-1 pt-1.5 sm:space-y-4 sm:px-4 sm:pb-3 sm:pt-4">
        {/* Video title (top) */}
        <div>
          <div className="flex items-start gap-2">
            <h2 className="min-w-0 flex-1 text-[18px] font-bold leading-tight text-white sm:text-[19px]">
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
            {moreAction && (
              <div className="-my-1 ml-0.5 shrink-0">{moreAction}</div>
            )}
          </div>
        </div>

        {/* 유튜브식 간소화 — 데스크톱·모바일 공통: [아바타+이름→프로필]
            + [좋아요·저장·공유·⋯]. 작품/팔로워 통계·팔로우 버튼 없음. */}
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link
              href={creatorHref ?? "#"}
              className="-mt-4 h-12 w-12 shrink-0 self-start overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/[0.10]"
            >
              <Image
                src={creatorAvatarUrl || "/default-avatar.png"}
                alt={creatorName}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </Link>
            <div className="flex min-w-0 flex-col justify-center gap-1">
              <Link
                href={creatorHref ?? "#"}
                className="line-clamp-1 text-[13px] font-bold leading-none text-white transition hover:text-[#AFA9EC]"
              >
                {creatorName}
              </Link>
              {currentUserId && currentUserId !== creatorId && (
                <div className="[&>button]:!h-[26px] [&>button]:!gap-1 [&>button]:!self-start [&>button]:!rounded-full [&>button]:!px-3 [&>button]:!py-0 [&>button]:!text-[11px] [&>button>svg]:!h-3 [&>button>svg]:!w-3">
                  <FollowButton
                    targetUserId={creatorId}
                    initialFollowing={isFollowingCreator}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 [&>button]:!h-6 [&>button]:!flex-none [&>button]:!justify-center [&>button]:!gap-0.5 [&>button]:!rounded-full [&>button]:!px-2 [&>button]:!text-[10px] [&>button>svg]:!h-2.5 [&>button>svg]:!w-2.5">
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
        </div>
      </div>

      {/* 모바일: 탭바+내용+입력이 별도 박스/여백 없이 본문에 자연스럽게
          이어지도록(상세정보처럼). 데스크톱은 md:contents 로 래퍼 해제. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:contents">

      {/* Tab bar — 세그먼트 알약형 + 자동재생 토글 */}
      <div className="flex shrink-0 items-center gap-2 px-2 pb-2 pt-1 sm:py-2">
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
              ? "bg-white/[0.06] text-white/70 ring-1 ring-white/[0.12]"
              : "text-white/30 ring-1 ring-white/[0.06] hover:text-white/55 hover:ring-white/[0.12]",
          )}
        >
          <Repeat className="h-3 w-3" />
          {t("watch.autoplay.short", "자동")}
        </button>
      </div>

      {/* Tab content — 모바일은 댓글이 무한히 아래로 늘어나지 않도록
          최대 높이 제한 + 내부 스크롤. 데스크톱은 기존 flex 채움. */}
      <div
        className="max-h-[74vh] min-h-0 flex-1 overflow-y-auto overscroll-contain md:max-h-none"
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
          <div className="px-2 py-3 sm:px-4">{descriptionInner}</div>
        )}
      </div>

      {/* Comment input pinned at bottom — 모바일은 시트 내부 입력 사용 */}
      {activeTab === "comments" && (
        <div className="hidden shrink-0 border-t border-white/10 py-2 pl-4 pr-8 md:block">
          <CommentInput videoId={videoId} currentUserId={currentUserId} />
        </div>
      )}
      </div>
    </div>
  );
}
