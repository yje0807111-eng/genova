"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Plus, RefreshCw } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Competition } from "@/lib/types";
import type { Video } from "@/lib/types";
import { createGenovaMockVideos } from "@/lib/genova-mock-videos";
import { useI18n } from "@/components/genova/language-provider";
import { useGenreFilter } from "@/components/genova/genre-filter-context";
import { UploadCTA } from "./upload-cta";
import { AnimateIn } from "@/components/animate-in";
import { VideoCardFromVideo } from "@/components/genova/video-card";
import { cn } from "@/lib/utils/cn";
import { mainGenreLabel, normalizeToMainGenre } from "@/lib/constants/genres";
import type { GenreFilter } from "@/lib/genova-genre";

function UnifiedGrid({ videos }: { videos: Video[] }) {
  const { t } = useI18n();
  if (videos.length === 0) {
    return <p className="text-sm text-white/30">{t("home.noVideosYet", "No videos yet.")}</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {videos.map((video) => (
        <VideoCardFromVideo key={video.id} video={video} />
      ))}
    </div>
  );
}

function HeroBanner({ videos }: { videos: Video[] }) {
  const { t, locale } = useI18n();
  const [current, setCurrent] = useState(0);
  const [fadeVisible, setFadeVisible] = useState(true);
  const heroVideos = videos.slice(0, 5);
  const video = heroVideos[current];

  useEffect(() => {
    if (heroVideos.length <= 1) return;
    const timer = setInterval(() => {
      setFadeVisible(false);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % heroVideos.length);
        setFadeVisible(true);
      }, 400);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroVideos.length]);

  if (!video) return null;

  const HERO_FALLBACKS = [
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1400&q=80",
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1400&q=80",
    "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1400&q=80",
  ];
  const heroImage = video.thumbnailUrl || HERO_FALLBACKS[current % HERO_FALLBACKS.length];
  const creator =
    video.creatorName?.trim() ||
    video.uploaderDisplayName?.trim() ||
    t("video.creatorFallback", "Creator");
  const genre = video.genre ? mainGenreLabel(video.genre, locale) : "";

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/6" }}>
      <img
        src={heroImage}
        alt=""
        className="h-full w-full object-cover"
        style={{
          opacity: fadeVisible ? 1 : 0,
          transition: "opacity 0.4s ease-in-out",
        }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(8,6,24,0.98) 0%, rgba(8,6,24,0.85) 35%, rgba(8,6,24,0.3) 60%, rgba(8,6,24,0) 80%)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(13,11,26,0.5) 0%, transparent 20%)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,11,26,1) 0%, rgba(13,11,26,0.6) 30%, transparent 60%)" }} />

      <div
        className="absolute inset-0 flex items-end"
        style={{
          opacity: fadeVisible ? 1 : 0,
          transition: "opacity 0.4s ease-in-out",
        }}
      >
        <div className="max-w-3xl pb-16" style={{ paddingLeft: "calc(240px - 8rem)" }}>
          <div className="mb-3 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#7F77DD]" />
            <p className="text-[16px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">{t("home.heroFeatured", "Featured")}</p>
          </div>
          <h2 className="line-clamp-2 text-5xl font-black leading-tight text-white md:text-6xl">{video.title}</h2>
          <div className="mt-2 flex items-center gap-2 text-base">
            {genre && <span className="font-semibold text-[#AFA9EC]">{genre}</span>}
            <span className="text-white/30">·</span>
            <span className="text-white/40">{creator}</span>
          </div>
          <p className="mt-3 max-w-md line-clamp-2 text-[18px] leading-relaxed text-white/50">
            {video.description?.trim() ||
              t("home.heroDescFallback", "An AI-generated film pushing the boundaries of creativity and visual storytelling.")}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href={"/watch/" + video.id}
              className="flex items-center gap-2 rounded-lg bg-[#534AB7] px-12 py-3 text-[15px] font-bold text-white transition hover:bg-[#6B5FD4]"
              style={{ boxShadow: "0 4px 16px rgba(83,74,183,0.5)" }}
            >
              <Play size={16} fill="white" /> {t("films.play", "Play")}
            </a>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <Plus size={20} />
            </button>
          </div>
          <div
            className="mt-6 flex w-fit items-stretch gap-0"
            style={{ background: "transparent", backdropFilter: "none" }}
          >
            {video.award && (
              <div className="flex items-center gap-3 border-r border-white/10 px-5 py-3">
                <svg className="h-6 w-6 shrink-0 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 21h8M12 17v4M17 3H7l-2 7c0 2.8 2.24 5 5 5s5-2.2 5-5l-2-7z"/>
                  <path d="M5 10H3a2 2 0 000 4h2M19 10h2a2 2 0 010 4h-2"/>
                </svg>
                <div>
                  <p className="mb-0.5 text-[13px] leading-none text-white/40">{t("home.heroAwardLabel", "Award")}</p>
                  <p className="text-[15px] font-semibold leading-none text-white">{video.award}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 border-r border-white/10 px-5 py-3">
              <svg className="h-6 w-6 shrink-0 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <div>
                <p className="mb-0.5 text-[13px] leading-none text-white/40">{t("home.heroRating", "Rating")}</p>
                <p className="text-[15px] font-semibold leading-none text-white">
                  {video.viewCount && video.viewCount > 10000 ? "9.2" : "8.7"} {t("home.heroTopRating", "Top Rating")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-3">
              <svg className="h-6 w-6 shrink-0 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2c0 6-8 10-8 14a8 8 0 0016 0c0-4-8-8-8-14z"/>
              </svg>
              <div>
                <p className="mb-0.5 text-[13px] leading-none text-white/40">{t("home.heroTrending", "Trending")}</p>
                <p className="text-[15px] font-semibold leading-none text-white">
                  {video.viewCount && video.viewCount > 50000
                    ? t("home.heroHashOneWeek", "#1 This Week")
                    : video.viewCount && video.viewCount > 10000
                      ? t("home.heroTopWeek", "Top This Week")
                      : t("home.heroRising", "Rising")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {heroVideos.length > 1 && (
        <div className="absolute bottom-6 right-8 z-10 flex items-center gap-2">
          {heroVideos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setFadeVisible(false);
                setTimeout(() => {
                  setCurrent(i);
                  setFadeVisible(true);
                }, 400);
              }}
              className={cn(
                "rounded-full transition-all duration-300 border",
                i === current
                  ? "h-3 w-3 bg-[#7F77DD] border-[#7F77DD]"
                  : "h-2.5 w-2.5 bg-transparent border-white/40 hover:border-white"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RefreshButton({ onClick }: { onClick: () => void }) {
  const [spinning, setSpinning] = useState(false);
  const handleClick = () => {
    setSpinning(true);
    onClick();
    setTimeout(() => setSpinning(false), 600);
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
    >
      <RefreshCw
        className={cn("h-3.5 w-3.5 transition-transform duration-500", spinning ? "rotate-180" : "")}
      />
    </button>
  );
}

function GenreTop10Row({ videos, genre }: { videos: Video[]; genre: string }) {
  const { t, locale } = useI18n();
  const [isHovered, setIsHovered] = useState(false);
  const [page, setPage] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [dir, setDir] = useState<"left" | "right">("right");
  const [animating, setAnimating] = useState(false);
  const ITEMS_PER_PAGE = 8;

  const top10 = useMemo(() => {
    const filtered = videos.filter((v) => normalizeToMainGenre(v.genre) === genre);
    const sorted = [...filtered].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));

    // Pad with mock rows when DB returns fewer videos
    if (sorted.length < 8) {
      const mockVideos = createGenovaMockVideos();
      const mockFiltered = mockVideos
        .filter((v) => normalizeToMainGenre(v.genre) === genre)
        .filter((v) => !sorted.find((s) => s.id === v.id));
      return [...sorted, ...mockFiltered].slice(0, 16);
    }
    return sorted;
  }, [videos, genre]);

  useEffect(() => {
    setPage(0);
    setNextPage(null);
    setAnimating(false);
  }, [genre]);

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

  const totalPages = Math.ceil(top10.length / ITEMS_PER_PAGE);
  const currentVideos = top10.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const nextVideos = nextPage !== null
    ? top10.slice(nextPage * ITEMS_PER_PAGE, (nextPage + 1) * ITEMS_PER_PAGE)
    : [];

  if (top10.length === 0) return null;

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-[20px] font-bold text-white tracking-tight">
          {t("home.top16Lead", "Top 16")}{" "}
          <span className="text-[#8b5cf6]">{mainGenreLabel(genre, locale)}</span>
        </h2>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Grid slide area */}
        <div className="relative" style={{ overflow: "hidden", contain: "paint" }}>
          <div
            style={{
              transform: animating
                ? dir === "right" ? "translateX(-100%)" : "translateX(100%)"
                : "translateX(0)",
              transition: animating ? "transform 0.35s ease-in-out" : "none",
            }}
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            {currentVideos.map((video, idx) => (
              <div key={video.id} className="relative">
              <div
                className="absolute right-3 top-3 z-20 rounded-lg px-2 py-1 text-4xl font-black leading-none text-white"
                style={{
                  textShadow: "0 2px 12px rgba(0,0,0,0.9)",
                  fontVariantNumeric: "tabular-nums",
                  background: "rgba(0,0,0,0.35)",
                  backdropFilter: "blur(4px)",
                }}
              >
                {String(page * ITEMS_PER_PAGE + idx + 1).padStart(2, "0")}
                </div>
                <VideoCardFromVideo video={video} />
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
                animation: dir === "right"
                  ? "slideFromRight 0.35s ease-in-out forwards"
                  : "slideFromLeft 0.35s ease-in-out forwards",
              }}
              className="grid grid-cols-2 gap-4 lg:grid-cols-4"
            >
              {nextVideos.map((video, idx) => (
                <div key={video.id} className="relative">
                <div
                  className="absolute right-3 top-3 z-20 rounded-lg px-2 py-1 text-4xl font-black leading-none text-white"
                  style={{
                    textShadow: "0 2px 12px rgba(0,0,0,0.9)",
                    fontVariantNumeric: "tabular-nums",
                    background: "rgba(0,0,0,0.35)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {String((nextPage ?? 0) * ITEMS_PER_PAGE + idx + 1).padStart(2, "0")}
                  </div>
                  <VideoCardFromVideo video={video} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Left arrow */}
        {page > 0 && (
          <button
            type="button"
            onClick={() => goToPage(page - 1, "left")}
            disabled={animating}
            className={cn(
              "absolute -left-10 top-0 z-[100] h-full w-10",
              "flex items-center justify-center",
              "transition-opacity duration-200",
              "text-white/70 hover:text-white",
              isHovered ? "opacity-100" : "opacity-0",
              "disabled:cursor-not-allowed disabled:opacity-30",
            )}
            style={{ background: "none" }}
          >
            <ChevronLeft size={28} strokeWidth={1.5} />
          </button>
        )}

        {/* Right arrow */}
        {page < totalPages - 1 && (
          <button
            type="button"
            onClick={() => goToPage(page + 1, "right")}
            disabled={animating}
            className={cn(
              "absolute -right-10 top-0 z-[100] h-full w-10",
              "flex items-center justify-center",
              "transition-opacity duration-200",
              "text-white/70 hover:text-white",
              isHovered ? "opacity-100" : "opacity-0",
              "disabled:cursor-not-allowed disabled:opacity-30",
            )}
            style={{ background: "none" }}
          >
            <ChevronRight size={28} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </section>
  );
}

function PaginatedGrid({
  children,
  itemsPerPage = 8,
  totalItems,
}: {
  children: (page: number) => React.ReactNode;
  itemsPerPage?: number;
  totalItems: number;
}) {
  const [page, setPage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir] = useState<"left" | "right">("right");
  const [displayPage, setDisplayPage] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const goToPage = (next: number, direction: "left" | "right") => {
    if (animating) return;
    setDir(direction);
    setNextPage(next);
    setAnimating(true);
    setTimeout(() => {
      setPage(next);
      setDisplayPage(next);
      setNextPage(null);
      setAnimating(false);
    }, 350);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden" aria-label={totalPages > 1 ? `Page ${displayPage + 1} of ${totalPages}` : undefined}>
        <div
          style={{
            transform: animating ? (dir === "right" ? "translateX(-100%)" : "translateX(100%)") : "translateX(0)",
            transition: animating ? "transform 0.35s ease-in-out" : "none",
          }}
        >
          {children(page)}
        </div>

        {animating && nextPage !== null ? (
          <div
            className="absolute left-0 right-0 top-0 z-10"
            style={{
              animation:
                dir === "right" ? "slideFromRight 0.35s ease-in-out forwards" : "slideFromLeft 0.35s ease-in-out forwards",
            }}
          >
            {children(nextPage)}
          </div>
        ) : null}
      </div>

      {page > 0 && (
        <button
          type="button"
          onClick={() => goToPage(page - 1, "left")}
          disabled={animating}
          className={cn(
            "absolute -left-10 top-0 z-[100] h-full w-10",
            "flex items-center justify-center",
            "transition-opacity duration-200 group/arrow",
            isHovered ? "opacity-100" : "opacity-0",
          )}
          style={{
            background: "none",
          }}
        >
          <ChevronLeft
            size={28}
            className="text-white/70 transition-all duration-200 group-hover/arrow:text-white"
            strokeWidth={1.5}
          />
        </button>
      )}

      {page < totalPages - 1 && (
        <button
          type="button"
          onClick={() => goToPage(page + 1, "right")}
          disabled={animating}
          className={cn(
            "absolute -right-10 top-0 z-[100] h-full w-10",
            "flex items-center justify-center",
            "transition-opacity duration-200 group/arrow",
            isHovered ? "opacity-100" : "opacity-0",
          )}
          style={{
            background: "none",
          }}
        >
          <ChevronRight
            size={28}
            className="text-white/70 transition-all duration-200 group-hover/arrow:text-white"
            strokeWidth={1.5}
          />
        </button>
      )}
    </div>
  );
}

type CompetitionWithThumb = Competition & { thumbnailUrl?: string | null };

function CompetitionBanner({ competition }: { competition: Competition | null }) {
  const { locale } = useI18n();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!competition?.deadline) return;
    const diff = new Date(competition.deadline).getTime() - Date.now();
    setDaysLeft(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
  }, [competition?.deadline]);

  const title = (() => {
    if (!competition) return "Genova AI Film Competition";
    if (locale === "ko") return competition.titleKo ?? competition.title ?? "Genova AI Film Competition";
    if (locale === "ja") return competition.titleJa ?? competition.title ?? "Genova AI Film Competition";
    return competition.titleEn ?? competition.title ?? "Genova AI Film Competition";
  })();

  const prize = (() => {
    if (!competition) return "$3,000 in prizes";
    if (locale === "ko") return competition.prizeInfoKo ?? competition.prizeInfo ?? "$3,000 in prizes";
    if (locale === "ja") return competition.prizeInfoJa ?? competition.prizeInfo ?? "$3,000 in prizes";
    return competition.prizeInfoEn ?? competition.prizeInfo ?? "$3,000 in prizes";
  })();

  const genreMap: Record<string, string> = {
    "전체": "All Genres",
    "단편영화": "Short Film",
    "뮤직비디오": "Music Video",
    "애니메이션": "Animation",
    "다큐멘터리": "Documentary",
    "공포": "Horror",
    "SF": "Sci-Fi",
    "액션": "Action",
    "드라마": "Drama",
    "short_film": "Short Film",
    "mv": "Music Video",
    "animation": "Animation",
    "documentary": "Documentary",
    "horror": "Horror",
    "sci_fi": "Sci-Fi",
    "action": "Action",
    "drama": "Drama",
  };

  const genre = (() => {
    if (!competition?.genre) return "All Genres";
    if (locale === "ko") return competition.genre;
    if (locale === "ja") {
      const jaMap: Record<string, string> = {
        "전체": "全ジャンル",
        "단편영화": "短編映画",
        "뮤직비디오": "ミュージックビデオ",
        "애니메이션": "アニメーション",
        "공포": "ホラー",
      };
      return jaMap[competition.genre] ?? genreMap[competition.genre] ?? competition.genre;
    }
    return genreMap[competition.genre] ?? competition.genre;
  })();

  const statusMap: Record<string, string> = {
    "Open": "Now Open",
    "접수중": "Now Open",
    "In Review": "In Review",
    "결선 진행중": "Finals",
    "Voting": "Voting",
    "Closed": "Closed",
  };
  const status = statusMap[competition?.status ?? ""] ?? competition?.status ?? "Now Open";
  const thumbnailUrl = (competition as CompetitionWithThumb | null)?.thumbnailUrl ?? null;

  const bgImage = thumbnailUrl ?? "/competition-banner-bg.png";

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-white/[0.06]"
      style={{ minHeight: "88px" }}
    >
      <style>{`
  @keyframes shimmer {
    0% { transform: translateX(-100%) skewX(-15deg); }
    100% { transform: translateX(300%) skewX(-15deg); }
  }
  @keyframes pulseGlow {
    0% { opacity: 0.4; }
    50% { opacity: 0.7; }
    100% { opacity: 0.4; }
  }
  @keyframes floatParticleComp {
    0% { transform: translateY(0px) translateX(0px); opacity: 0; }
    20% { opacity: 1; }
    80% { opacity: 1; }
    100% { transform: translateY(-40px) translateX(20px); opacity: 0; }
  }
`}</style>
      {/* 배경 이미지 */}
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: "brightness(0.3) blur(2px)", transform: "scale(1.05)" }}
      />

      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ zIndex: 1 }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "40%",
            height: "100%",
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
            animation: "shimmer 4s ease-in-out infinite",
          }}
        />
      </div>

      {/* 그라데이션 오버레이 */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, rgba(83,74,183,0.25) 0%, rgba(8,6,24,0.6) 50%, rgba(8,6,24,0.85) 100%)",
        }}
      />

      {/* 퍼플 글로우 */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: "-5%",
          top: "50%",
          transform: "translateY(-50%)",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(83,74,183,0.4) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "pulseGlow 3s ease-in-out infinite",
        }}
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 1 }}>
        {[
          { left: "20%", top: "30%", size: 3, delay: 0, duration: 3 },
          { left: "50%", top: "60%", size: 2, delay: 1, duration: 4 },
          { left: "75%", top: "25%", size: 2.5, delay: 2, duration: 3.5 },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#FFD700]"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `floatParticleComp ${p.duration}s ${p.delay}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* 콘텐츠 */}
      <div className="relative z-10 flex items-center justify-between gap-6 px-8 py-5">
        {/* 왼쪽 */}
        <div className="flex items-center gap-5">
          {/* NOW OPEN 뱃지 */}
          <div className="shrink-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest"
              style={{
                background: "linear-gradient(135deg, rgba(83,74,183,0.6) 0%, rgba(107,95,212,0.5) 100%)",
                border: "1px solid rgba(127,119,221,0.7)",
                color: "#ffffff",
                boxShadow: "0 0 12px rgba(83,74,183,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              <span
                className="h-2 w-2 rounded-full bg-[#AFA9EC]"
                style={{ animation: "pulseGlow 1.5s ease-in-out infinite", boxShadow: "0 0 6px #7F77DD" }}
              />
              {status}
            </span>
          </div>

          <div className="border-l border-white/10 pl-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
              {genre}
            </p>
            <h3 className="mt-0.5 text-lg font-black text-white">{title}</h3>
          </div>
        </div>

        {/* 가운데 — 상금 + 마감 */}
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-[11px] text-white/40 uppercase tracking-widest">Prize</p>
            <p className="text-xl font-black text-white">{prize}</p>
          </div>
          {daysLeft !== null && (
            <div className="text-center">
              <p className="text-[11px] text-white/40 uppercase tracking-widest">Deadline</p>
              <p className="text-xl font-black text-white">
                D-{daysLeft}
              </p>
            </div>
          )}
        </div>

        {/* 오른쪽 CTA */}
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/competition"
            className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
          >
            Learn More
          </Link>
          <Link
            href={competition?.id ? `/competition/${competition.id}` : "/competition"}
            className="rounded-lg px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #534AB7 0%, #6B5FD4 100%)",
              boxShadow: "0 4px 16px rgba(83,74,183,0.5)",
            }}
          >
            Submit Now →
          </Link>
        </div>
      </div>
    </div>
  );
}

