"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Info,
  Medal,
  PlayCircle,
  Plus,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { useI18n } from "@/components/genova/language-provider";
import { MAIN_GENRE_KEYS, normalizeToMainGenre, mainGenreLabel } from "@/lib/constants/genres";
import { formatUploadedRelative } from "@/lib/format-uploaded-relative";
import { addWindowCustomListener } from "@/lib/dom/window-custom-events";
import type { Video } from "@/lib/types";
import Link from "next/link";
import { ContinueWatching } from "@/components/films/continue-watching";
import { cn } from "@/lib/utils/cn";
import { VideoCard } from "@/components/video/video-card";

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function startOfDayMs(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Submission deadline → D-day label; past midnight local day after deadline counts as ended. */
function filmsHeroDeadlineBadge(deadlineIso: string | null): { dDayLabel: string | null; ended: boolean } {
  if (!deadlineIso) return { dDayLabel: null, ended: false };
  const end = new Date(deadlineIso);
  if (Number.isNaN(end.getTime())) return { dDayLabel: null, ended: false };
  const diffDays = Math.round((startOfDayMs(end) - startOfDayMs(new Date())) / 86400000);
  if (diffDays > 0) return { dDayLabel: `D-${diffDays}`, ended: false };
  if (diffDays === 0) return { dDayLabel: "D-DAY", ended: false };
  return { dDayLabel: null, ended: true };
}

export type FilmsHeroFeaturedCompetition = {
  id: string;
  deadline: string | null;
};

export type FilmsHeroAwardSlotRank = "grand" | "excellence" | "merit" | "audience";

export type FilmsHeroAwardSlot = {
  rank: FilmsHeroAwardSlotRank;
  /** i18n key for tier label (e.g. 대상 / Grand Prize) */
  labelKey: string;
  eyebrowKey: string;
  Icon: LucideIcon;
  color: string;
  colorDark: string;
  cardBorder?: string;
  cardShadow?: string;
  video: Video | null;
};

function HeroBanner({
  awardWinners,
  allVideos,
  heroEyebrow,
  heroEyebrowKo,
  heroEyebrowEn,
  heroEyebrowJa,
  heroAwardVideos,
  heroFeaturedCompetition,
}: {
  awardWinners: (Video & { award?: string | null })[];
  allVideos: Video[];
  heroEyebrow: string;
  heroEyebrowKo: string;
  heroEyebrowEn: string;
  heroEyebrowJa: string;
  heroAwardVideos: {
    grandPrize: Video | null;
    excellence: Video | null;
    merit: Video | null;
    audience: Video | null;
  };
  heroFeaturedCompetition: FilmsHeroFeaturedCompetition | null;
}) {
  void awardWinners;
  void allVideos;
  const { t, locale } = useI18n();
  const eyebrowText =
    locale === "ko"
      ? heroEyebrowKo || heroEyebrowEn || heroEyebrow
      : locale === "ja"
        ? heroEyebrowJa || heroEyebrowEn || heroEyebrow
        : heroEyebrowEn || heroEyebrow;
  const heroDescLine1 = t("films.heroDescLine1");
  const heroDescLine2 = t("films.heroDescLine2");

  const competitionHref = heroFeaturedCompetition?.id ? `/competition/${heroFeaturedCompetition.id}` : "/competition";
  const { dDayLabel, ended } = filmsHeroDeadlineBadge(heroFeaturedCompetition?.deadline ?? null);

  const awardSlots: FilmsHeroAwardSlot[] = useMemo(
    () => [
      {
        rank: "grand",
        labelKey: "films.heroTierGrand",
        eyebrowKey: "competition.detail.prizeEyebrowGrand",
        Icon: Trophy,
        color: "#F5D182",
        colorDark: "#C8963E",
        video: heroAwardVideos.grandPrize,
      },
      {
        rank: "excellence",
        labelKey: "films.heroTierExcellence",
        eyebrowKey: "competition.detail.prizeEyebrowExcellence",
        Icon: Award,
        color: "rgba(255,255,255,0.9)",
        colorDark: "rgba(192,192,192,0.6)",
        cardBorder: "1px solid rgba(192,192,192,0.22)",
        cardShadow: "0 0 20px rgba(255,255,255,0.06)",
        video: heroAwardVideos.excellence,
      },
      {
        rank: "merit",
        labelKey: "films.heroTierMerit",
        eyebrowKey: "films.slotEyebrowMerit",
        Icon: Medal,
        color: "#CD7F32",
        colorDark: "#A66A3D",
        video: heroAwardVideos.merit,
      },
      {
        rank: "audience",
        labelKey: "films.heroTierAudience",
        eyebrowKey: "films.slotEyebrowAudience",
        Icon: Star,
        color: "#AFA9EC",
        colorDark: "#7F77DD",
        video: heroAwardVideos.audience,
      },
    ],
    [heroAwardVideos],
  );

  return (
    <div
      className="relative w-full overflow-hidden bg-[#04020c]"
      style={{
        minHeight: "auto",
        zIndex: 10,
        position: "relative",
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0617] via-[#06040f] to-[#06040f]" />
        <div
          className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(127,119,221,0.08) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>
      <div className="relative z-30 mx-auto flex w-full max-w-[1680px] flex-col gap-8 px-12 pb-8 pt-12">
        <div className="mb-2 flex flex-col gap-6 lg:mb-0 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
          <div className="max-w-2xl text-left">
            <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-[#AFA9EC]">✦ {eyebrowText}</p>
            <h1 className="mb-2 text-[clamp(2rem,3.5vw,3.5rem)] font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(127,119,221,0.2)]">
              {t("films.heroAwardGalleryTitle")}
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed text-white/55">
              {heroDescLine1} {heroDescLine2}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 lg:items-end">
            {heroFeaturedCompetition ? (
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                {!ended ? (
                  <>
                    <span className="text-emerald-400">●</span>
                    <span className="text-white/60">{t("films.heroCompetitionRunning")}</span>
                    {dDayLabel ? (
                      <>
                        <span className="text-white/30">·</span>
                        <span className="font-bold text-[#AFA9EC]">{dDayLabel}</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  <>
                    <span className="text-white/35">●</span>
                    <span className="text-white/50">{t("competition.statusClosed")}</span>
                  </>
                )}
              </div>
            ) : null}
            <Link
              href={competitionHref}
              className="inline-flex items-center gap-1 text-[12px] text-white/50 transition hover:text-white/80"
            >
              {t("films.heroViewAllWinners")}
            </Link>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {awardSlots.map((slot) => {
            const video = slot.video;
            const TierIcon = slot.Icon;
            const thumb = video?.thumbnailUrl?.trim();
            const cardBorder =
              slot.cardBorder ??
              (slot.colorDark.startsWith("#") ? `1px solid ${slot.colorDark}33` : "1px solid rgba(192,192,192,0.22)");
            const cardShadow =
              slot.cardShadow ??
              (slot.color.startsWith("#") ? `0 0 20px ${slot.color}14` : "0 0 20px rgba(175,169,236,0.12)");

            const cardClass = cn(
              "group relative overflow-hidden rounded-xl aspect-[16/10] ease-out",
              video
                ? "cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                : "cursor-default transition-all duration-300 hover:scale-[1.01]",
            );

            const dotGridBg =
              slot.colorDark.startsWith("#") && slot.colorDark.length >= 7
                ? `radial-gradient(circle, ${slot.colorDark}26 1px, transparent 1px)`
                : "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)";
            const orbTopBg =
              slot.color.startsWith("#") && slot.color.length >= 7
                ? `radial-gradient(circle, ${slot.color}33 0%, transparent 70%)`
                : "radial-gradient(circle, rgba(255,255,255,0.14) 0%, transparent 70%)";
            const orbBottomBg =
              slot.color.startsWith("#") && slot.color.length >= 7
                ? `radial-gradient(circle, ${slot.color}1a 0%, transparent 70%)`
                : "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)";
            const shimmerBg =
              slot.color.startsWith("#") && slot.color.length >= 7
                ? `linear-gradient(to right, transparent, ${slot.color}66 50%, transparent)`
                : "linear-gradient(to right, transparent, rgba(255,255,255,0.22) 50%, transparent)";

            const inner = (
              <>
                {thumb ? (
                  <>
                    <img
                      src={thumb}
                      alt={video?.title ?? ""}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(8,6,24,0.95) 0%, rgba(8,6,24,0.4) 50%, transparent 100%)",
                      }}
                    />
                  </>
                ) : null}

                {!video ? (
                  <>
                    <div
                      className="pointer-events-none absolute inset-0 z-[1]"
                      style={{
                        backgroundImage: dotGridBg,
                        backgroundSize: "16px 16px",
                        opacity: 0.4,
                      }}
                    />
                    <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center opacity-[0.05] transition-opacity duration-300 group-hover:opacity-[0.08]">
                      <TierIcon size={140} style={{ color: slot.color }} strokeWidth={1} />
                    </div>
                    <div
                      className="pointer-events-none absolute -right-12 -top-12 z-[2] h-40 w-40 rounded-full opacity-90 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
                      style={{
                        background: orbTopBg,
                        filter: "blur(40px)",
                      }}
                    />
                    <div
                      className="pointer-events-none absolute -bottom-8 -left-8 z-[2] h-32 w-32 rounded-full opacity-90 transition-all duration-300 group-hover:opacity-100"
                      style={{
                        background: orbBottomBg,
                        filter: "blur(30px)",
                      }}
                    />
                    <div
                      className="pointer-events-none absolute left-0 right-0 top-0 z-[3] h-px"
                      style={{ background: shimmerBg }}
                    />
                  </>
                ) : null}

                <div className="relative z-10 flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <TierIcon size={20} style={{ color: slot.color }} strokeWidth={1.75} />
                    {!video ? (
                      <span className="text-[9px] font-mono text-white/30">{t("films.heroComingSoonBadge")}</span>
                    ) : null}
                  </div>

                  <div className="mt-auto">
                    <p
                      className="mb-1 text-[10px] font-black uppercase tracking-[0.22em]"
                      style={{ color: slot.color }}
                    >
                      {t(slot.eyebrowKey)}
                    </p>
                    <p className="text-[18px] font-bold text-white">{t(slot.labelKey)}</p>

                    {video ? (
                      <>
                        <div className="mt-2 space-y-0.5">
                          <p className="line-clamp-1 text-[14px] font-semibold text-white">{video.title?.trim() || "—"}</p>
                          {(video.uploaderDisplayName ?? video.creatorName)?.trim() ? (
                            <p className="text-[11px] text-white/60">
                              {video.uploaderDisplayName ?? video.creatorName}
                            </p>
                          ) : null}
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-[11px] text-white/60 opacity-0 transition-opacity group-hover:opacity-100">
                          <PlayCircle className="h-3 w-3 shrink-0" strokeWidth={2} />
                          <span>{t("films.heroPlayCue")}</span>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </>
            );

            return video ? (
              <Link
                key={slot.rank}
                href={`/watch/${video.id}`}
                className={cardClass}
                style={{
                  background: thumb ? "transparent" : "linear-gradient(160deg, rgba(20,15,40,0.7) 0%, rgba(12,8,30,0.85) 100%)",
                  border: cardBorder,
                  boxShadow: cardShadow,
                }}
              >
                {inner}
              </Link>
            ) : (
              <Link
                key={slot.rank}
                href="#"
                className={cardClass}
                onClick={(e) => e.preventDefault()}
                style={{
                  background: "linear-gradient(160deg, rgba(20,15,40,0.7) 0%, rgba(12,8,30,0.85) 100%)",
                  border: cardBorder,
                  boxShadow: cardShadow,
                }}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#06040f]" />
    </div>
  );
}

function VideoRow({ title, videos }: { title: string; videos: (Video & { award?: string | null })[] }) {
  const { t, locale } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [arrowHovered, setArrowHovered] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
    if (!el) return;
    setAtEnd(el.scrollWidth <= el.offsetWidth);
  }, [videos]);

  if (videos.length === 0) return null;

  return (
    <div className="space-y-3 overflow-visible" style={{ position: "relative", zIndex: 0 }}>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#7F77DD]">✦</span>
        <h2 className="text-[22px] font-black tracking-tight text-white">
          {title}
        </h2>
        <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7F77DD] to-transparent" />
      </div>
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setArrowHovered(false);
        }}
      >
        {/* Cards scroll area with right margin */}
        <div className="mr-16">
          <div
            ref={scrollRef}
            onScroll={onScroll}
            style={{ overflowX: "auto", overflowY: "visible", paddingTop: "20px", paddingBottom: "20px", marginTop: "-20px", marginBottom: "-20px", paddingLeft: "0px", paddingRight: "60px", marginLeft: "0px", marginRight: "-60px" }}
            className="hide-scrollbar flex gap-4"
          >
            {videos.map((video) => (
              <div
                key={video.id}
                className={cn("shrink-0", arrowHovered ? "pointer-events-none" : "")}
                style={{ width: "calc((100% - 60px) / 6.9)", transformOrigin: "center center" }}
              >
                <VideoCard
                  video={video}
                  showRank={false}
                  showLikes={true}
                  showMadeWith={false}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Left click zone */}
        {!atStart && (
          <button
            type="button"
            onClick={() => scroll("left")}
            onMouseEnter={() => setArrowHovered(true)}
            onMouseLeave={() => setArrowHovered(false)}
            className={cn(
              "absolute left-0 top-0 bottom-0 z-[100]",
              "w-28",
              "flex items-center justify-center",
              "transition-all duration-200 group/arrow",
              isHovered ? "opacity-100" : "opacity-0",
              isHovered ? "pointer-events-auto" : "pointer-events-none"
            )}
            style={{
              background: "linear-gradient(to right, rgba(8,6,24,0.85) 0%, rgba(8,6,24,0.4) 60%, transparent 100%)"
            }}
          >
            <div className="flex h-full w-full items-center justify-center transition-all duration-200 group-hover/arrow:bg-black/20">
              <ChevronLeft
                size={50}
                className="text-white/70 group-hover/arrow:text-white transition-all duration-200 group-hover/arrow:scale-110"
                strokeWidth={1.5}
              />
            </div>
          </button>
        )}

        {/* Right click zone */}
        {!atEnd && (
          <button
            type="button"
            onClick={() => scroll("right")}
            onMouseEnter={() => setArrowHovered(true)}
            onMouseLeave={() => setArrowHovered(false)}
            className={cn(
              "absolute right-0 top-0 bottom-0 z-[100]",
              "w-28",
              "flex items-center justify-center",
              "transition-all duration-200 group/arrow",
              isHovered ? "opacity-100" : "opacity-0",
              isHovered ? "pointer-events-auto" : "pointer-events-none"
            )}
            style={{
              background: "linear-gradient(to left, rgba(8,6,24,0.85) 0%, rgba(8,6,24,0.4) 60%, transparent 100%)"
            }}
          >
            <div className="flex h-full w-full items-center justify-center transition-all duration-200 group-hover/arrow:bg-black/20">
              <ChevronRight
                size={50}
                className="text-white/70 group-hover/arrow:text-white transition-all duration-200 group-hover/arrow:scale-110"
                strokeWidth={1.5}
              />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

export function FilmsPageClient({
  originals,
  awardWinners,
  editorsPicks,
  genreSpotlight,
  allVideos,
  heroEyebrow,
  heroEyebrowKo,
  heroEyebrowEn,
  heroEyebrowJa,
  heroAwardVideos,
  heroFeaturedCompetition,
  continueWatchingItems,
  isLoggedIn,
}: {
  originals: Video[];
  awardWinners: (Video & { award?: string | null })[];
  editorsPicks: Video[];
  genreSpotlight: { genreKey: string; label: string; picks: Video[] }[];
  allVideos: Video[];
  heroEyebrow: string;
  heroEyebrowKo?: string;
  heroEyebrowEn?: string;
  heroEyebrowJa?: string;
  heroAwardVideos: {
    grandPrize: Video | null;
    excellence: Video | null;
    merit: Video | null;
    audience: Video | null;
  };
  heroFeaturedCompetition: FilmsHeroFeaturedCompetition | null;
  continueWatchingItems: { video: Video; progressSeconds: number; durationSeconds: number }[];
  isLoggedIn: boolean;
}) {
  const { t, locale } = useI18n();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [seriesExpanded, setSeriesExpanded] = useState(false);
  const [awardsExpanded, setAwardsExpanded] = useState(false);
  useEffect(() => {
    return addWindowCustomListener<string>("films-genre-select", (key) => {
      setSelectedGenres(key === "all" ? [] : [key]);

      setTimeout(() => {
        const el = document.getElementById("films-top10");
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 50);
    });
  }, []);

  const isAllSelected = selectedGenres.length === 0;

  const toggleGenre = (key: string) => {
    if (key === "all") {
      setSelectedGenres([]);
      return;
    }
    setSelectedGenres([key]);
  };

  const handleGenreClick = (key: string) => {
    toggleGenre(key);
    setTimeout(() => {
      const el = document.getElementById("films-genre-section");
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, 50);
  };

  const getTop10 = (videos: Video[], genreKey?: string) => {
    const filtered = genreKey
      ? videos.filter((v) => {
          const normalized = normalizeToMainGenre(v.genre);
          return normalized === genreKey;
        })
      : videos;
    return [...filtered]
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, 10);
  };

  const allVideosFlat = [
    ...allVideos,
    ...originals,
    ...awardWinners,
    ...editorsPicks,
    ...genreSpotlight.flatMap((g) => g.picks),
  ].filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i);

  const filteredVideos = useMemo(() => {
    if (isAllSelected) return allVideosFlat;
    return allVideosFlat.filter((v) => {
      const normalized = normalizeToMainGenre(v.genre);
      return normalized !== null && selectedGenres.includes(normalized);
    });
  }, [isAllSelected, selectedGenres, allVideosFlat]);

  return (
    <div className="relative min-h-screen pt-12">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "#06040f" }}
      />

      {/* Hero Banner - full width, extends behind navbar */}
      <AnimateIn delay={0.05}>
        <div className="-mt-16">
        <HeroBanner
          awardWinners={awardWinners}
          allVideos={allVideosFlat}
          heroEyebrow={heroEyebrow}
          heroEyebrowKo={heroEyebrowKo ?? ""}
          heroEyebrowEn={heroEyebrowEn ?? ""}
          heroEyebrowJa={heroEyebrowJa ?? ""}
          heroAwardVideos={heroAwardVideos}
          heroFeaturedCompetition={heroFeaturedCompetition}
        />
        </div>
      </AnimateIn>

      <div className="relative mx-auto max-w-[1680px] px-12 pb-24 pt-8 text-white space-y-10">
        <div className="mx-auto mb-6 h-px max-w-3xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        {/* Continue Watching */}
        <div id="films-continue" className="scroll-mt-20">
          <ContinueWatching
            items={continueWatchingItems}
            isLoggedIn={isLoggedIn}
          />
        </div>

        <AnimateIn delay={0.1}>
          <div id="films-genre-section" className="space-y-3 scroll-mt-20">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#7F77DD]">✦</span>
              <h2 className="text-[22px] font-black tracking-tight text-white">
                {t("films.browseByGenre")}
              </h2>
              <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7F77DD] to-transparent" />
            </div>
            <div className="mb-2 flex flex-wrap gap-2 py-3">
              {[{ key: "all" as const }, ...MAIN_GENRE_KEYS.map((k) => ({ key: k }))].map((tab) => {
                const mood = {
                  all: { emoji: "✦", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80" },
                  film: { emoji: "🎬", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80" },
                  animation: { emoji: "✨", image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80" },
                  music: { emoji: "🎵", image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80" },
                  daily: { emoji: "🌿", image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80" },
                  art: { emoji: "🎨", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80" },
                }[tab.key];

                const isActive = tab.key === "all" ? isAllSelected : selectedGenres.includes(tab.key);
                const titleCount = tab.key === "all"
                  ? allVideosFlat.length
                  : allVideosFlat.filter((v) => normalizeToMainGenre(v.genre) === tab.key).length;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleGenreClick(tab.key)}
                    className={cn(
                      "h-9 rounded-full border px-4 backdrop-blur-md transition-all duration-200",
                      "inline-flex items-center gap-2",
                      titleCount === 0 ? "opacity-60" : "",
                      isActive
                        ? "border-transparent bg-white text-[#080618]"
                        : "border-white/[0.08] bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/[0.15]"
                    )}
                  >
                    <span className={cn("text-sm", isActive ? "text-[#534AB7]" : "text-[#AFA9EC]")}>{mood.emoji}</span>
                    <span className={cn("text-sm font-medium", isActive ? "text-[#080618]" : "text-white")}>
                      {tab.key === "all" ? t("common.all") : mainGenreLabel(tab.key, locale)}
                    </span>
                    <span className={cn("text-xs", isActive ? "text-[#080618]/60" : "text-white/40")}>
                      ({titleCount})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </AnimateIn>

        {/* Content rows */}
        <div className="space-y-10">
          {filteredVideos.length === 0 ? (
            <p className="py-16 text-center text-sm text-white/45">{t("films.noVideosYet")}</p>
          ) : (
            <>
            {/* 전체 선택 시 — 전체 TOP 10 + 신작 */}
            {isAllSelected && (
              <>
                <AnimateIn delay={0.15}>
                  <VideoRow
                    title={t("films.top10All", "TOP 10")}
                    videos={[...filteredVideos]
                      .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
                      .slice(0, 10)}
                  />
                </AnimateIn>
                <AnimateIn delay={0.2}>
                  <VideoRow
                    title={t("films.newAll", "신작")}
                    videos={[...filteredVideos]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 15)}
                  />
                </AnimateIn>
              </>
            )}

            {/* 장르 선택 시에만 — Top 10 / New / Picks (깊은 탐색) */}
            {!isAllSelected && (
                <>
                  {selectedGenres.map((genreKey, idx) => {
                    const tabLabel = mainGenreLabel(genreKey, locale);
                    const top10 = getTop10(filteredVideos, genreKey);
                    if (top10.length === 0) return null;
                    return (
                      <AnimateIn key={genreKey} delay={0.15 + idx * 0.05}>
                        <div id={idx === 0 ? "films-top10" : undefined} className={idx === 0 ? "scroll-mt-20" : undefined}>
                          <VideoRow
                            title={t("films.top10InGenre").replace("{genre}", tabLabel)}
                            videos={top10}
                          />
                        </div>
                      </AnimateIn>
                    );
                  })}

                  <AnimateIn delay={0.2}>
                    <VideoRow
                      title={t("films.newGenreArrivals").replace(
                        "{genre}",
                        mainGenreLabel(selectedGenres[0], locale),
                      )}
                      videos={[...filteredVideos]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 15)}
                    />
                  </AnimateIn>

                </>
              )}
            </>
          )}
        </div>
        <AnimateIn delay={0.3}>
          <section className="mt-12">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] text-[#7F77DD]">✦</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: "#7F77DD", opacity: 0.75 }}>
                    {t("films.seriesSectionTitle")}
                  </p>
                </div>
                <h2 className="text-[26px] font-black tracking-tight text-white" style={{ letterSpacing: "-0.02em" }}>
                  {t("films.seriesSectionTitle")}
                </h2>
              </div>
              <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-bold text-white/60">
                {t("films.seriesComingSoonTag")}
              </span>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20 text-center">
              <p className="text-[14px] font-semibold text-white/50">{t("films.seriesEmptyTitle")}</p>
              <p className="mt-1 text-[12px] text-white/30">{t("films.seriesEmptyHint")}</p>
            </div>
          </section>
        </AnimateIn>
      </div>
    </div>
  );
}
