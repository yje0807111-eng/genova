"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { filterVideosByGenre, type GenreFilter } from "@/lib/genova-genre";
import { createGenovaMockVideos } from "@/lib/genova-mock-videos";
import type { Video } from "@/lib/types";
import { VideoCardFromVideo } from "./video-card";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function ForYouGrid({
  filter,
  videos: _videosFromSupabase,
  refreshKey = 0,
}: {
  filter: GenreFilter;
  videos: Video[];
  refreshKey?: number;
}) {
  // TODO: Replace mocks with Supabase-backed data via props when wired up.
  // const videos = _videosFromSupabase;
  const videos = useMemo(() => createGenovaMockVideos(), []);

  const filteredVideos = useMemo(() => {
    const filtered = filterVideosByGenre(videos, filter);
    const seed = hashString(filter);
    return [...filtered].sort((a, b) => {
      const ka = hashString(a.id + String(seed));
      const kb = hashString(b.id + String(seed));
      return ka - kb;
    });
  }, [videos, filter]);
  const [page, setPage] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [dir, setDir] = useState<"left" | "right">("right");
  const [animating, setAnimating] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    setPage(0);
    setNextPage(null);
    setAnimating(false);
  }, [filter]);

  useEffect(() => {
    if (refreshKey === 0) return;
    setShowAnim(true);
    const t = setTimeout(() => setShowAnim(false), 600);
    return () => clearTimeout(t);
  }, [refreshKey]);

  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
  const currentVideos = filteredVideos.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const nextVideos = nextPage !== null
    ? filteredVideos.slice(nextPage * ITEMS_PER_PAGE, (nextPage + 1) * ITEMS_PER_PAGE)
    : [];

  const goToPage = (next: number, direction: "left" | "right") => {
    if (animating) return;
    setDir(direction);
    setNextPage(next);
    setAnimating(true);
    setTimeout(() => {
      setPage(next);
      setNextPage(null);
      setAnimating(false);
    }, 350);
  };

  return (
    <div className="relative">
      <div
        className="relative"
        style={{ overflow: "hidden", contain: "paint" }}
      >
        <div
          style={{
            transform: animating
              ? dir === "right" ? "translateX(-100%)" : "translateX(100%)"
              : "translateX(0)",
            transition: animating ? "transform 0.35s ease-in-out" : "none",
          }}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {currentVideos.map((v, idx) => (
            <div
              key={v.id}
              style={showAnim ? {
                animation: "fadeSlideIn 0.4s ease-out forwards",
                animationDelay: `${idx * 0.05}s`,
                opacity: 0,
              } : {}}
            >
              <VideoCardFromVideo video={v} />
            </div>
          ))}
        </div>
        {animating && nextPage !== null && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              transform: animating ? "translateX(0)" : dir === "right" ? "translateX(100%)" : "translateX(-100%)",
              transition: "transform 0.35s ease-in-out",
              animation: dir === "right"
                ? "slideFromRight 0.35s ease-in-out forwards"
                : "slideFromLeft 0.35s ease-in-out forwards",
            }}
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            {nextVideos.map((v) => (
              <div key={v.id}>
                <VideoCardFromVideo video={v} />
              </div>
            ))}
          </div>
        )}
      </div>
      {page < totalPages - 1 && (
        <button
          type="button"
          onClick={() => goToPage(page + 1, "right")}
          className="absolute -right-10 top-[calc(50%-1.25rem)] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-[#1a1635] text-white/70 shadow-xl shadow-black/40 transition hover:scale-110 hover:border-[#8b5cf6]/60 hover:bg-[#8b5cf6]/20 hover:text-white"
        >
          <ChevronRight size={20} />
        </button>
      )}
      {page > 0 && (
        <button
          type="button"
          onClick={() => goToPage(page - 1, "left")}
          className="absolute -left-10 top-[calc(50%-1.25rem)] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-[#1a1635] text-white/70 shadow-xl shadow-black/40 transition hover:scale-110 hover:border-[#8b5cf6]/60 hover:bg-[#8b5cf6]/20 hover:text-white"
        >
          <ChevronLeft size={20} />
        </button>
      )}
    </div>
  );
}
