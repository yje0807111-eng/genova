"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { fetchWatchHistory } from "@/lib/queries/watch-history-queries";
import type { Video } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export function ContinueWatching({ allVideos }: { allVideos: Video[] }) {
  const { t } = useI18n();
  const [history, setHistory] = useState<{ video: Video; progress: number; duration: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [arrowHovered, setArrowHovered] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = getBrowserSupabaseClient();
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const records = await fetchWatchHistory(user.id);
        const matched = records
          .map((r) => {
            const video = allVideos.find((v) => v.id === r.video_id);
            if (!video) return null;
            return { video, progress: r.progress_seconds, duration: r.duration_seconds };
          })
          .filter(Boolean)
          .filter((item) => {
            if (!item) return false;
            const pct = item.duration > 0
              ? (item.progress / item.duration) * 100
              : 0;
            return pct < 98;
          }) as { video: Video; progress: number; duration: number }[];

        setHistory(matched);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [allVideos]);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const firstCard = scrollRef.current.querySelector("a");
    const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 300; // 16 = gap-4
    scrollRef.current.scrollBy({
      left: dir === "right" ? cardWidth * 2 : -cardWidth * 2,
      behavior: "smooth",
    });
  };

  const onScroll = () => {
    if (!scrollRef.current) return;
    setAtStart(scrollRef.current.scrollLeft <= 0);
    setAtEnd(scrollRef.current.scrollLeft + scrollRef.current.offsetWidth >= scrollRef.current.scrollWidth - 4);
  };

  const removeFromHistory = async (videoId: string) => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("watch_history")
      .delete()
      .eq("user_id", user.id)
      .eq("video_id", videoId);

    setHistory((prev) => prev.filter((h) => h.video.id !== videoId));
  };

  if (loading) {
    return (
      <div style={{ minHeight: "180px" }} />
    );
  }
  if (history.length === 0) return null;

  return (
    <div className="space-y-2" style={{ isolation: "isolate" }}>
      <h2 className="text-[16px] font-semibold text-white/70 tracking-tight">
        {t("films.continueWatching", "Continue Watching")}
        <span className="ml-2 inline-block h-[3px] w-6 rounded-full bg-[#7F77DD] align-middle" />
      </h2>
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={scrollRef}
          onScroll={onScroll}
          style={{
            overflowX: "auto",
            overflowY: "visible",
            paddingTop: "20px",
            paddingBottom: "20px",
            marginTop: "-20px",
            marginBottom: "-20px",
            paddingRight: "48px",
          }}
          className="hide-scrollbar flex gap-4"
        >
          {history.map(({ video, progress, duration }) => {
            const percent = duration > 0 ? Math.min(100, Math.round((progress / duration) * 100)) : 0;
            return (
              <Link
                key={video.id}
                href={"/watch/" + video.id}
                className={cn(
                  "gradient-border-card-subtle group/card relative shrink-0 overflow-hidden rounded-xl bg-[#0f0d24] transition-all duration-300 hover:z-[999] hover:shadow-[0_20px_60px_rgba(0,0,0,0.8)] hover:scale-[1.05]",
                  arrowHovered ? "pointer-events-none" : ""
                )}
                style={{ width: "calc((100% - 60px) / 6.9)", transformOrigin: "center center" }}
              >
                <div className="gradient-border-card-inner relative aspect-video w-full overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#1a1547] to-[#0f0d24]" />
                    )}
                    <div className="absolute inset-0 z-[1] bg-black/0 transition-opacity duration-150 group-hover/card:bg-black/40" />
                    {/* Always visible bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 z-[2]"
                      style={{ background: "linear-gradient(to top, rgba(8,6,24,0.95) 0%, rgba(8,6,24,0.5) 50%, transparent 100%)" }}>
                      <div className="px-3 pb-2 pt-1">
                        {percent > 0 && (
                          <div className="mb-1.5 h-[2px] w-full rounded-full bg-white/20">
                            <div
                              className="h-full rounded-full bg-[#7F77DD]"
                              style={{ width: percent + "%" }}
                            />
                          </div>
                        )}
                        <h3 className="typo-filmstrip-title line-clamp-1 text-white">{video.title}</h3>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 z-[10] flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-150">
                      <img
                        src="/genova-play1.png"
                        alt="play"
                        className="h-[43px] w-[43px] object-contain drop-shadow-lg opacity-40"
                      />
                      <svg
                        className="absolute h-[16px] w-[16px]"
                        viewBox="0 0 24 24"
                        fill="white"
                        style={{ marginLeft: "1px" }}
                      >
                        <polygon points="6,3 20,12 6,21" />
                      </svg>
                    </div>
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void removeFromHistory(video.id);
                      }}
                      className="absolute bottom-2 right-2 z-[10] flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/50 opacity-0 backdrop-blur-sm transition group-hover/card:opacity-100 hover:bg-red-500/80 hover:text-white"
                      title={t("films.removeFromHistory", "Remove from history")}
                    >
                      <Trash2 size={10} />
                    </button>
                </div>
              </Link>
            );
          })}
        </div>
        {!atStart && (
          <button
            type="button"
            onClick={() => scroll("left")}
            onMouseEnter={() => setArrowHovered(true)}
            onMouseLeave={() => setArrowHovered(false)}
            className={cn(
              "absolute left-0 top-0 bottom-0 z-[1000]",
              "w-28",
              "flex items-center justify-center",
              "transition-opacity duration-200",
              isHovered ? "opacity-100" : "opacity-0"
            )}
            style={{
              background: "linear-gradient(to right, rgba(8,6,24,0.85) 0%, rgba(8,6,24,0.4) 60%, transparent 100%)"
            }}
          >
            <ChevronLeft
              size={50}
              className="text-white/70 hover:text-white transition-all duration-200"
              strokeWidth={1.5}
            />
          </button>
        )}

        {!atEnd && (
          <button
            type="button"
            onClick={() => scroll("right")}
            onMouseEnter={() => setArrowHovered(true)}
            onMouseLeave={() => setArrowHovered(false)}
            className={cn(
              "absolute right-0 top-0 bottom-0 z-[1000]",
              "w-28",
              "flex items-center justify-center",
              "transition-opacity duration-200",
              isHovered ? "opacity-100" : "opacity-0"
            )}
            style={{
              background: "linear-gradient(to left, rgba(8,6,24,0.85) 0%, rgba(8,6,24,0.4) 60%, transparent 100%)"
            }}
          >
            <ChevronRight
              size={50}
              className="text-white/70 hover:text-white transition-all duration-200"
              strokeWidth={1.5}
            />
          </button>
        )}
      </div>
    </div>
  );
}
