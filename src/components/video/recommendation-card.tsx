"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Video } from "@/lib/types";

export function RecommendationCard({ item }: { item: Video }) {
  const [isHovered, setIsHovered] = useState(false);

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
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="line-clamp-1 text-[13px] font-bold text-white">{item.title}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-white/55">
            {item.creatorName && <span className="line-clamp-1">{item.creatorName}</span>}
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
