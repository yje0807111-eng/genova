"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useHoverThumbnail } from "@/components/video/use-hover-thumbnail";
import { useI18n } from "@/components/genova/language-provider";
import { formatViewCountShort } from "@/lib/view-count";
import type { Video } from "@/lib/types";

/**
 * Home grid card with hover-swap: shows the Mux animated.gif preview
 * while the cursor is over it; falls back to the static thumbnail
 * otherwise.  Hover state lives inside the card so re-renders on
 * mouse move don't bubble up to the home-page shell.
 */
export function HoverPreviewCard({
  video,
  hideTag,
}: {
  video: Video;
  /** 공모전 출품작 그리드처럼 컨텍스트상 배지가 군더더기인 곳에서 숨김. */
  hideTag?: boolean;
}) {
  const { t } = useI18n();
  const creatorName =
    video.creatorName?.trim() ||
    video.uploaderDisplayName?.trim() ||
    t("watch.unknownCreator", "Unknown");
  // 시리즈 우선, 아니면 공모전 출품작 표시 (둘 다면 시리즈).
  const tag = hideTag
    ? null
    : video.seriesName
      ? { label: t("series.sectionLabel", "Series"), kind: "series" as const }
      : video.purpose === "competition"
        ? { label: t("profile.submission", "Submission"), kind: "comp" as const }
        : null;
  const { src, onMouseEnter, onMouseLeave } = useHoverThumbnail({
    thumbnailUrl: video.thumbnailUrl,
    muxPlaybackId: video.muxPlaybackId,
  });

  return (
    <Link
      href={`/watch/${video.id}`}
      className="group relative block overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-white/[0.02]">
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic Mux animated.gif swap; next/image fill behind a state-controlled src caused layout shift in earlier tries */}
        <img
          src={src}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-card-overlay)" }}
        />
        {tag ? (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[10.5px] font-semibold text-white/90 backdrop-blur-md ring-1 ring-white/10">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  tag.kind === "series" ? "#9D95F0" : "#F5C451",
                boxShadow: `0 0 6px ${
                  tag.kind === "series" ? "rgba(157,149,240,0.8)" : "rgba(245,196,81,0.8)"
                }`,
              }}
              aria-hidden
            />
            {tag.label}
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="line-clamp-1 text-[13px] font-bold text-white">{video.title}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/55">
            <span className="min-w-0 flex-1 truncate">{creatorName}</span>
            <span className="shrink-0 text-white/20">·</span>
            <span className="shrink-0 tabular-nums">
              {formatViewCountShort(video.viewCount ?? 0)}{" "}
              {t("watch.views", "views")}
            </span>
            <span className="text-white/20">·</span>
            <span className="flex shrink-0 items-center gap-0.5 tabular-nums">
              <Heart size={10} />
              {video.likeCount ?? 0}
            </span>
          </div>
        </div>
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[0.06] transition group-hover:ring-white/15" />
      </div>
    </Link>
  );
}
