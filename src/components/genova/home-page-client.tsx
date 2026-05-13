"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Film, Heart, Play, RefreshCw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Competition } from "@/lib/types";
import type { Video } from "@/lib/types";
import { useI18n } from "@/components/genova/language-provider";
import { useGenreFilter } from "@/components/genova/genre-filter-context";
import { AnimateIn } from "@/components/animate-in";
import { HomeGenreCarousel } from "@/components/genova/home-genre-carousel";
import { VideoCardFromVideo } from "@/components/genova/video-card";
import { VideoCard, parseRuntimeToSeconds } from "@/components/video/video-card";
import { HeroInfoModal } from "@/components/genova/hero-info-modal";
import { cn } from "@/lib/utils/cn";
import { mainGenreLabel, normalizeToMainGenre } from "@/lib/constants/genres";
import type { GenreFilter } from "@/lib/genova-genre";
import { HomeCompetitionBanner } from "@/components/genova/home-competition-banner";
import { HomeTabNav } from "@/components/genova/home-tab-nav";
import type { MainTab, SubGenre, SortKey } from "@/components/genova/home-tab-nav";
import { AwardsGallery } from "@/components/genova/awards-gallery";
import { followUserAction, unfollowUserAction } from "@/app/actions/profile";
import { toggleSaveAction } from "@/app/actions/engagement";

