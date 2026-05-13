"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Video } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export function ContinueWatching({
  items,
  isLoggedIn,
}: {
  items: { video: Video; progressSeconds: number; durationSeconds: number }[];
  isLoggedIn: boolean;
}) {
  const { t } = useI18n();
  const [history, setHistory] = useState<{ video: Video; progress: number; duration: number }[]>(
    items.map((item) => ({
      video: item.video,
      progress: item.progressSeconds,
      duration: item.durationSeconds,
    })),
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [arrowHovered, setArrowHovered] = useState(false);

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
      .from("video_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("video_id", videoId);

    setHistory((prev) => prev.filter((h) => h.video.id !== videoId));
  };

  if (!isLoggedIn) return null;
  if (history.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#7F77DD]">✦</span>
          <h2 className="text-[22px] font-black tracking-tight text-white">
            {t("films.continueWatching", "Continue Watching")}
          </h2>
          <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7F77DD] to-transparent" />
        </div>
        <p className="text-sm text-white/45">아직 이어볼 영상이 없어요</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" style={{ isolation: "isolate" }}>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#7F77DD]">✦</span>
        <h2 className="text-[22px] font-black tracking-tight text-white">
          {t("films.continueWatching", "Continue Watching")}
        </h2>
        <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7F77DD] to-transparent" />
      </div>
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
            paddingLeft: "6px",
            marginTop: "-20px",
            marginBottom: "-20px",
            paddingRight: "54px",
          }}
          className="hide-scrollbar flex gap-4"
        >
          {history.map(({ video, progress, duration }) => {
            const rawPercent = duration > 0 ? (progress / duration) * 100 : 0;
            const percent = Math.max(0, Math.min(100, Math.round(rawPercent)));
            const remaining = Math.max(0, duration - progress);
            const m = Math.floor(remaining / 60);
            const s = Math.floor(remaining % 60);
            const remainingLabel = `${m}:${String(s).padStart(2, "0")} ${t("films.remaining", "left")}`;
            return (
              <Link
                key={video.id}
                href={"/watch/" + video.id}
                className={cn(
                  "group/card relative shrink-0 overflow-hidden rounded-xl transition-all duration-300 hover:z-[999] hover:shadow-[0_20px_60px_rgba(0,0,0,0.8)] hover:scale-[1.01]",
                  arrowHovered ? "pointer-events-none" : ""
                )}
                style={{ width: "calc((100% - 60px) / 6.9)", transformOrigin: "center center" }}
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a]">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#1a1547] to-[#1a1a1a]" />
                    )}
                    <div className="absolute inset-0 z-[1] bg-black/0 transition-opacity duration-150 group-hover/card:bg-black/40" />
                    <div className="absolute bottom-0 left-0 right-0 z-[3] h-1 bg-white/10">
                      <div
                        className="h-full bg-[#7F77DD]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="absolute inset-0 z-[10] flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover/card:opacity-100">
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
                    {percent > 0 && (
                      <div className="absolute bottom-2 right-2 z-[11] opacity-0 transition-opacity duration-150 group-hover/card:opacity-100">
                        <span className="rounded bg-black/50 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur">
                          {remainingLabel}
                        </span>
                      </div>
                    )}
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void removeFromHistory(video.id);
                      }}
                      className="absolute right-2 top-2 z-[12] flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/50 opacity-0 backdrop-blur-sm transition group-hover/card:opacity-100 hover:bg-red-500/80 hover:text-white"
                      title={t("films.removeFromHistory", "Remove from history")}
                    >
                      <Trash2 size={10} />
                    </button>
                </div>
                <div className="mt-2 px-1">
                  <h3 className="line-clamp-1 text-sm font-semibold text-white">{video.title}</h3>
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
              background: "linear-gradient(to right, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.4) 60%, transparent 100%)"
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
              background: "linear-gradient(to left, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.4) 60%, transparent 100%)"
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