type SpotlightCreator = {
  uploadedBy: string;
  displayName: string;
  avatarUrl: string | null;
  videoCount: number;
  totalLikes: number;
  recentVideos: { id: string; title: string; thumbnailUrl: string | null }[];
};

type HomePageClientProps = {
  useMockFallback: boolean;
  videosFromDb: Video[];
  /** Supabase competition deadline (ISO); null uses banner fallback timer */
  competitionDeadlineIso: string | null;
  competition: Competition | null;
  originals: Video[];
  spotlightCreators: SpotlightCreator[];
  followingVideos: Video[];
  becauseYouWatched: Video[];
  isLoggedIn: boolean;
};

export function HomePageClient(props: HomePageClientProps) {
  const {
    useMockFallback,
    videosFromDb,
    competitionDeadlineIso,
    competition,
    originals,
    spotlightCreators,
    followingVideos,
    becauseYouWatched,
    isLoggedIn,
  } = props;
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { selectedGenre, setSelectedGenre } = useGenreFilter();
  const [selectedMood, setSelectedMood] = useState<string>("all");
  const moodBarRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  const videos = useMemo(() => {
    if (useMockFallback) return createGenovaMockVideos();
    return videosFromDb;
  }, [useMockFallback, videosFromDb]);
  const newestVideos = useMemo(
    () => [...videos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [videos]
  );
  const isAllSelected = selectedMood === "all";

  useEffect(() => {
    void pathname;
    return () => {
      // Leaving home: reset genre filter
      setSelectedGenre("All");
    };
  }, []);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (selectedGenre === "All") {
      setSelectedMood("all");
      return;
    }
    setSelectedMood(selectedGenre as string);
    setTimeout(() => {
      if (moodBarRef.current) {
        const top = moodBarRef.current.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, 50);
  }, [selectedGenre]);

  useEffect(() => {
    const genre = searchParams.get("genre");
    if (genre) {
      setSelectedMood(genre);
      setSelectedGenre(genre as GenreFilter);
      // Strip genre from URL to avoid stale history
      window.history.replaceState({}, "", "/");
      // Scroll to genre section
      setTimeout(() => {
        if (moodBarRef.current) {
          const top = moodBarRef.current.getBoundingClientRect().top + window.scrollY - 72;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 100);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero — full width */}
      <AnimateIn delay={0.05}>
        <HeroBanner videos={videos} />
      </AnimateIn>

      <div className="pt-1">
        <div className="mx-auto max-w-[1500px] px-8">
          <AnimateIn delay={0.07}>
            <CompetitionBanner competition={competition} />
          </AnimateIn>
        </div>
      </div>

      {/* Main content */}
      <div className="px-8 pb-12 pt-2">
        <div className="max-w-[1500px] mx-auto space-y-8">
          <AnimateIn delay={0.08}>
            <div id="home-genre-section" ref={moodBarRef} className="space-y-3 scroll-mt-20">
              <h2 className="text-[20px] font-bold text-white tracking-tight">
                {t("home.browseByGenre", "Browse by Genre")}
                <span className="ml-2 inline-block h-[3px] w-6 rounded-full bg-[#7F77DD] align-middle" />
              </h2>
              <div className="grid grid-cols-2 gap-3 px-2 py-3 md:grid-cols-3 xl:grid-cols-6">
                {[
                  { key: "all", labelKey: "common.all", labelFb: "All", emoji: "✦", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80" },
                  { key: "film", labelKey: "genre.bucketFilm", labelFb: "Film", emoji: "🎬", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80" },
                  { key: "animation", labelKey: "genre.animation", labelFb: "Animation", emoji: "✨", image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80" },
                  { key: "music", labelKey: "genre.bucketMusic", labelFb: "Music", emoji: "🎵", image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80" },
                  { key: "daily", labelKey: "genre.bucketDaily", labelFb: "Daily", emoji: "🌿", image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80" },
                  { key: "art", labelKey: "genre.bucketArt", labelFb: "Art", emoji: "🎨", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80" },
                ].map((mood) => (
                  <button
                    key={mood.key}
                    type="button"
                    onClick={() => {
                      setSelectedGenre(mood.key === "all" ? "All" : mood.key as GenreFilter);
                      setSelectedMood(mood.key);
                      setTimeout(() => {
                        if (moodBarRef.current) {
                          const top = moodBarRef.current.getBoundingClientRect().top + window.scrollY - 72;
                          window.scrollTo({ top, behavior: "smooth" });
                        }
                      }, 50);
                    }}
                    className={cn(
                      "group relative h-[100px] w-full overflow-hidden rounded-2xl border text-left transition-all duration-300",
                      selectedMood === mood.key
                        ? "border-[#7F77DD]/80 ring-1 ring-[#7F77DD]/60 shadow-lg shadow-[#534AB7]/30 scale-[1.02]"
                        : "border-white/10 hover:border-white/25 hover:scale-[1.01]"
                    )}
                  >
                    <img src={mood.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div
                      className="absolute inset-0 rounded-[inherit] pointer-events-none"
                      style={{ background: "rgba(8,6,24,0.45)" }}
                    />
                    <div
                      className="absolute inset-0 rounded-[inherit] pointer-events-none"
                      style={{
                        background: "radial-gradient(ellipse at 0% 0%, rgba(8,6,24,0.85) 0%, transparent 60%)",
                      }}
                    />
                    <div
                      className="absolute inset-0 rounded-[inherit] pointer-events-none"
                      style={{
                        background: "linear-gradient(to top, rgba(8,6,24,0.7) 0%, transparent 50%)",
                      }}
                    />

                    <div className="relative z-10 flex h-full flex-col justify-between p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{mood.emoji}</span>
                        <span className="text-sm font-bold text-white">{t(mood.labelKey, mood.labelFb)}</span>
                      </div>
                      <span className="text-[11px] text-white/65">
                        {(mood.key === "all"
                          ? videos.length
                          : videos.filter((v) => normalizeToMainGenre(v.genre) === mood.key).length)}{" "}
                        {t("home.titlesCount", "titles")}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </AnimateIn>

          {isAllSelected ? (
            <>
              {/* Featured Films — 오리지널/수상작 가로 스크롤 */}
              {originals.length > 0 && (
                <AnimateIn delay={0.1}>
                  <section>
                    <div className="mb-4 flex items-center gap-3">
                      <h2 className="text-[20px] font-bold text-white tracking-tight">
                        Featured Films
                        <span className="ml-2 inline-block h-[3px] w-6 rounded-full bg-[#7F77DD] align-middle" />
                      </h2>
                      <span className="text-xs font-semibold uppercase tracking-widest text-[#7F77DD]/60 border border-[#7F77DD]/20 rounded-full px-3 py-1">
                        Originals
                      </span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                      {originals.slice(0, 10).map((video) => (
                        <div key={video.id} className="shrink-0" style={{ width: "280px" }}>
                          <VideoCardFromVideo video={video} />
                        </div>
                      ))}
                    </div>
                  </section>
                </AnimateIn>
              )}

              <div className="border-t border-white/[0.04]" />

              {/* New Arrivals */}
              <AnimateIn delay={0.15}>
                <section>
                  <div className="mb-4">
                    <h2 className="text-[20px] font-bold text-white tracking-tight">
                      New Arrivals
                      <span className="ml-2 inline-block h-[3px] w-6 rounded-full bg-[#7F77DD] align-middle" />
                    </h2>
                  </div>
                  <PaginatedGrid totalItems={newestVideos.length}>
                    {(page) => <UnifiedGrid videos={newestVideos.slice(page * 8, (page + 1) * 8)} />}
                  </PaginatedGrid>
                </section>
              </AnimateIn>

              <div className="border-t border-white/[0.04]" />

              {/* Trending Now */}
              <AnimateIn delay={0.2}>
                <section>
                  <div className="mb-4">
                    <h2 className="text-[20px] font-bold text-white tracking-tight">
                      Trending Now
                      <span className="ml-2 inline-block h-[3px] w-6 rounded-full bg-[#7F77DD] align-middle" />
                    </h2>
                  </div>
                  <PaginatedGrid totalItems={videos.length}>
                    {(page) => (
                      <UnifiedGrid
                        videos={[...videos]
                          .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
                          .slice(page * 8, (page + 1) * 8)}
                      />
                    )}
                  </PaginatedGrid>
                </section>
              </AnimateIn>

              <div className="border-t border-white/[0.04]" />

              <AnimateIn delay={0.22}>
                <section>
                  <div className="mb-4">
                    <h2 className="text-[20px] font-bold text-white tracking-tight">
                      Creator Spotlight
                      <span className="ml-2 inline-block h-[3px] w-6 rounded-full bg-[#7F77DD] align-middle" />
                    </h2>
                  </div>
                  <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                    {(spotlightCreators.length > 0
                      ? spotlightCreators
                      : Array.from({ length: 5 }, (_, i) => ({
                          uploadedBy: `mock-${i}`,
                          displayName: ["Luna Kim", "Alex Chen", "Seo Yoon", "Minwoo Lee", "Ryan Ko"][i],
                          avatarUrl: `https://i.pravatar.cc/80?img=${i + 1}`,
                          videoCount: [8, 6, 5, 4, 3][i],
                          totalLikes: [124, 98, 76, 54, 32][i],
                          recentVideos: Array.from({ length: 3 }, (_, j) => ({
                            id: `mock-${i}-${j}`,
                            title: "Recent Film",
                            thumbnailUrl: `https://picsum.photos/seed/${i * 10 + j}/280/158`,
                          })),
                        }))
                    ).map((creator) => (
                      <Link
                        key={creator.uploadedBy}
                        href={`/profile/${creator.uploadedBy}`}
                        className="group shrink-0 w-[240px] rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-[#7F77DD]/30 hover:bg-white/[0.04]"
                      >
                        {/* 아바타 + 이름 */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#26215C]">
                            {creator.avatarUrl ? (
                              <img src={creator.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white/60">
                                {creator.displayName.slice(0, 1)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-white group-hover:text-[#AFA9EC] transition-colors">
                              {creator.displayName}
                            </p>
                            <p className="text-[11px] text-white/40">
                              {creator.videoCount} films · {creator.totalLikes} likes
                            </p>
                          </div>
                        </div>

                        {/* 최근 영상 썸네일 3개 */}
                        <div className="grid grid-cols-3 gap-1.5">
                          {creator.recentVideos.slice(0, 3).map((v) => (
                            <div
                              key={v.id}
                              className="aspect-video overflow-hidden rounded-md bg-[#1a1547]"
                            >
                              {v.thumbnailUrl && (
                                <img
                                  src={v.thumbnailUrl}
                                  alt=""
                                  className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              </AnimateIn>

              <div className="border-t border-white/[0.04]" />

              <AnimateIn delay={0.25}>
                <UploadCTA />
              </AnimateIn>
            </>
          ) : (
            <>
              {/* Top 16 — 장르별 */}
              <AnimateIn delay={0.1}>
                <GenreTop10Row videos={videos} genre={selectedMood} />
              </AnimateIn>

              <div className="border-t border-white/[0.04]" />

              <AnimateIn delay={0.13}>
                <section>
                  <div className="mb-4">
                    <h2 className="text-[20px] font-bold text-white tracking-tight">
                      {isLoggedIn && followingVideos.length > 0
                        ? "From Creators You Follow"
                        : "For You"}
                      <span className="ml-2 inline-block h-[3px] w-6 rounded-full bg-[#7F77DD] align-middle" />
                    </h2>
                  </div>

                  {isLoggedIn ? (
                    followingVideos.length > 0 ? (
                      <PaginatedGrid
                        totalItems={
                          followingVideos.filter((v) => normalizeToMainGenre(v.genre) === selectedMood).length
                        }
                      >
                        {(page) => (
                          <UnifiedGrid
                            videos={followingVideos
                              .filter((v) => normalizeToMainGenre(v.genre) === selectedMood)
                              .slice(page * 8, (page + 1) * 8)}
                          />
                        )}
                      </PaginatedGrid>
                    ) : becauseYouWatched.length > 0 ? (
                      <PaginatedGrid
                        totalItems={
                          becauseYouWatched.filter((v) => normalizeToMainGenre(v.genre) === selectedMood).length
                        }
                      >
                        {(page) => (
                          <UnifiedGrid
                            videos={becauseYouWatched
                              .filter((v) => normalizeToMainGenre(v.genre) === selectedMood)
                              .slice(page * 8, (page + 1) * 8)}
                          />
                        )}
                      </PaginatedGrid>
                    ) : (
                      <PaginatedGrid
                        totalItems={
                          newestVideos.filter((v) => normalizeToMainGenre(v.genre) === selectedMood).length
                        }
                      >
                        {(page) => (
                          <UnifiedGrid
                            videos={newestVideos
                              .filter((v) => normalizeToMainGenre(v.genre) === selectedMood)
                              .slice(page * 8, (page + 1) * 8)}
                          />
                        )}
                      </PaginatedGrid>
                    )
                  ) : (
                    <PaginatedGrid
                      totalItems={videos.filter((v) => normalizeToMainGenre(v.genre) === selectedMood).length}
                    >
                      {(page) => (
                        <UnifiedGrid
                          videos={[...videos]
                            .filter((v) => normalizeToMainGenre(v.genre) === selectedMood)
                            .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
                            .slice(page * 8, (page + 1) * 8)}
                        />
                      )}
                    </PaginatedGrid>
                  )}
                </section>
              </AnimateIn>

              {/* New Arrivals — 해당 장르 최신순 */}
              <AnimateIn delay={0.15}>
                <section>
                  <div className="mb-4">
                    <h2 className="text-[20px] font-bold text-white tracking-tight">
                      New Arrivals
                      <span className="ml-2 inline-block h-[3px] w-6 rounded-full bg-[#7F77DD] align-middle" />
                    </h2>
                  </div>
                  <PaginatedGrid
                    totalItems={newestVideos.filter((v) => normalizeToMainGenre(v.genre) === selectedMood).length}
                  >
                    {(page) => (
                      <UnifiedGrid
                        videos={newestVideos
                          .filter((v) => normalizeToMainGenre(v.genre) === selectedMood)
                          .slice(page * 8, (page + 1) * 8)}
                      />
                    )}
                  </PaginatedGrid>
                </section>
              </AnimateIn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
