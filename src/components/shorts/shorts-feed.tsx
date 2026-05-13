"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { recordShortsViewAction } from "@/app/actions/video-views";
import { normalizeToolName } from "@/lib/constants/ai-tools";
import { hrefForVideoCreator } from "@/lib/creator-links";
import type { Video } from "@/lib/types";
import { VideoLikeButton } from "@/components/video/video-like-button";
import { VideoSaveButton } from "@/components/video/video-save-button";
import { ShortsLeftRail, ShortsRightRail } from "@/components/shorts/shorts-desktop-rails";
import { useUploadModal } from "@/components/upload/upload-modal-context";

/** Matches `SiteHeader` `h-16` (4rem) for below-the-fold shorts area */
export const SHORTS_NAV_OFFSET = "4rem";

export type ShortsFeedItem = Video & {
  commentCount: number;
  uploaderAvatarUrl: string | null;
  creatorAvatarUrl: string | null;
};

function displayName(v: ShortsFeedItem): string {
  if (v.creatorName) return v.creatorName;
  if (v.uploaderDisplayName) return v.uploaderDisplayName;
  return "Creator";
}

function avatarForVideo(v: ShortsFeedItem): string | null {
  if (v.creatorId && v.creatorAvatarUrl) return v.creatorAvatarUrl;
  return v.uploaderAvatarUrl;
}

