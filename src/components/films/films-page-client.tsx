"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { useI18n } from "@/components/genova/language-provider";
import { MAIN_GENRE_KEYS, normalizeToMainGenre, mainGenreLabel } from "@/lib/constants/genres";
import { addWindowCustomListener } from "@/lib/dom/window-custom-events";
import type { Video } from "@/lib/types";
import { ContinueWatching } from "@/components/films/continue-watching";
import { cn } from "@/lib/utils/cn";
import { VideoCard } from "@/components/video/video-card";

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
              background: "linear-gradient(to right, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.4) 60%, transparent 100%)"
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
              background: "linear-gradient(to left, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.4) 60%, transparent 100%)"
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
  continueWatchingItems,
  isLoggedIn,
}: {
  originals: Video[];
  awardWinners: (Video & { award?: string | null })[];
  editorsPicks: Video[];
  genreSpotlight: { genreKey: string; label: string; picks: Video[] }[];
  allVideos: Video[];
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
        style={{ background: "#111111" }}
      />

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
                        ? "border-transparent bg-white text-[#0a0a0a]"
                        : "border-white/[0.08] bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/[0.15]"
                    )}
                  >
                    <span className={cn("text-sm", isActive ? "text-[#534AB7]" : "text-[#AFA9EC]")}>{mood.emoji}</span>
                    <span className={cn("text-sm font-medium", isActive ? "text-[#0a0a0a]" : "text-white")}>
                      {tab.key === "all" ? t("common.all") : mainGenreLabel(tab.key, locale)}
                    </span>
                    <span className={cn("text-xs", isActive ? "text-[#0a0a0a]/60" : "text-white/35")}>
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
              <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-bold text-white/55">
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
