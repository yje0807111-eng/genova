"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CommentInput, VideoCommentsSection } from "@/components/comments/video-comments-section";
import { useI18n } from "@/components/genova/language-provider";
import { formatGenreDisplay } from "@/lib/constants/genres";
import type { Video, VideoComment } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatViewCountShort } from "@/lib/view-count";

/** Server page wraps description + sidebar in one client boundary. */
export function WatchDesktopFlexRow({
  leftBeforeDescription,
  descriptionInner,
  leftAfterDescription,
  related,
  videoId,
  commentCount,
  initialComments,
  currentUserId,
  onAutoplayChange,
  isVideoOwner,
}: {
  leftBeforeDescription: ReactNode;
  descriptionInner: ReactNode;
  leftAfterDescription: ReactNode;
  related: Video[];
  videoId: string;
  commentCount: number;
  initialComments: VideoComment[];
  currentUserId: string | null;
  onAutoplayChange?: (on: boolean) => void;
  isVideoOwner?: boolean;
}) {
  const { locale, t } = useI18n();
  const commentsRef = useRef<HTMLDivElement>(null);
  const [autoplayOn, setAutoplayOn] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("genova_autoplay");
    return stored === null ? true : stored === "true";
  });

  useEffect(() => {
    void fetch("/api/watch-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
  }, [videoId]);

  return (
    <div className="flex items-start gap-6">
      <div className="min-w-0 w-full shrink-0 lg:w-[70%]">
        {leftBeforeDescription}
        <div className="mt-3 space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">{descriptionInner}</div>
        {leftAfterDescription}
      </div>

      <div className="hidden lg:flex lg:w-[340px] lg:shrink-0 lg:flex-col lg:gap-3 sticky top-[72px] self-start">
        {/* Up Next — 고정 높이, 독립 스크롤 */}
        <div
          className="flex flex-col rounded-xl border border-white/10 bg-[#0F0D1E]"
          style={{ height: "273px" }}
        >
          {/* 헤더 */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">{t("watch.upNext")}</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-white/40">{t("watch.autoplay")}</span>
              <button
                type="button"
                role="switch"
                aria-checked={autoplayOn}
                onClick={() => {
                  setAutoplayOn((v) => {
                    const next = !v;
                    localStorage.setItem("genova_autoplay", String(next));
                    return next;
                  });
                }}
                className="relative h-4 w-8 shrink-0 rounded-full bg-[#534AB7]"
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-[left]",
                    autoplayOn ? "left-4" : "left-0.5",
                  )}
                />
              </button>
            </div>
          </div>

          {/* 카드 리스트 — 독립 스크롤 */}
          <div
            className="min-h-0 flex-1 overflow-y-auto px-2 py-2"
            style={{ overscrollBehavior: "contain" }}
            onWheel={(e) => e.stopPropagation()}
          >
            {related.map((item) => (
              <Link
                key={item.id}
                href={"/watch/" + item.id}
                className="group flex gap-3 rounded-lg px-2 py-1.5 transition hover:bg-white/5"
              >
                <div className="relative h-[60px] w-[100px] shrink-0 overflow-hidden rounded-md">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#1a1547] to-[#0f0d24]" />
                  )}
                  {item.runtime ? (
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[10px] font-bold text-white">
                      {item.runtime}
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-[12px] font-semibold text-white transition group-hover:text-[#AFA9EC]">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-white/40">{formatGenreDisplay(item.genre, item.subGenre, locale)}</p>
                  <p className="mt-0.5 text-[11px] text-white/30">
                    {item.viewCount ? `${formatViewCountShort(item.viewCount)} ${t("feed.views")}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Comments — 유동 높이, 독립 스크롤 */}
        <div
          className="flex flex-col rounded-xl border border-white/10 bg-[#0F0D1E] overflow-hidden"
          ref={commentsRef}
          style={{
            maxHeight: "calc(100vh - 72px - 273px - 12px - 3px)",
            // 100vh - 네비바높이 - UpNext높이 - gap - 여유
          }}
        >
          <div className="shrink-0 border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">
              {t("watch.sidebarTabComments").replace("{n}", String(commentCount))}
            </h2>
          </div>

          {/* 댓글 내용 — 독립 스크롤 */}
          <div
            className="min-h-0 flex-1 overflow-y-auto"
            style={{ overscrollBehavior: "contain" }}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3">
              <VideoCommentsSection
                videoId={videoId}
                initialComments={initialComments}
                currentUserId={currentUserId}
                hideInput={true}
                isVideoOwner={isVideoOwner}
              />
            </div>
          </div>

          {/* 댓글 입력창 */}
          <div className="shrink-0 border-t border-white/10 px-4 py-3">
            <CommentInput videoId={videoId} currentUserId={currentUserId} />
          </div>
        </div>
      </div>
    </div>
  );
}