function ActionRail({ video, shareUrl }: { video: ShortsFeedItem; shareUrl: string }) {
  const onShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}${shareUrl}` : shareUrl;
    try {
      if (navigator.share) {
        await navigator.share({ title: video.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* noop */
    }
  }, [shareUrl, video.title]);

  return (
    <>
      <VideoLikeButton
        videoId={video.id}
        initialCount={video.likeCount ?? 0}
        initialLiked={video.likedByMe ?? false}
        stacked
        compact
        className="!rounded-2xl !bg-black/50"
      />
      <Link
        href={`/watch/${video.id}`}
        className="flex flex-col items-center gap-0.5 rounded-2xl bg-black/50 px-2 py-2 text-[#EEEDFE] backdrop-blur-sm transition hover:bg-black/60"
        aria-label="Comments"
      >
        <svg className="h-6 w-6 shrink-0 text-[#AFA9EC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M21 12a8 8 0 01-8 8H6.5L3 21l1.5-4.5A8 8 0 013 12a8 8 0 018-8 8 8 0 018 8z" />
        </svg>
        <span className="min-w-[1rem] text-center text-[10px] font-medium tabular-nums text-[#EEEDFE]">{video.commentCount}</span>
      </Link>
      <VideoSaveButton videoId={video.id} initialSaved={video.savedByMe ?? false} compact className="!rounded-2xl !bg-black/50 !p-2.5" />
      <button
        type="button"
        onClick={() => void onShare()}
        className="flex flex-col items-center gap-0.5 rounded-2xl bg-black/50 px-2 py-2 text-[#EEEDFE] backdrop-blur-sm transition hover:bg-black/60"
        aria-label="Share"
      >
        <svg className="h-6 w-6 text-[#AFA9EC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4-4 4M12 2v14" />
        </svg>
        <span className="text-[10px] font-medium text-[#AFA9EC]">Share</span>
      </button>
    </>
  );
}

function useShortsCardHeightExpr(): string {
  const [expr, setExpr] = useState("calc((100vw - 7rem) * 16 / 9)");
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () =>
      setExpr(mq.matches ? "calc((100vw - 40rem) * 16 / 9)" : "calc((100vw - 7rem) * 16 / 9)");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return expr;
}

function ShortsSlide({
  video,
  index,
  activeIndex,
  cardHeightExpr,
}: {
  video: ShortsFeedItem;
  index: number;
  activeIndex: number;
  cardHeightExpr: string;
}) {
  const playing = index === activeIndex;
  const near = Math.abs(index - activeIndex) <= 1;
  const vimeoSrc = `https://player.vimeo.com/video/${video.vimeoId}?autoplay=${playing ? 1 : 0}&muted=1&loop=1&playsinline=1&title=0&byline=0&portrait=0`;

  const name = displayName(video);
  const av = avatarForVideo(video);
  const profileHref = hrefForVideoCreator(video);
  const shareUrl = `/watch/${video.id}`;

  /** 9:16 portrait: fill (100dvh − nav) height; `cardHeightExpr` accounts for desktop side rails */
  const cardStyle: CSSProperties = {
    aspectRatio: "9 / 16",
    height: `min(calc(100dvh - ${SHORTS_NAV_OFFSET}), ${cardHeightExpr})`,
    width: "auto",
    maxHeight: `calc(100dvh - ${SHORTS_NAV_OFFSET})`,
  };

  return (
    <div
      className="relative w-full shrink-0 snap-start snap-always bg-[#0a0a0a]"
      style={{ height: `calc(100dvh - ${SHORTS_NAV_OFFSET})` }}
    >
      <div className="mx-auto flex h-full w-full max-w-[min(1600px,100%)] items-center justify-center gap-3 px-3 md:gap-5 md:px-6">
        <div
          className="relative shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_24px_80px_-12px_rgba(0,0,0,0.75),0_0_0_1px_rgba(127,119,221,0.12)]"
          style={cardStyle}
        >
          {near ? (
            <iframe
              key={video.id}
              src={vimeoSrc}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
          ) : (
            <div className="absolute inset-0">
              <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover opacity-45" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/50" />
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35" />

          <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 p-4 md:p-5">
            <div className="flex items-end gap-3 pr-14 md:pr-0">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/20 bg-[#26215C]">
                    {av ? (
                      <img src={av} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#AFA9EC]">{name.slice(0, 1)}</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    {profileHref ? (
                      <Link href={profileHref} className="block truncate text-sm font-semibold text-[#F8F7FF] hover:underline">
                        {name}
                      </Link>
                    ) : (
                      <span className="block truncate text-sm font-semibold text-[#F8F7FF]">{name}</span>
                    )}
                  </div>
                </div>
                <Link href={`/watch/${video.id}`} className="block">
                  <h2 className="line-clamp-2 text-base font-bold leading-snug text-[#F8F7FF] drop-shadow-md">{video.title}</h2>
                </Link>
                {video.aiTools.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {video.aiTools.slice(0, 6).map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-[#1a1a1a]/90 px-2 py-0.5 text-[10px] font-medium text-[#AFA9EC] ring-1 ring-white/10"
                      >
                        {normalizeToolName(t)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden shrink-0 flex-col items-center justify-center gap-4 md:flex">
          <ActionRail video={video} shareUrl={shareUrl} />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-24 right-4 z-20 flex flex-col items-center gap-4 md:hidden">
        <div className="pointer-events-auto flex flex-col items-center gap-4">
          <ActionRail video={video} shareUrl={shareUrl} />
        </div>
      </div>
    </div>
  );
}

export function ShortsFeed({ videos }: { videos: ShortsFeedItem[] }) {
  const { open: openUploadModal } = useUploadModal();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const viewedRef = useRef(new Set<string>());
  const cardHeightExpr = useShortsCardHeightExpr();

  const scrollToIndex = useCallback(
    (i: number) => {
      const el = containerRef.current;
      if (!el) return;
      const h = el.clientHeight;
      if (h <= 0) return;
      const clamped = Math.max(0, Math.min(i, videos.length - 1));
      el.scrollTo({ top: clamped * h, behavior: "smooth" });
    },
    [videos.length],
  );

  const updateActiveFromScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const h = el.clientHeight;
    if (h <= 0) return;
    const i = Math.round(el.scrollTop / h);
    const clamped = Math.max(0, Math.min(i, videos.length - 1));
    setActiveIndex(clamped);
  }, [videos.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => updateActiveFromScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    updateActiveFromScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [updateActiveFromScroll, videos.length]);

  useEffect(() => {
    const id = videos[activeIndex]?.id;
    if (!id || viewedRef.current.has(id)) return;
    viewedRef.current.add(id);
    void recordShortsViewAction(id);
  }, [activeIndex, videos]);

  if (videos.length === 0) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
        <p className="text-lg font-semibold text-[#F8F7FF]">No public films yet</p>
        <p className="mt-2 text-sm text-[#AFA9EC]">Check back soon or upload from the studio.</p>
        <button type="button" onClick={() => openUploadModal()} className="mt-6 rounded-[6px] bg-[#534AB7] px-5 py-2.5 text-sm font-semibold text-[#EEEDFE]">
          Upload
        </button>
      </div>
    );
  }

  const shortH = `calc(100dvh - ${SHORTS_NAV_OFFSET})`;

  return (
    <div className="relative bg-[#0a0a0a]" style={{ minHeight: shortH }}>
      <Link
        href="/feed"
        className="fixed left-4 z-[60] rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-semibold text-[#EEEDFE] backdrop-blur-md transition hover:border-[#7F77DD]/50 md:left-6 lg:hidden"
        style={{ top: `calc(${SHORTS_NAV_OFFSET} + 0.5rem)` }}
      >
        ← Watch
      </Link>
      <div className="mx-auto flex w-full max-w-[1920px] items-stretch justify-center gap-4 px-3 pb-2 pt-0 md:gap-5 md:px-5 lg:px-6">
        <ShortsLeftRail videos={videos} activeIndex={activeIndex} onSelectIndex={scrollToIndex} />
        <div
          ref={containerRef}
          className="min-w-0 flex-1 snap-y snap-mandatory overflow-y-scroll overscroll-y-contain scroll-smooth"
          style={{ height: shortH }}
        >
          {videos.map((v, i) => (
            <ShortsSlide key={v.id} video={v} index={i} activeIndex={activeIndex} cardHeightExpr={cardHeightExpr} />
          ))}
        </div>
        <ShortsRightRail videos={videos} activeIndex={activeIndex} onSelectIndex={scrollToIndex} />
      </div>
    </div>
  );
}
