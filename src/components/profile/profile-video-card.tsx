"use client";

import Link from "next/link";
import { Heart, Pencil } from "lucide-react";
import { useHoverThumbnail } from "@/components/video/use-hover-thumbnail";

/**
 * Shared profile gallery card.  Used by the Videos/Competition/Saved
 * grid and the Series tab so every card looks/behaves identically
 * (on-hover Mux preview via useHoverThumbnail).
 *
 * `episodeNumber` (Series tab) renders an "EP n" badge top-left,
 * taking the place of the competition badge in that context.
 */
export function ProfileVideoCard({
  video,
  t,
  isOwner,
  onEdit,
  episodeNumber,
}: {
  // Loosely-typed at call sites — accept snake_case (raw row) or
  // camelCase (mapped Video) keys.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  video: any;
  t: (key: string, fallback?: string) => string;
  isOwner?: boolean;
  onEdit?: (videoId: string) => void;
  episodeNumber?: number | null;
}) {
  const { src, onMouseEnter, onMouseLeave } = useHoverThumbnail({
    thumbnailUrl: video.thumbnail_url ?? video.thumbnailUrl,
    muxPlaybackId: video.mux_playback_id ?? video.muxPlaybackId,
  });

  return (
    <Link
      href={`/watch/${video.id}`}
      className="group/card relative block overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-white/[0.02]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={video.title ?? ""}
          className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
        />

        {/* Bottom gradient */}
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-card-overlay)" }}
        />

        {/* Info overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="line-clamp-1 text-[13px] font-bold text-white">
            {video.title}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-white/55">
            {video.runtime && (
              <>
                <span className="tabular-nums">{video.runtime}</span>
                <span className="text-white/20">·</span>
              </>
            )}
            <span className="tabular-nums">
              {(video.view_count ?? video.viewCount ?? 0).toLocaleString()}{" "}
              {t("profile.viewsSuffix", "views")}
            </span>
            {typeof (video.like_count ?? video.likeCount) === "number" &&
              (video.like_count ?? video.likeCount) > 0 && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="inline-flex items-center gap-0.5 tabular-nums">
                    <Heart className="h-3 w-3" />
                    {video.like_count ?? video.likeCount}
                  </span>
                </>
              )}
          </div>
        </div>

        {/* Border ring */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[0.06] transition group-hover/card:ring-white/15" />

        {isOwner && onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(video.id);
            }}
            title={t("profile.editVideo", "영상 편집")}
            className="group/edit absolute right-2.5 top-2.5 z-10 flex h-9 items-center gap-1.5 overflow-hidden rounded-full border border-white/15 px-2.5 text-white/80 opacity-0 backdrop-blur-xl transition-all duration-300 -translate-y-1 group-hover/card:translate-y-0 group-hover/card:opacity-100 hover:border-[#7F77DD]/50 hover:text-white"
            style={{
              background:
                "linear-gradient(135deg, rgba(127,119,221,0.18) 0%, rgba(10,10,10,0.72) 60%)",
              boxShadow:
                "0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            <Pencil className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-semibold opacity-0 transition-all duration-300 group-hover/edit:max-w-[48px] group-hover/edit:opacity-100">
              {t("profile.editShort", "편집")}
            </span>
          </button>
        )}

        {/* Series episode badge — replaces competition badge in
            the Series tab context. */}
        {episodeNumber ? (
          <div className="absolute left-2 top-2">
            <span
              className="inline-flex items-center rounded-md bg-[#534AB7] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white ring-1 ring-white/20"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.55)" }}
            >
              EP {episodeNumber}
            </span>
          </div>
        ) : video.purpose === "competition" ? (
          <div className="absolute left-2 top-2">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
              {video.is_finalist ? "FINALIST" : t("profile.submission", "출품작")}
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