function formatRuntimeDisplay(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function UnifiedGrid({ videos }: { videos: Video[] }) {
  const { t } = useI18n();
  if (videos.length === 0) {
    return <p className="text-sm text-white/30">{t("home.noVideosYet", "No videos yet.")}</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 overflow-visible">
      {videos.map((video) => (
        <VideoCardFromVideo key={video.id} video={video} />
      ))}
    </div>
  );
}

function calcRating(likeCount: number): number {
  if (likeCount < 10) return 8.0;
  if (likeCount < 100) return 8.0 + (likeCount / 100) * 0.5;
  if (likeCount < 1000) return 8.5 + (likeCount / 1000) * 0.3;
  return Math.min(9.0, 8.8 + (likeCount / 10000) * 0.2);
}

function calcTrend(video: Video, allVideos: Video[]): "New" | "Hot" | "Trending" | null {
  const daysSinceUpload = (Date.now() - new Date(video.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpload <= 7) return "New";

  const sortedByViews = [...allVideos].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
  const top10Percent = Math.ceil(sortedByViews.length * 0.1);
  const topVideos = sortedByViews.slice(0, top10Percent);
  if (topVideos.some((v) => v.id === video.id)) return "Hot";

  const likeRate = (video.likeCount ?? 0) / Math.max(1, video.viewCount ?? 1);
  if (likeRate >= 0.05) return "Trending";

  return null;
}

function HeroSaveButton({ videoId }: { videoId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(false);
  const [pending, startTransition] = useTransition();

  const onSave = () => {
    startTransition(async () => {
      const res = await toggleSaveAction(videoId);
      if (!res.ok) {
        if ("needAuth" in res && res.needAuth) router.push("/auth");
        return;
      }
      setSaved(res.saved);
      setToast(true);
      setTimeout(() => setToast(false), 2000);
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="flex h-10 w-10 items-center justify-center rounded-full border transition hover:bg-white/20 disabled:opacity-50"
        style={{
          borderColor: saved ? "rgba(127,119,221,0.6)" : "rgba(255,255,255,0.3)",
          background: saved ? "rgba(83,74,183,0.3)" : "rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          color: "white",
        }}
        aria-label="Save"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinejoin="round"/>
        </svg>
      </button>
      {toast && (
        <div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white"
          style={{
            background: "linear-gradient(135deg, rgba(83,74,183,0.9) 0%, rgba(63,54,163,0.9) 100%)",
            border: "1px solid rgba(127,119,221,0.4)",
            boxShadow: "0 4px 16px rgba(83,74,183,0.4)",
          }}
        >
          {saved ? `${t("video.saved")} ✓` : t("video.save")}
        </div>
      )}
    </div>
  );
}

function HeroBanner({ videos, allVideos }: { videos: Video[]; allVideos: Video[] }) {
  const { t, locale } = useI18n();
  const [current, setCurrent] = useState(0);
  const [fadeVisible, setFadeVisible] = useState(true);
  const heroVideos = videos.slice(0, 5);
  const video = heroVideos[current];
  const autoAdvanceKey = heroVideos.length * 100 + current;

  useEffect(() => {
    if (heroVideos.length <= 1) return;
    const timer = setTimeout(() => {
      setFadeVisible(false);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % heroVideos.length);
        setFadeVisible(true);
      }, 400);
    }, 6000);
    return () => clearTimeout(timer);
  }, [autoAdvanceKey]);

  if (!video) return null;

  const rating = calcRating(video.likeCount ?? 0);
  const trend = calcTrend(video, allVideos);

  const HERO_FALLBACKS = [
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1400&q=80",
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1400&q=80",
    "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1400&q=80",
  ];
  const backdropUrl = (video as Video & { backdropUrl?: string | null }).backdropUrl;
  const hasBackdrop = !!backdropUrl;
  const heroImage = backdropUrl || video.thumbnailUrl || HERO_FALLBACKS[current % HERO_FALLBACKS.length];
  const creator =
    video.creatorName?.trim() ||
    video.uploaderDisplayName?.trim() ||
    t("video.creatorFallback", "Creator");
  const genre = video.genre ? mainGenreLabel(video.genre, locale) : "";

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/5.5" }}>
      <img
        src={heroImage}
        alt=""
        className="h-full w-full object-cover"
        style={{
          opacity: fadeVisible ? 1 : 0,
          transition: "opacity 0.4s ease-in-out",
          filter: "brightness(1.15)",
        }}
      />
      {/* 왼쪽 텍스트 영역 어둡게 — 백드롭 없으면 페이드 강화 */}
      <div
        className="absolute inset-0"
        style={{
          background: hasBackdrop
            ? "linear-gradient(to right, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.7) 30%, rgba(10,10,10,0) 60%)"
            : "linear-gradient(to right, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.8) 30%, rgba(10,10,10,0) 60%)",
        }}
      />
      {/* 상단 페이드 — 배경과 자연스럽게 */}
      <div className="absolute left-0 right-0 top-0 h-16" style={{ background: "linear-gradient(to bottom, rgba(8,6,20,0.95) 0%, rgba(8,6,20,0.5) 35%, transparent 100%)" }} />
      {/* 하단 페이드 */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,6,20,0.95) 0%, rgba(8,6,20,0.5) 20%, transparent 50%)" }} />
      {/* 오른쪽 페이드 */}
      <div className="absolute bottom-0 right-0 top-0 w-32 opacity-50" style={{ background: "linear-gradient(to left, rgba(8,6,20,0.35) 0%, transparent 100%)" }} />

      <div
        className="absolute inset-0 z-[6] flex items-center"
        style={{
          opacity: fadeVisible ? 1 : 0,
          transition: "opacity 0.4s ease-in-out",
        }}
      >
        <div
  className="max-w-3xl pt-16 relative z-[2]"
          style={{ paddingLeft: "calc(240px - 8rem)" }}
        >
          {/* 1. 추천 배지 */}
          <div className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#AFA9EC]">
            <span className="text-[#7F77DD]">✦</span>
            <p>{t("home.heroFeatured", "Featured")}</p>
          </div>

          {/* 2. 제목 */}
          <h2
            className="line-clamp-2 font-black tracking-tight pr-4"
            style={{
              fontSize: "clamp(2.25rem, 4vw, 4.5rem)",
              lineHeight: "1.02",
              backgroundImage: "linear-gradient(180deg, #ffffff 0%, #ffffff 60%, rgba(220,215,255,0.85) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 4px 30px rgba(0,0,0,0.4)",
              letterSpacing: "-0.025em",
              paddingBottom: "0.1em",
            }}
          >
            {video.title}
          </h2>

          {/* 3. 메타 정보 — 장르 + Director 가로 한 줄 */}
          <div className="mt-5 flex flex-wrap items-center gap-3 text-[13px]">
            {genre && (
              <span
                className="rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/75"
                style={{
                  background: "rgba(127,119,221,0.12)",
                  border: "1px solid rgba(127,119,221,0.25)",
                }}
              >
                {genre}
              </span>
            )}
            <span className="h-3 w-px bg-white/20" />
            <span className="flex items-center gap-1.5 text-white/55">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Director</span>
              <span className="font-semibold text-white/85">{creator}</span>
            </span>
          </div>

          {/* 4. 영상 설명 */}
          <p className="mt-4 max-w-xl line-clamp-2 text-[16px] leading-[1.55] text-white/65">
            {video.description?.trim() ||
              t("home.heroDescFallback", "An AI-generated film pushing the boundaries of creativity and visual storytelling.")}
          </p>

          {/* 5. CTA 버튼 — 브랜드 퍼플 + More Info */}
          <div className="mt-7 flex items-center gap-3">
            <a
              href={"/watch/" + video.id}
              className="group flex items-center gap-2.5 rounded-lg px-10 py-3 text-[15px] font-bold text-white transition-all duration-300 hover:scale-[1.03]"
              style={{
                background: "linear-gradient(135deg, rgba(107,95,212,0.85) 0%, rgba(83,74,183,0.75) 50%, rgba(63,54,163,0.65) 100%)",
                border: "1px solid rgba(175,169,236,0.35)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 8px rgba(83,74,183,0.2)",
              }}
            >
              <Play size={17} fill="white" className="transition-transform duration-300 group-hover:scale-110" />
              {t("films.play", "Play")}
            </a>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-hero-info", { detail: { videoId: video.id } }))}
              className="flex items-center gap-2 rounded-lg px-7 py-3 text-[14px] font-semibold text-white/85 transition-all duration-300 hover:text-white"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
              }}
            >
              <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01" strokeLinecap="round"/>
              </svg>
              {t("home.heroMoreInfo", "More Info")}
            </button>
            <HeroSaveButton videoId={video.id} />
          </div>
          {false && ( // TODO: 데이터 충분히 쌓이면 false 제거
            <div
              className="mt-6 flex w-fit items-stretch gap-0"
              style={{ background: "transparent", backdropFilter: "none" }}
            >
              {video.award && (
                <div className="flex items-center gap-3 border-r border-white/10 px-5 py-3">
                  <svg className="h-6 w-6 shrink-0 text-white/55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 21h8M12 17v4M17 3H7l-2 7c0 2.8 2.24 5 5 5s5-2.2 5-5l-2-7z"/>
                    <path d="M5 10H3a2 2 0 000 4h2M19 10h2a2 2 0 010 4h-2"/>
                  </svg>
                  <div>
                    <p className="mb-0.5 text-[13px] leading-none text-white/35">{t("home.heroAwardLabel", "Award")}</p>
                    <p className="text-[15px] font-semibold leading-none text-white">{video.award}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 border-r border-white/10 px-5 py-3">
                <svg className="h-6 w-6 shrink-0 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <div>
                  <p className="mb-0.5 text-[13px] leading-none text-white/35">{t("home.heroRating", "Rating")}</p>
                  <p className="text-[15px] font-semibold leading-none text-white">{rating.toFixed(1)}</p>
                </div>
              </div>
              {trend && (
                <div className="flex items-center gap-3 px-5 py-3">
                  <svg className="h-6 w-6 shrink-0 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2c0 6-8 10-8 14a8 8 0 0016 0c0-4-8-8-8-14z"/>
                  </svg>
                  <div>
                    <p className="mb-0.5 text-[13px] leading-none text-white/35">{t("home.heroTrending", "Trending")}</p>
                    <p className="text-[15px] font-semibold leading-none text-white">
                      {trend === "New" && t("home.heroTrendNew", "New")}
                      {trend === "Hot" && t("home.heroTrendHot", "Hot")}
                      {trend === "Trending" && t("home.heroTrendTrendingValue", "Trending")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* 하단 배경과 자연스럽게 연결 */}
      <div className="absolute bottom-0 left-0 right-0 h-[200px] z-[5] pointer-events-none bg-gradient-to-b from-transparent via-[#0a0a0a]/60 to-[#0a0a0a]" />
      {heroVideos.length > 1 && (
        <div className="absolute bottom-8 right-8 z-10 flex items-center gap-2">
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
                "h-[2px] transition-all duration-300",
                i === current
                  ? "w-10 bg-white"
                  : "w-6 bg-white/30 hover:bg-white/50"
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
      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/35 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
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
    return sorted.slice(0, 16);
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
      <SectionHeader
        eyebrow="Charts"
        title={
          <>
            {t("home.top16Lead", "Top 16")}{" "}
            <span className="text-[#8b5cf6]">{mainGenreLabel(genre, locale)}</span>
          </>
        }
      />

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

function SectionHeader({
  eyebrow,
  title,
  accent = "#7F77DD",
  right,
}: {
  eyebrow: string;
  title: React.ReactNode;
  accent?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: accent }}>✦</span>
          <p
            className="text-[10px] font-black uppercase tracking-[0.22em]"
            style={{ color: accent, opacity: 0.75 }}
          >
            {eyebrow}
          </p>
        </div>
        <h2
          className="text-[26px] font-black tracking-tight text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          {title}
        </h2>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function WhatsWorking({ videos }: { videos: Video[] }) {
  const { t } = useI18n();
  const [selectedGenre, setSelectedGenre] = useState<"all" | "film" | "animation" | "music" | "art" | "daily">("all");

  const genreFilters = [
    { key: "all" as const, label: "All" },
    { key: "film" as const, label: "Film" },
    { key: "animation" as const, label: "Animation" },
    { key: "music" as const, label: "Music" },
    { key: "art" as const, label: "Art" },
    { key: "daily" as const, label: "Daily" },
  ];

  const matchesGenre = (video: Video) => {
    if (selectedGenre === "all") return true;
    const genre = (video.genre ?? "").toLowerCase();
    const subGenre = (video.subGenre ?? "").toLowerCase();
    const tags = (video.tags ?? []).map((tag) => tag.toLowerCase());
    const normalized = (normalizeToMainGenre(video.genre ?? "") ?? "").toLowerCase();
    const corpus = [genre, subGenre, normalized, ...tags].join(" ");

    if (selectedGenre === "film") return corpus.includes("film");
    if (selectedGenre === "animation") return corpus.includes("animation");
    if (selectedGenre === "music") return corpus.includes("music") || corpus.includes("mv");
    if (selectedGenre === "art") return corpus.includes("art");
    if (selectedGenre === "daily") return corpus.includes("daily");
    return true;
  };

  const topVideos = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = videos.filter((v) => new Date(v.createdAt).getTime() >= sevenDaysAgo && matchesGenre(v));
    // 최근 7일 4개 미만이면 전체에서 fallback
    const filteredAll = videos.filter(matchesGenre);
    const source = recent.length >= 4 ? recent : filteredAll;
    return [...source]
      .sort((a, b) => {
        const aScore = (a.likeCount ?? 0) * 2 + (a.viewCount ?? 0) * 0.05;
        const bScore = (b.likeCount ?? 0) * 2 + (b.viewCount ?? 0) * 0.05;
        return bScore - aScore;
      })
      .slice(0, 4);
  }, [videos, selectedGenre]);

  const hasAnyVideos = videos.length > 0;
  if (!hasAnyVideos) return null;

  return (
    <section>
      <SectionHeader
        eyebrow="This Week"
        title={t("home.whatsWorking", "What's Working")}
        right={
          <div className="flex items-center gap-3">
            <p className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 md:block">
              {t("home.whatsWorkingSub", "Top 4 · Workflow Disclosed")}
            </p>
            <div className="max-w-[58vw] overflow-x-auto hide-scrollbar">
              <div className="flex items-center gap-2">
                {genreFilters.map((filter) => {
                  const active = selectedGenre === filter.key;
                  return (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setSelectedGenre(filter.key)}
                      className={cn(
                        "h-8 cursor-pointer rounded-full px-4 text-xs font-medium tracking-wide transition-all duration-200",
                        active
                          ? "bg-white text-[#0a0a0a]"
                          : "border border-white/[0.08] bg-white/[0.04] text-white/55 hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white/80",
                      )}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        }
      />
      {topVideos.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {topVideos.map((video, idx) => (
            <VideoCard
              key={video.id}
              video={video}
              rank={idx + 1}
              showRank={true}
              showLikes={true}
              showMadeWith={true}
              showDuration={true}
              showViews={true}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Film className="h-10 w-10 text-white/20" />
          <p className="mt-3 text-sm text-white/35">{t("home.noVideosForGenre", "이 장르에는 아직 영상이 없어요")}</p>
        </div>
      )}
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
      <div className="relative overflow-visible" aria-label={totalPages > 1 ? `Page ${displayPage + 1} of ${totalPages}` : undefined}>
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

type SpotlightCreator = {
  uploadedBy: string;
  displayName: string;
  avatarUrl: string | null;
  videoCount: number;
  totalLikes: number;
  recentVideos: { id: string; title: string; thumbnailUrl: string | null; genre?: string | null }[];
  aiTools: string[];
};

const SPOTLIGHT_BADGES = [
  { label: "Rising Creator", emoji: "✦", color: "#7F77DD", glow: "rgba(83,74,183,0.3)", border: "rgba(127,119,221,0.25)", bg: "rgba(83,74,183,0.08)" },
  { label: "Creative Mind", emoji: "🔥", color: "#f97316", glow: "rgba(249,115,22,0.35)", border: "rgba(249,115,22,0.3)", bg: "rgba(249,115,22,0.06)" },
  { label: "Top Rated", emoji: "⭐", color: "#FFD700", glow: "rgba(255,215,0,0.3)", border: "rgba(255,215,0,0.25)", bg: "rgba(255,215,0,0.05)" },
  { label: "Visionary", emoji: "🌌", color: "#06b6d4", glow: "rgba(6,182,212,0.3)", border: "rgba(6,182,212,0.25)", bg: "rgba(6,182,212,0.05)" },
  { label: "Storyteller", emoji: "🎬", color: "#a855f7", glow: "rgba(168,85,247,0.3)", border: "rgba(168,85,247,0.25)", bg: "rgba(168,85,247,0.06)" },
  { label: "Trendsetter", emoji: "⚡", color: "#ec4899", glow: "rgba(236,72,153,0.3)", border: "rgba(236,72,153,0.25)", bg: "rgba(236,72,153,0.05)" },
] as const;

type HeroAwardVideos = {
  grandPrize: Video | null;
  excellence: Video | null;
  merit: Video | null;
  audience: Video | null;
};

type HomePageClientProps = {
  videosFromDb: Video[];
  /** Supabase competition deadline (ISO); null uses banner fallback timer */
  competitionDeadlineIso: string | null;
  competition: Competition | null;
  originals: Video[];
  spotlightCreators: SpotlightCreator[];
  followingVideos: Video[];
  becauseYouWatched: Video[];
  isLoggedIn: boolean;
  heroAwardVideos?: HeroAwardVideos;
  initialTab?: "recommended" | "films";
  competitionStats: {
    activeCount: number;
    totalPrizeUSD: number;
    participantCount: number;
  };
};

function SpotlightFollowButton({ targetUserId, badgeColor = "#7F77DD" }: { targetUserId: string; badgeColor?: string }) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [pending, startTransition] = React.useTransition();

  const onToggle = () => {
    startTransition(async () => {
      if (following) {
        const res = await unfollowUserAction(targetUserId);
        if (res.ok) setFollowing(false);
      } else {
        const res = await followUserAction(targetUserId);
        if (res.ok) setFollowing(true);
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending}
      className="shrink-0 rounded-xl px-8 py-2 text-xs font-bold transition-all duration-300 hover:scale-[1.03] disabled:opacity-50"
      style={following ? {
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.4)",
      } : {
        background: `linear-gradient(135deg, ${badgeColor}40 0%, ${badgeColor}20 100%)`,
        border: `1px solid ${badgeColor}60`,
        boxShadow: `0 0 12px ${badgeColor}30`,
        color: "white",
      }}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}

function SpotlightMoreMenu({ creator }: { creator: SpotlightCreator }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/[0.06] hover:text-white/55"
        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 z-50 w-56 overflow-hidden rounded-xl p-3"
          style={{
            background: "linear-gradient(160deg, rgba(22,14,42,0.99) 0%, rgba(10,6,22,1) 100%)",
            border: "1px solid rgba(83,74,183,0.25)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(127,119,221,0.08)",
          }}
        >
          <Link
            href={`/profile/${creator.uploadedBy}`}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/55 transition hover:bg-white/[0.05] hover:text-white"
            onClick={() => setOpen(false)}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            View Profile
          </Link>

          {creator.aiTools.length > 0 && (
            <div className="mt-2 border-t border-white/[0.06] pt-2">
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-white/25">
                AI Tools
              </p>
              <div className="flex flex-wrap gap-1 px-3">
                {creator.aiTools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-md px-2 py-0.5 text-[10px] text-white/50"
                    style={{ background: "rgba(83,74,183,0.15)", border: "1px solid rgba(83,74,183,0.2)" }}
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function HomePageClient(props: HomePageClientProps) {
  const {
    videosFromDb,
    competitionDeadlineIso,
    competition,
    originals,
    spotlightCreators,
    followingVideos,
    becauseYouWatched,
    isLoggedIn,
    heroAwardVideos,
    initialTab,
    competitionStats,
  } = props;
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { selectedGenre, setSelectedGenre } = useGenreFilter();
  const [selectedMood, setSelectedMood] = useState<string>("all");
  const [activeMainTab, setActiveMainTab] = useState<MainTab>(initialTab ?? "recommended");
  const [activeSubGenre, setActiveSubGenre] = useState<SubGenre>("all");
  const [activeSort, setActiveSort] = useState<SortKey>("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const moodBarRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  const [allVideos, setAllVideos] = useState<Video[]>(videosFromDb);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(videosFromDb.length === 50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setAllVideos(videosFromDb);
    setPage(0);
    setHasMore(videosFromDb.length === 50);
  }, [videosFromDb]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/videos?page=${nextPage}`);
      const data = await res.json();
      if (data.videos?.length) {
        setAllVideos((prev) => {
          const existingIds = new Set(prev.map((v) => v.id));
          const newOnly = (data.videos as Video[]).filter((v) => !existingIds.has(v.id));
          return [...prev, ...newOnly];
        });
      }
      setPage(nextPage);
      setHasMore(data.hasMore ?? false);
    } catch (err) {
      console.error("Failed to load more videos:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  const videos = allVideos;
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

  const carouselSlides = useMemo(() => {
    const GENRES: { key: "film" | "animation" | "music" | "art" | "daily"; label: string }[] = [
      { key: "film", label: t("genre.bucketFilm", "Film") },
      { key: "animation", label: t("genre.animation", "Animation") },
      { key: "music", label: t("genre.bucketMusic", "Music") },
      { key: "art", label: t("genre.bucketArt", "Art") },
      { key: "daily", label: t("genre.bucketDaily", "Daily") },
    ];

    return GENRES.map((g) => {
      const filtered = videos
        .filter((v) => normalizeToMainGenre(v.genre) === g.key)
        .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
        .slice(0, 4)
        .map((v) => {
          const runtimeSec = parseRuntimeToSeconds(v.runtime);
          return {
            id: v.id,
            title: v.title,
            thumbnailUrl: v.thumbnailUrl ?? null,
            creatorName: v.creatorName?.trim() || v.uploaderDisplayName?.trim() || null,
            likeCount: v.likeCount ?? 0,
            muxPlaybackId: v.muxPlaybackId ?? null,
            runtime: runtimeSec > 0 ? runtimeSec : null,
          };
        });

      return {
        genreKey: g.key,
        genreLabel: g.label,
        videos: filtered,
      };
    });
  }, [videos, t]);

  const filteredVideos = useMemo(() => {
    let result: Video[];

    const sq = searchQuery.trim().toLowerCase();
    if (sq) {
      result = videos.filter(
        (v) =>
          v.title.toLowerCase().includes(sq) ||
          (v.creatorName ?? "").toLowerCase().includes(sq) ||
          (v.uploaderDisplayName ?? "").toLowerCase().includes(sq) ||
          (v.tags ?? []).some((tag) => tag.toLowerCase().includes(sq)),
      );
    } else if (activeMainTab === "recommended") {
      const base = [...videos];
      if (activeSubGenre === "trending") {
        result = base.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
      } else if (activeSubGenre === "awards") {
        result = base.filter((v) => v.isFinalist || v.award);
      } else {
        result = base.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
      }
    } else if (activeMainTab === "films") {
      if (activeSubGenre === "all") {
        result = [...videos];
      } else {
        result = videos.filter((v) => normalizeToMainGenre(v.genre) === activeSubGenre);
      }
    } else {
      result = [...videos];
    }

    if (activeSort === "latest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (activeSort === "liked") {
      result.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    } else if (activeSort === "viewed") {
      result.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    }

    return result;
  }, [videos, activeMainTab, activeSubGenre, activeSort, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <AnimateIn delay={0.05}>
        <HomeCompetitionBanner competition={competition} stats={competitionStats} />
      </AnimateIn>

      <div data-content-start className="w-full space-y-2 px-6 pb-12 pt-4 sm:space-y-3 sm:px-8">
        <AnimateIn delay={0.07}>
          <HomeGenreCarousel slides={carouselSlides} />
        </AnimateIn>

        <AnimateIn delay={0.09} className="relative z-[60]">
          <HomeTabNav
            activeMainTab={activeMainTab}
            activeSubGenre={activeSubGenre}
            activeSort={activeSort}
            searchQuery={searchQuery}
            onMainTabChange={(tab) => {
              setActiveMainTab(tab);
              setActiveSubGenre("all");
            }}
            onSubGenreChange={setActiveSubGenre}
            onSortChange={setActiveSort}
            onSearchChange={setSearchQuery}
          />
        </AnimateIn>

        <AnimateIn delay={0.11} className="relative z-0">
         <div className="min-h-[800px]">
          {activeSubGenre === "awards" && activeMainTab === "recommended" ? (
            <AwardsGallery
              heroAwardVideos={heroAwardVideos ?? { grandPrize: null, excellence: null, merit: null, audience: null }}
              competitionTitle={competition?.title
                ? (locale === "ko" ? competition.titleKo : locale === "ja" ? competition.titleJa : competition.titleEn) ?? competition.title
                : t("awards.gallery.title", "Award Winners")}
            />
          ) : filteredVideos.length > 0 ? (
            <div className="relative z-0 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filteredVideos.map((v) => {
                const creatorName =
                  v.creatorName?.trim() || v.uploaderDisplayName?.trim() || "";
                const runtimeSec = parseRuntimeToSeconds(v.runtime);
                return (
                  <Link
                    key={v.id}
                    href={`/watch/${v.id}`}
                    className="group relative block overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1"
                    onMouseEnter={() => setHoveredId(v.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="relative aspect-[3/2] overflow-hidden bg-white/[0.02]">
                      <img
                        src={
                          hoveredId === v.id && v.muxPlaybackId
                            ? `https://image.mux.com/${v.muxPlaybackId}/animated.gif?width=640&fps=15`
                            : v.thumbnailUrl || ""
                        }
                        alt={v.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85) 100%)",
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="line-clamp-1 text-[13px] font-bold text-white">{v.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-white/55">
                          {creatorName && <span className="line-clamp-1">{creatorName}</span>}
                          {runtimeSec > 0 && (
                            <>
                              <span>·</span>
                              <span>{formatRuntimeDisplay(runtimeSec)}</span>
                            </>
                          )}
                          {typeof v.likeCount === "number" && v.likeCount > 0 && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-0.5">
                                <Heart size={10} className="fill-current" />
                                {v.likeCount}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[0.06] transition group-hover:ring-white/15" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[600px] flex-col items-center justify-center text-center">
              <Film className="h-10 w-10 text-white/15" />
              <p className="mt-3 text-sm text-white/35">
                {searchQuery.trim()
                  ? t("home.noSearchResults", "No search results")
                  : t("home.noVideosForTab", "No videos to show yet")}
              </p>
            </div>
          )}
         </div>
        </AnimateIn>

        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isLoadingMore && (
              <div className="text-[12px] text-white/40">{t("home.loadingMore", "Loading more...")}</div>
            )}
          </div>
        )}

      </div>

      <HeroInfoModal videos={videos} />
    </div>
  );
}
