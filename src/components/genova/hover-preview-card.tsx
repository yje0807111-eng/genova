"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { parseRuntimeToSeconds } from "@/components/video/video-card";
import { useHoverThumbnail } from "@/components/video/use-hover-thumbnail";
import type { Video } from "@/lib/types";

function formatRuntimeDisplay(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Home grid card with hover-swap: shows the Mux animated.gif preview
 * while the cursor is over it; falls back to the static thumbnail
 * otherwise.  Hover state lives inside the card so re-renders on
 * mouse move don't bubble up to the home-page shell.
 */
export function HoverPreviewCard({ video }: { video: Video }) {
  const creatorName =
    video.creatorName?.trim() || video.uploaderDisplayName?.trim() || "";
  const runtimeSec = parseRuntimeToSeconds(video.runtime);
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
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="line-clamp-1 text-[13px] font-bold text-white">{video.title}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-white/55">
            {creatorName && <span className="line-clamp-1">{creatorName}</span>}
            {runtimeSec > 0 && (
              <>
                <span>·</span>
                <span>{formatRuntimeDisplay(runtimeSec)}</span>
              </>
            )}
            {typeof video.likeCount === "number" && video.likeCount > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Heart size={10} className="fill-current" />
                  {video.likeCount}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[0.06] transition group-hover:ring-white/15" />
      </div>
    </Link>
  );
}
