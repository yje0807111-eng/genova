"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { formatViewCountShort } from "@/lib/view-count";
import { cn } from "@/lib/utils/cn";
import type { Video } from "@/lib/types";

/**
 * Compact vertical episode list for the watch-page sidebar "회차" tab.
 * Auto-scrolls the current episode into view on mount.
 */
export function SeriesEpisodesList({
  episodes,
  currentVideoId,
}: {
  episodes: Video[];
  currentVideoId: string;
}) {
  const { t } = useI18n();
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, []);

  const sorted = [...episodes].sort(
    (a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0),
  );

  return (
    <div className="space-y-1.5">
      {sorted.map((ep) => {
        const isCurrent = ep.id === currentVideoId;
        return (
          <Link
            key={ep.id}
            ref={isCurrent ? activeRef : undefined}
            href={`/watch/${ep.id}`}
            aria-current={isCurrent ? "true" : undefined}
            className={cn(
              "group flex gap-3 rounded-xl p-2 transition",
              isCurrent
                ? "ring-1 ring-[#7F77DD]/30"
                : "hover:bg-white/[0.04]",
            )}
            style={
              isCurrent
                ? {
                    background:
                      "linear-gradient(135deg, #211b3a 0%, #14111d 70%)",
                  }
                : undefined
            }
          >
            <div className="relative aspect-video w-[116px] shrink-0 overflow-hidden rounded-lg bg-black/40">
              <Image
                src={
                  ep.thumbnailUrl ||
                  `https://picsum.photos/seed/${ep.id}/400/225`
                }
                alt=""
                fill
                sizes="116px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute left-1.5 top-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-white/90 backdrop-blur-sm">
                {t("series.episodeShort", "EP.{n}").replace(
                  "{n}",
                  String(ep.episodeNumber ?? 0),
                )}
              </span>
              {ep.runtime ? (
                <span className="absolute bottom-1 right-1 rounded bg-black/65 px-1 py-px text-[9px] font-bold tabular-nums text-white/85 backdrop-blur-sm">
                  {ep.runtime}
                </span>
              ) : null}
              {!isCurrent ? (
                <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 ring-1 ring-white/25 backdrop-blur-sm">
                    <Play className="h-3 w-3 fill-white text-white" />
                  </span>
                </span>
              ) : null}
            </div>

            <div className="min-w-0 flex-1 py-0.5">
              {isCurrent ? (
                <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-semibold text-white/90 ring-1 ring-white/10">
                  <span
                    className="h-1 w-1 animate-pulse rounded-full"
                    style={{
                      background: "#9D95F0",
                      boxShadow: "0 0 6px rgba(157,149,240,0.85)",
                    }}
                    aria-hidden
                  />
                  {t("series.nowPlaying", "Now Playing")}
                </span>
              ) : null}
              <p
                className={cn(
                  "line-clamp-2 text-[12.5px] font-bold leading-snug",
                  isCurrent ? "text-white" : "text-white/85",
                )}
              >
                {ep.title}
              </p>
              <p className="mt-0.5 text-[10.5px] tabular-nums text-white/40">
                {formatViewCountShort(ep.viewCount ?? 0)}{" "}
                {t("feed.views", "views")}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
