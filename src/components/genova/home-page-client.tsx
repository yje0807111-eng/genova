"use client";

import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Film, Play, RefreshCw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Competition } from "@/lib/types";
import type { Video } from "@/lib/types";
import { useI18n } from "@/components/genova/language-provider";
import { useGenreFilter } from "@/components/genova/genre-filter-context";
import { UploadCTA } from "./upload-cta";
import { AnimateIn } from "@/components/animate-in";
import { VideoCardFromVideo } from "@/components/genova/video-card";
import { VideoCard } from "@/components/video/video-card";
import { HeroInfoModal } from "@/components/genova/hero-info-modal";
import { cn } from "@/lib/utils/cn";
import { mainGenreLabel, normalizeToMainGenre } from "@/lib/constants/genres";
import { formatPrizeWithConversion } from "@/lib/utils/format-prize";
import type { GenreFilter } from "@/lib/genova-genre";
import { followUserAction, unfollowUserAction } from "@/app/actions/profile";
import { toggleSaveAction } from "@/app/actions/engagement";
import { TOOL_CATEGORY } from "@/lib/constants/tool-category";

export { TOOL_CATEGORY };

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
            ? "linear-gradient(to right, rgba(8,6,24,0.95) 0%, rgba(8,6,24,0.7) 30%, rgba(8,6,24,0) 60%)"
            : "linear-gradient(to right, rgba(8,6,24,0.98) 0%, rgba(8,6,24,0.8) 30%, rgba(8,6,24,0) 60%)",
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
            <span className="flex items-center gap-1.5 text-white/60">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Director</span>
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
                  <p className="text-[15px] font-semibold leading-none text-white">{rating.toFixed(1)}</p>
                </div>
              </div>
              {trend && (
                <div className="flex items-center gap-3 px-5 py-3">
                  <svg className="h-6 w-6 shrink-0 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2c0 6-8 10-8 14a8 8 0 0016 0c0-4-8-8-8-14z"/>
                  </svg>
                  <div>
                    <p className="mb-0.5 text-[13px] leading-none text-white/40">{t("home.heroTrending", "Trending")}</p>
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
      <div className="absolute bottom-0 left-0 right-0 h-[200px] z-[5] pointer-events-none bg-gradient-to-b from-transparent via-[#080618]/60 to-[#080618]" />
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
                          ? "bg-white text-[#080618]"
                          : "border border-white/[0.08] bg-white/[0.04] text-white/60 hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white/80",
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
          <p className="mt-3 text-sm text-white/40">{t("home.noVideosForGenre", "이 장르에는 아직 영상이 없어요")}</p>
        </div>
      )}
    </section>
  );
}

const CATEGORY_LABEL: Record<string, { label: string; color: string }> = {
  image: { label: "IMAGE", color: "text-pink-300/40 bg-pink-500/5 border-pink-500/10" },
  video: { label: "VIDEO", color: "text-cyan-300/40 bg-cyan-500/5 border-cyan-500/10" },
  audio: { label: "AUDIO", color: "text-amber-300/40 bg-amber-500/5 border-amber-500/10" },
  text: { label: "TEXT", color: "text-emerald-300/40 bg-emerald-500/5 border-emerald-500/10" },
};

