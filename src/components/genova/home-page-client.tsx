"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Film, Heart } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Competition } from "@/lib/types";
import type { Video } from "@/lib/types";
import { useI18n } from "@/components/genova/language-provider";
import { useGenreFilter } from "@/components/genova/genre-filter-context";
import { AnimateIn } from "@/components/animate-in";
import { HomeGenreCarousel } from "@/components/genova/home-genre-carousel";
import { parseRuntimeToSeconds } from "@/components/video/video-card";
import { HeroInfoModal } from "@/components/genova/hero-info-modal";
import { normalizeToMainGenre } from "@/lib/constants/genres";
import type { GenreFilter } from "@/lib/genova-genre";
import { HomeCompetitionBanner } from "@/components/genova/home-competition-banner";
import { HomeTabNav } from "@/components/genova/home-tab-nav";
import type { MainTab, SubGenre, SortKey } from "@/components/genova/home-tab-nav";
import { AwardsGallery } from "@/components/genova/awards-gallery";

function formatRuntimeDisplay(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

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

export function HomePageClient(props: HomePageClientProps) {
  const {
    videosFromDb,
    competitionDeadlineIso,
    competition,
    originals,
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
                          background: "var(--gradient-card-overlay)",
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
