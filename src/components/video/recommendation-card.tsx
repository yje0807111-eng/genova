"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import type { Video } from "@/lib/types";

export function RecommendationCard({ item }: { item: Video }) {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);
  const creatorName =
    item.creatorName?.trim() || item.uploaderDisplayName?.trim() || "";
  const tag = item.seriesName
    ? { label: t("series.sectionLabel", "Series"), kind: "series" as const }
    : item.purpose === "competition"
      ? { label: t("profile.submission", "Submission"), kind: "comp" as const }
      : null;

  return (
    <Link
      href={`/watch/${item.id}`}
      className="group relative block overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-white/[0.02]">
        <img
          src={
            isHovered && item.muxPlaybackId
              ? `https://image.mux.com/${item.muxPlaybackId}/animated.gif?width=640&fps=15`
              : item.thumbnailUrl || "/default-banner.png"
          }
          alt={item.title}
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
                background: tag.kind === "series" ? "#9D95F0" : "#F5C451",
                boxShadow: `0 0 6px ${
                  tag.kind === "series"
                    ? "rgba(157,149,240,0.8)"
                    : "rgba(245,196,81,0.8)"
                }`,
              }}
              aria-hidden
            />
            {tag.label}
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="line-clamp-1 text-[13px] font-bold text-white">{item.title}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-white/55">
            {creatorName && <span className="line-clamp-1">{creatorName}</span>}
            {item.runtime && (
              <>
                <span className="text-white/20">·</span>
                <span className="tabular-nums">{item.runtime}</span>
              </>
            )}
            {typeof item.likeCount === "number" && item.likeCount > 0 && (
              <>
                <span className="text-white/20">·</span>
                <span className="inline-flex items-center gap-0.5 tabular-nums">
                  <Heart className="h-3 w-3" />
                  {item.likeCount}
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
