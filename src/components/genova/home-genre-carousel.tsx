"use client";

import Link from "next/link";
import { Heart, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/genova/language-provider";
import { cn } from "@/lib/utils/cn";

function formatRuntime(seconds: number | null | undefined): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export type VideoCard = {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  creatorName?: string | null;
  likeCount?: number;
  muxPlaybackId?: string | null;
  runtime?: number | null;
};

export type GenreSlide = {
  genreKey: string;
  genreLabel: string;
  videos: VideoCard[];
};

export interface HomeGenreCarouselProps {
  slides: GenreSlide[];
}

const PLACEHOLDER_NOISE =
  "radial-gradient(circle at 25% 20%, rgba(127,119,221,0.07) 0%, transparent 42%), radial-gradient(circle at 80% 70%, rgba(83,74,183,0.08) 0%, transparent 40%), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.14'/%3E%3C/svg%3E\")";

const SLOT_COUNT = 4;

function PlaceholderCard({ label }: { label: string }) {
  return (
    <div
      className="pointer-events-none relative flex aspect-video flex-col items-center justify-center overflow-hidden rounded-xl ring-0"
      style={{ backgroundColor: "#1a1a1a", backgroundImage: PLACEHOLDER_NOISE }}
      role="presentation"
    >
      <span className="pointer-events-none mb-2 text-3xl text-white/25 select-none" aria-hidden>
        ✦
      </span>
      <span className="pointer-events-none px-3 text-center text-[11px] font-semibold uppercase tracking-wider text-white/35">
        {label}
      </span>
    </div>
  );
}

function VideoPosterCard({ video, rank }: { video: VideoCard; rank: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const muxId = video.muxPlaybackId?.trim();
  const displaySrc =
    isHovered && muxId
      ? `https://image.mux.com/${muxId}/animated.gif?width=640&fps=15`
      : video.thumbnailUrl?.trim() || "";

  return (
    <div
      className={cn(
        "group relative flex flex-col transition-all duration-500 ease-out hover:z-[1] hover:-translate-y-1",
        rank === 1 && "scale-[1.02]",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="pointer-events-none absolute -inset-1.5 z-[-1] rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(127,119,221,0.15)" }}
        aria-hidden
      />
      <Link
        href={`/watch/${video.id}`}
        aria-label={
          video.creatorName ? `${video.title} · ${video.creatorName}` : video.title
        }
        className="relative block aspect-video overflow-hidden rounded-xl ring-0 transition-shadow duration-300 group-hover:ring-1 group-hover:ring-white/15"
      >
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={video.title}
            className="absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1a1830] to-[#0a0a0a]" aria-hidden />
        )}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{ background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)" }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute left-3 top-3 z-10 text-[32px] font-black leading-none"
          style={{
            fontFamily: "var(--font-plus-jakarta), sans-serif",
            color: "rgba(255,255,255,0.95)",
            textShadow: "0 2px 8px rgba(0,0,0,0.7), 0 0 16px rgba(127,119,221,0.3)",
          }}
          aria-hidden
        >
          {String(rank).padStart(2, "0")}
        </span>
        <div
          className="pointer-events-none absolute right-2 top-2 z-[11] flex h-9 w-9 items-center justify-center rounded-full bg-white/10 opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100"
          aria-hidden
        >
          <Play className="h-4 w-4 text-white" fill="currentColor" strokeWidth={0} />
        </div>
        <div className="absolute inset-x-0 bottom-0 z-10 p-3">
          <p className="line-clamp-1 text-[13px] font-bold text-white">{video.title}</p>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-[11px] text-white/55">
            {video.creatorName ? <span className="line-clamp-1">{video.creatorName}</span> : null}
            {video.runtime ? (
              <>
                {video.creatorName ? <span className="shrink-0 text-white/30">·</span> : null}
                <span className="shrink-0">{formatRuntime(video.runtime)}</span>
              </>
            ) : null}
            {typeof video.likeCount === "number" ? (
              <>
                {video.creatorName || video.runtime ? <span className="shrink-0 text-white/30">·</span> : null}
                <Heart className="h-3 w-3 shrink-0" aria-hidden />
                <span className="shrink-0">{video.likeCount}</span>
              </>
            ) : null}
          </div>
        </div>
      </Link>
    </div>
  );
}

export function HomeGenreCarousel({ slides }: HomeGenreCarouselProps) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);

  const n = slides.length;
  const slidePct = n > 0 ? 100 / n : 100;

  const go = useCallback(
    (dir: -1 | 1) => {
      if (n <= 0) return;
      setIndex((i) => (i + dir + n) % n);
    },
    [n],
  );

  useEffect(() => {
    if (n <= 1 || hoverPaused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % n);
    }, 5000);
    return () => window.clearInterval(id);
  }, [n, hoverPaused]);

  useEffect(() => {
    if (n <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.("input, textarea, select, [contenteditable='true']")) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n, go]);

  const comingSoon = t("home.genreCarousel.comingSoon", "Coming Soon");

  const paddedSlides = useMemo(
    () =>
      slides.map((s) => {
        const v = s.videos.slice(0, SLOT_COUNT);
        while (v.length < SLOT_COUNT) {
          v.push({ id: `__placeholder_${s.genreKey}_${v.length}`, title: "" });
        }
        return { ...s, videos: v };
      }),
    [slides],
  );

  if (!n) return null;

  return (
    <section
      className="w-full px-6 pb-2 pt-0 sm:px-8 sm:pt-0"
      role="region"
      aria-roledescription="carousel"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
    >
        <div className="relative min-h-0 w-full overflow-x-clip overflow-y-visible">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{
              width: `${n * 100}%`,
              transform: `translateX(-${slidePct * index}%)`,
            }}
          >
            {paddedSlides.map((slide, i) => (
              <div
                key={slide.genreKey}
                className="flex shrink-0 flex-col justify-center px-3 py-4 sm:px-4 sm:py-5"
                style={{ width: `${slidePct}%` }}
                aria-hidden={i !== index}
              >
                <div className="grid w-full grid-cols-2 gap-4 overflow-visible md:grid-cols-4">
                  {slide.videos.map((video, slot) => {
                    const isPlaceholder = video.id.startsWith("__placeholder_");
                    if (isPlaceholder) {
                      return <PlaceholderCard key={`${slide.genreKey}-ph-${slot}`} label={comingSoon} />;
                    }
                    return (
                      <VideoPosterCard key={video.id} video={video} rank={slot + 1} />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {n > 1 ? (
          <div className="mt-2 flex items-center justify-center">
            <div className="flex items-center gap-2" role="tablist" aria-label="Genres">
              {slides.map((slide, i) => {
                const active = i === index;
                return (
                  <button
                    key={slide.genreKey}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className="group relative flex items-center gap-2 px-2 py-0.5 transition"
                    onClick={() => setIndex(i)}
                  >
                    <span
                      className={cn(
                        "shrink-0 rounded-full transition-all duration-300",
                        active
                          ? "h-1.5 w-6 bg-gradient-to-r from-[#AFA9EC] to-[#7F77DD]"
                          : "h-1.5 w-1.5 bg-white/20 group-hover:bg-white/50",
                      )}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-[0.2em] transition-colors",
                        active ? "text-[#AFA9EC]" : "text-white/30 group-hover:text-white/70",
                      )}
                    >
                      {slide.genreLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
    </section>
  );
}
