"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Video } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatViewCountShort } from "@/lib/view-count";

function formatRuntime(runtime: string | null | undefined): string {
  if (!runtime) return "";
  if (runtime.includes(":")) return runtime;
  const match = runtime.match(/(\d+)/);
  if (match) {
    const mins = parseInt(match[1], 10);
    return `${mins}:00`;
  }
  return runtime;
}

function VideoCardStrip({ videos }: { videos: Video[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [arrowHovered, setArrowHovered] = useState(false);

  const videoIdsKey = videos.map((v) => v.id).join(",");

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth;
    scrollRef.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  const onScroll = () => {
    if (!scrollRef.current) return;
    setAtStart(scrollRef.current.scrollLeft <= 0);
    setAtEnd(scrollRef.current.scrollLeft + scrollRef.current.offsetWidth >= scrollRef.current.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = 0;
    setAtStart(true);
    requestAnimationFrame(() => {
      onScroll();
    });
  }, [videoIdsKey]);

  if (videos.length === 0) {
    return <p className="text-xs text-white/70">No recommendations yet.</p>;
  }

  return (
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
          paddingTop: "8px",
          paddingBottom: "8px",
        }}
        className="hide-scrollbar flex gap-4"
      >
        {videos.map((item) => {
          const itemGenre = item.genre
            ? item.genre.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
            : "";
          return (
            <Link
              key={item.id}
              href={"/watch/" + item.id}
              className={cn(
                "group/card relative shrink-0 overflow-hidden rounded-xl bg-[#1a1a1a] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]",
                arrowHovered ? "pointer-events-none" : "",
              )}
              style={{
                width: "calc((100% - 64px) / 5)",
                border: "1px solid rgba(127,119,221,0.15)",
              }}
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#1a1547] to-[#1a1a1a]" />
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.8) 40%, rgba(10,10,10,0.3) 65%, transparent 100%)",
                  }}
                />
                <div className="absolute right-2 top-2 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover/card:opacity-100">
                  <img src="/genova-play1.png" alt="" className="h-[38px] w-[38px] object-contain opacity-40" />
                  <svg className="absolute h-[14px] w-[14px]" viewBox="0 0 24 24" fill="white" style={{ marginLeft: "1px" }}>
                    <polygon points="6,3 20,12 6,21" />
                  </svg>
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-2 pt-10">
                  <h3 className="typo-filmstrip-title line-clamp-1 text-white">{item.title}</h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    {itemGenre ? <span className="typo-card-meta text-[#AFA9EC]/80">{itemGenre}</span> : null}
                    {itemGenre && (item.runtime || item.viewCount) ? (
                      <span className="text-white/20">·</span>
                    ) : null}
                    {item.viewCount ? (
                      <span className="typo-card-meta text-white/50">
                        {formatViewCountShort(item.viewCount)} views
                      </span>
                    ) : null}
                  </div>
                </div>
                {item.runtime ? (
                  <span className="typo-overlay-duration absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 font-bold text-white backdrop-blur-sm">
                    {formatRuntime(item.runtime)}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>

      {!atStart ? (
        <button
          type="button"
          onClick={() => scroll("left")}
          onMouseEnter={() => setArrowHovered(true)}
          onMouseLeave={() => setArrowHovered(false)}
          className={cn(
            "absolute left-0 top-0 z-[100]",
            "h-full w-24",
            "flex items-center justify-center",
            "transition-all duration-200 group/arrow",
            isHovered ? "opacity-100" : "opacity-0",
          )}
          style={{
            background: "var(--gradient-row-fade-l)",
          }}
          aria-label="Scroll left"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-10 w-10 text-white/70 transition-all duration-200 group-hover/arrow:text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      ) : null}

      {!atEnd ? (
        <button
          type="button"
          onClick={() => scroll("right")}
          onMouseEnter={() => setArrowHovered(true)}
          onMouseLeave={() => setArrowHovered(false)}
          className={cn(
            "absolute right-0 top-0 z-[100]",
            "h-full w-24",
            "flex items-center justify-center",
            "transition-all duration-200 group/arrow",
            isHovered ? "opacity-100" : "opacity-0",
          )}
          style={{
            background: "var(--gradient-row-fade-r)",
          }}
          aria-label="Scroll right"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-10 w-10 text-white/70 transition-all duration-200 group-hover/arrow:text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

export function UpNextSection({ videos }: { videos: Video[] }) {
  const [autoplay, setAutoplay] = useState(true);

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-white">Up Next</h2>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-white/50">Autoplay</span>
          <button
            type="button"
            onClick={() => setAutoplay((v) => !v)}
            className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
              autoplay ? "bg-[#534AB7]" : "bg-white/20"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                autoplay ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      <VideoCardStrip videos={videos} />
    </section>
  );
}