function AIToolCard({
  tool,
  count,
  topVideo,
  rank,
  previewVideos,
}: {
  tool: string;
  count: number;
  topVideo: Video;
  rank: number;
  previewVideos: Video[];
}) {
  const category = TOOL_CATEGORY[tool];
  const categoryInfo = category ? CATEGORY_LABEL[category] : null;
  const initials = tool.slice(0, 2).toUpperCase();
  const isTop1 = rank === 1;
  const categoryDotClass =
    category === "image"
      ? "bg-pink-400"
      : category === "video"
        ? "bg-[#7F77DD]"
        : category === "audio"
          ? "bg-orange-400"
          : "bg-emerald-300";
  const categoryHoverClass =
    category === "image"
      ? "hover:border-pink-400/40 hover:shadow-[0_0_30px_rgba(244,114,182,0.25)]"
      : category === "video"
        ? "hover:border-[#7F77DD]/50 hover:shadow-[0_0_30px_rgba(127,119,221,0.25)]"
        : category === "audio"
          ? "hover:border-orange-400/40 hover:shadow-[0_0_30px_rgba(251,146,60,0.25)]"
          : "hover:border-emerald-400/40 hover:shadow-[0_0_30px_rgba(52,211,153,0.2)]";
  const rankClass =
    rank === 1
      ? "text-base font-bold text-[#F5D182] drop-shadow-[0_0_8px_rgba(245,209,130,0.4)]"
      : rank === 2
        ? "text-sm font-semibold text-white/80"
        : rank === 3
          ? "text-sm font-semibold text-white/70"
          : "text-sm font-medium text-white/40";
  const subtitle =
    category === "image"
      ? "AI Image Generation"
      : category === "video"
        ? "AI Video Generation"
        : category === "audio"
          ? "AI Audio Generation"
          : "AI Creative Assistant";
  const toolLower = tool.toLowerCase();
  const iconBg = toolLower.includes("midjourney")
    ? "bg-purple-500/30"
    : toolLower.includes("kling")
      ? "bg-cyan-500/30"
      : toolLower.includes("elevenlabs")
        ? "bg-zinc-500/30"
        : toolLower.includes("runway")
          ? "bg-green-500/30"
          : toolLower.includes("udio")
            ? "bg-pink-500/30"
            : "bg-white/10";

  return (
    <Link
      href={`/tools/${encodeURIComponent(tool)}`}
      className={cn(
        "group relative flex aspect-[3/4] flex-col overflow-hidden rounded-xl border border-t bg-gradient-to-b from-[#15102E]/90 to-[#0C0820]/90 p-5 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:scale-[1.02] hover:from-[#1A1438]/90 hover:to-[#100B26]/90",
        isTop1 ? "border-white/[0.08] border-t-white/[0.15] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_24px_rgba(0,0,0,0.4),0_0_24px_rgba(245,209,130,0.08)]" : "border-white/[0.08] border-t-white/[0.15]",
        categoryHoverClass,
      )}
    >
      <span className={cn("absolute right-4 top-4 shrink-0 font-mono", rankClass)}>
        {isTop1 ? <span className="mr-1 align-middle text-[10px] text-[#F5D182]/60">✦</span> : null}
        #{rank}
      </span>

      <div className="flex-1">
        <span className={cn("flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.4)]", iconBg)}>
          {initials}
        </span>
        <p className="mt-4 min-h-[3.5rem] pr-14 text-xl font-bold leading-tight text-white line-clamp-2">{tool}</p>
        <p className="mt-1 line-clamp-1 text-xs text-white/50">{subtitle}</p>
      </div>

      <div className="mt-auto shrink-0 pt-2">
        <div className="flex items-center gap-1.5">
          {(() => {
            const maxSlots = 4;
            const hasExtra = count > maxSlots;
            const thumbs = hasExtra ? previewVideos.slice(0, 3) : previewVideos.slice(0, maxSlots);
            const filledSlots = hasExtra ? maxSlots : Math.max(maxSlots, thumbs.length);
            const placeholders = Math.max(0, filledSlots - thumbs.length - (hasExtra ? 1 : 0));

            return (
              <>
                {thumbs.map((video) =>
                  video.thumbnailUrl ? (
                    <div key={video.id} className="relative h-12 w-12 overflow-hidden rounded-md">
                      <img
                        src={video.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  ) : (
                    <div
                      key={video.id}
                      className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-[#7F77DD]/8 via-[#534AB7]/4 to-transparent text-2xl text-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]"
                    >
                      ✦
                    </div>
                  ),
                )}
                {hasExtra ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white/5 text-xs text-white/60">
                    +{count - 3}
                  </div>
                ) : null}
                {Array.from({ length: placeholders }).map((_, idx) => (
                  <div
                    key={`placeholder-${idx}`}
                    className="flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-[#7F77DD]/8 via-[#534AB7]/4 to-transparent text-2xl text-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]"
                  >
                    ✦
                  </div>
                ))}
              </>
            );
          })()}
        </div>

        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-wider text-white/50">
            <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle", categoryDotClass)} />
            {categoryInfo?.label ?? "TEXT"} · {count} FILMS
          </p>

          <p className="flex max-h-0 items-center gap-1 overflow-hidden text-[11px] uppercase tracking-wider text-white/60 opacity-0 transition-all duration-300 group-hover:max-h-[24px] group-hover:opacity-100">
            View films <span aria-hidden>→</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

function TrendingAITools({ videos }: { videos: Video[] }) {
  const { t } = useI18n();

  const trending = useMemo(() => {
    type V = Video & { aiTools?: string[] | null };
    const map = new Map<string, { count: number; topVideo: Video; topScore: number; previewVideos: Video[] }>();

    (videos as V[]).forEach((video) => {
      const tools = video.aiTools ?? [];
      const score = (video.likeCount ?? 0) * 2 + (video.viewCount ?? 0) * 0.05;
      tools.forEach((tool) => {
        const existing = map.get(tool);
        if (!existing) {
          map.set(tool, {
            count: 1,
            topVideo: video,
            topScore: score,
            previewVideos: video.thumbnailUrl ? [video] : [],
          });
        } else {
          existing.count += 1;
          if (score > existing.topScore) {
            existing.topVideo = video;
            existing.topScore = score;
          }
          if (
            video.thumbnailUrl &&
            !existing.previewVideos.some((v) => v.id === video.id)
          ) {
            existing.previewVideos.push(video);
          }
        }
      });
    });

    return Array.from(map.entries())
      .map(([tool, data]) => ({
        tool,
        count: data.count,
        topVideo: data.topVideo,
        previewVideos: [...data.previewVideos]
          .sort((a, b) => {
            const viewDiff = (b.viewCount ?? 0) - (a.viewCount ?? 0);
            if (viewDiff !== 0) return viewDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
          .slice(0, 4),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [videos]);

  if (trending.length === 0) return null;
  return (
    <section>
      <SectionHeader
        eyebrow="Trending"
        title={t("home.trendingAITools", "AI Tools in Use")}
        right={
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
            {t("home.trendingAIToolsSub", "Most used this week")}
          </p>
        }
      />
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-7">
        {trending.map((item, idx) => (
          <AIToolCard
            key={item.tool}
            tool={item.tool}
            count={item.count}
            topVideo={item.topVideo}
            rank={idx + 1}
            previewVideos={item.previewVideos}
          />
        ))}
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

type CompetitionWithThumb = Competition & { thumbnailUrl?: string | null };

function CompetitionBanner({ competition }: { competition: Competition | null }) {
  const { locale, t } = useI18n();
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

  const prizeDisplay = competition
    ? formatPrizeWithConversion(
        competition.prizeInfoKo ?? null,
        competition.prizeInfoEn ?? null,
        competition.prizeInfoJa ?? null,
        competition.prizeInfo ?? "",
        locale,
        competition.currency ?? null,
        competition.exchangeRateUsdKrw ?? 1350,
        competition.exchangeRateUsdJpy ?? 148,
      )
    : "$3,000 in prizes";

  const prizeDisplayFinal = (() => {
    if (!competition) return "$3,000 in prizes";

    const prizeRaw = competition.prizeInfo ?? "";
    const krwRate = competition.exchangeRateUsdKrw ?? 1350;
    const jpyRate = competition.exchangeRateUsdJpy ?? 148;

    const usdMatch = prizeRaw.match(/\$([0-9,]+)/);
    const krwMatch = prizeRaw.match(/₩([0-9,]+)|([0-9,]+)만원|([0-9,]+)원/);
    const jpyMatch = prizeRaw.match(/¥([0-9,]+)/);

    const usdAmount = usdMatch ? parseInt(usdMatch[1].replace(/,/g, "")) : null;
    const krwAmount = krwMatch
      ? krwMatch[1]
        ? parseInt(krwMatch[1].replace(/,/g, ""))
        : krwMatch[2]
          ? parseInt(krwMatch[2].replace(/,/g, "")) * 10000
          : krwMatch[3]
            ? parseInt(krwMatch[3].replace(/,/g, ""))
            : null
      : null;
    const jpyAmount = jpyMatch ? parseInt(jpyMatch[1].replace(/,/g, "")) : null;

    const formatKrw = (krw: number) => {
      if (krw >= 10000000) return `약 ₩${(krw / 10000000).toFixed(0)}천만`;
      if (krw >= 1000000) return `약 ₩${(krw / 10000).toFixed(0)}만`;
      return `약 ₩${krw.toLocaleString()}`;
    };

    const formatUsd = (usd: number) => `~$${usd.toLocaleString()}`;
    const formatJpy = (jpy: number) => `약 ¥${jpy.toLocaleString()}`;
    void formatJpy;

    if (locale === "ko") {
      if (krwAmount) return `₩${krwAmount.toLocaleString()}`;
      if (usdAmount) return `$${usdAmount.toLocaleString()} (${formatKrw(usdAmount * krwRate)})`;
      if (jpyAmount) return `¥${jpyAmount.toLocaleString()} (${formatKrw(jpyAmount / jpyRate * krwRate)})`;
      return prizeRaw;
    }

    if (locale === "ja") {
      if (jpyAmount) return `¥${jpyAmount.toLocaleString()}`;
      if (usdAmount) return `$${usdAmount.toLocaleString()} (約¥${(usdAmount * jpyRate).toLocaleString()})`;
      if (krwAmount) return `₩${krwAmount.toLocaleString()} (約¥${Math.round(krwAmount / krwRate * jpyRate).toLocaleString()})`;
      return prizeRaw;
    }

    if (usdAmount) return `$${usdAmount.toLocaleString()}`;
    if (krwAmount) return `₩${krwAmount.toLocaleString()} (${formatUsd(Math.round(krwAmount / krwRate))})`;
    if (jpyAmount) return `¥${jpyAmount.toLocaleString()} (${formatUsd(Math.round(jpyAmount / jpyRate))})`;
    return prizeRaw;
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
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#080618]/40 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_40px_rgba(127,119,221,0.15)]"
      style={{ minHeight: "88px" }}
    >
      {/* 배경 단순화 */}
      <img src={bgImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.12]" />
      <div className="absolute inset-0 bg-[#080618]/40" />

      {/* 콘텐츠 */}
      <div className="relative z-10 flex items-center justify-between gap-6 px-8 py-6">
        {/* 왼쪽 — 뱃지 + 타이틀 + 메타 (한 컬럼 좌측 정렬) */}
        <div className="flex min-w-0 flex-1 items-center gap-5">
          {/* NOW OPEN 뱃지 */}
          <span className="shrink-0 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7F77DD]">
            <span className="text-[#7F77DD]">•</span>
            {["Open", "접수중", "In Review", "Voting"].includes(competition?.status ?? "")
              ? t("competition.banner.nowOpen", "Now Open")
              : ["Upcoming", "예정"].includes(competition?.status ?? "")
                ? t("competition.statusUpcoming", "Upcoming")
                : t("competition.statusClosed", "Closed")}
          </span>

          <div className="h-10 w-px shrink-0 bg-white/10" />

          {/* 타이틀 + 메타 한 컬럼 */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">{genre}</p>
              <span className="h-3 w-px bg-white/15" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                {t("competition.banner.featured", "Featured Contest")}
              </p>
            </div>
            <h3 className="mt-1 truncate text-xl font-bold text-white">{title}</h3>
            <div className="mt-1.5 flex items-center gap-3 text-[12px]">
              <span className="flex items-center gap-1.5 font-bold text-white/85">
                <svg className="h-3 w-3 text-[#AFA9EC]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span
                  style={{
                    backgroundImage: "linear-gradient(135deg, #FFE9B0 0%, #FFD478 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {prizeDisplayFinal}
                </span>
              </span>
              {daysLeft !== null && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="flex items-center gap-1.5 font-bold text-white/85">
                    <svg className="h-3 w-3 text-[#AFA9EC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round"/>
                    </svg>
                    <span className="text-[#D5D1FF]">D-{daysLeft}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽 CTA */}
        <div className="flex shrink-0 items-center gap-2.5">
          <Link
            href="/competition"
            className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-[13px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            {t("competition.banner.learnMore", "Learn More")}
          </Link>
          <Link
            href={competition?.id ? `/competition/${competition.id}` : "/competition"}
            className="rounded-lg px-5 py-2.5 text-[13px] font-bold text-white transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #534AB7 0%, #6B5FD4 100%)",
              boxShadow: "0 4px 16px rgba(83,74,183,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            {t("competition.banner.submitNow", "Submit Now →")}
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
      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/[0.06] hover:text-white/60"
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
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/60 transition hover:bg-white/[0.05] hover:text-white"
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
  } = props;
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { selectedGenre, setSelectedGenre } = useGenreFilter();
  const [selectedMood, setSelectedMood] = useState<string>("all");
  const moodBarRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  const videos = videosFromDb;
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
        <div className="-mt-16">
          <HeroBanner videos={videos} allVideos={videos} />
        </div>
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
          <AnimateIn delay={0.06}>
            <TrendingAITools videos={videos} />
          </AnimateIn>

          <AnimateIn delay={0.08}>
            <WhatsWorking videos={videos} />
          </AnimateIn>

          <AnimateIn delay={0.1}>
            <UploadCTA />
          </AnimateIn>
        </div>
      </div>

      <HeroInfoModal videos={videos} />
    </div>
  );
}
