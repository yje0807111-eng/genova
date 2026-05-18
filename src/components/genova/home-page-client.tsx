"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Film } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Competition } from "@/lib/types";
import type { Video } from "@/lib/types";
import { useI18n } from "@/components/genova/language-provider";
import { useGenreFilter } from "@/components/genova/genre-filter-context";
import { ScrollReveal } from "@/components/scroll-reveal";
import { HomeGenreCarousel } from "@/components/genova/home-genre-carousel";
import { HoverPreviewCard } from "@/components/genova/hover-preview-card";
import { parseRuntimeToSeconds } from "@/components/video/video-card";
import { normalizeToMainGenre } from "@/lib/constants/genres";
import type { GenreFilter } from "@/lib/genova-genre";
// HomeCompetitionBanner is a client component (reads useI18n so the
// hero re-localizes instantly on language switch); the route page
// resolves its data props and threads it down via `competitionBannerSlot`.
import { HomeTabNav } from "@/components/genova/home-tab-nav";
import type { MainTab, SubGenre, SortKey } from "@/components/genova/home-tab-nav";
import { AwardsGallery } from "@/components/genova/awards-gallery";
import { HomeSeriesSection } from "@/components/genova/home-series-section";
import { HomeMobileFeed } from "@/components/genova/home-mobile-feed";

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
  /**
   * `<HomeCompetitionBanner>` — a client component (reads `useI18n` so
   * the hero re-localizes instantly on language switch).  Its data
   * props (competition / stats) are resolved in `src/app/page.tsx` and
   * it is threaded through here as a ReactNode slot.
   */
  competitionBannerSlot: ReactNode;
  /**
   * F4: server-rendered Films Beta 2 rails (Series / Award Winners /
   * Continue Watching).  Only populated when initialTab === "films".
   * Surfaced above the regular Films-tab grid when the user hasn't
   * narrowed via sub-genre filter or search — i.e. the default Films
   * landing view.
   */
  filmsRailsSlot?: ReactNode;
};

export function HomePageClient(props: HomePageClientProps) {
  const {
    videosFromDb,
    competition,
    heroAwardVideos,
    initialTab,
    competitionBannerSlot,
    filmsRailsSlot,
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
  const moodBarRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  const [allVideos, setAllVideos] = useState<Video[]>(videosFromDb);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(videosFromDb.length === 50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Re-seed feed/pagination when the server sends a new video set —
  // documented "store previous value, adjust during render" pattern
  // (replaces a setState-in-effect; identical [videosFromDb] trigger).
  const [prevVideosSource, setPrevVideosSource] = useState(videosFromDb);
  if (prevVideosSource !== videosFromDb) {
    setPrevVideosSource(videosFromDb);
    setAllVideos(videosFromDb);
    setPage(0);
    setHasMore(videosFromDb.length === 50);
  }

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
    // 상세정보 해시태그 클릭 → /?q=태그 로 진입 시 검색 프리필.
    const qParam = searchParams.get("q");
    if (qParam) setSearchQuery(qParam);

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
    // 태그는 저장 시 '#' 제거되므로 검색어의 선행 '#' 도 제거해
    // '#해시태그' 입력으로도 매칭되게 한다.
    const sqTag = sq.replace(/^#+/, "");
    if (sq) {
      result = videos.filter(
        (v) =>
          v.title.toLowerCase().includes(sq) ||
          (v.creatorName ?? "").toLowerCase().includes(sq) ||
          (v.uploaderDisplayName ?? "").toLowerCase().includes(sq) ||
          (v.tags ?? []).some((tag) =>
            tag.toLowerCase().includes(sqTag),
          ),
      );
    } else if (activeMainTab === "recommended") {
      const base = [...videos];
      if (activeSubGenre === "trending") {
        result = base.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
      } else if (activeSubGenre === "awards") {
        result = base.filter((v) => v.isFinalist || v.award);
      } else if (activeSubGenre === "entries") {
        result = base.filter((v) => v.purpose === "competition");
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
    <>
      <HomeMobileFeed videosFromDb={videosFromDb} />
      <div className="hidden min-h-screen bg-background md:block">
      <ScrollReveal delay={0.05}>{competitionBannerSlot}</ScrollReveal>

      <div data-content-start className="w-full space-y-2 px-6 pb-12 pt-4 sm:space-y-3 sm:px-8">
        <ScrollReveal delay={0.07}>
          <HomeGenreCarousel slides={carouselSlides} />
        </ScrollReveal>

        <ScrollReveal delay={0.09} className="relative z-[60]">
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
        </ScrollReveal>

        <ScrollReveal delay={0.11} className="relative z-0">
         <div className="min-h-[800px]">
          <div
            key={`${activeMainTab}:${activeSubGenre}:${activeSort}`}
            className="section-swap"
          >
          {/* F4: Films Beta 2 rails (Series / Award Winners / Continue
              Watching).  Only on the default Films landing view —
              hidden as soon as the user narrows via sub-genre filter
              or search, where the focused grid below is the point. */}
          {activeMainTab === "films" &&
            activeSubGenre === "all" &&
            !searchQuery.trim() &&
            filmsRailsSlot && (
              <div className="mb-10">{filmsRailsSlot}</div>
            )}
          {activeMainTab === "films" &&
          activeSubGenre === "series" &&
          !searchQuery.trim() ? (
            <HomeSeriesSection videos={videos} sort={activeSort} />
          ) : activeSubGenre === "awards" && activeMainTab === "recommended" ? (
            <AwardsGallery
              heroAwardVideos={heroAwardVideos ?? { grandPrize: null, excellence: null, merit: null, audience: null }}
              competitionTitle={competition?.title
                ? (locale === "ko" ? competition.titleKo : locale === "ja" ? competition.titleJa : competition.titleEn) ?? competition.title
                : t("awards.gallery.title", "Award Winners")}
            />
          ) : filteredVideos.length > 0 ? (
            <div className="section-swap-grid relative z-0 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filteredVideos.map((v) => (
                <HoverPreviewCard key={v.id} video={v} />
              ))}
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
         </div>
        </ScrollReveal>

        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isLoadingMore && (
              <div className="text-[12px] text-white/40">{t("home.loadingMore", "Loading more...")}</div>
            )}
          </div>
        )}

      </div>
    </div>
    </>
  );
}
