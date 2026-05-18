"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Heart } from "lucide-react";
import type { Video } from "@/lib/types";
import { useI18n } from "@/components/genova/language-provider";
import { videoToCardProps } from "@/components/genova/video-card";
import { MAIN_GENRE_KEYS, normalizeToMainGenre } from "@/lib/constants/genres";

type MainTab = "films" | "competition";
type FilmsSub = "all" | "film" | "animation" | "music" | "art" | "daily" | "series";
type CompSub = "entries" | "awards";
type Sort = "latest" | "popular";

const MAIN_TAB_KEY: Record<MainTab, string> = {
  films: "homeTab.films",
  competition: "homeTab.competition",
};
const SUB_KEY: Record<string, string> = {
  all: "homeTab.subGenre.all",
  film: "homeTab.subGenre.film",
  animation: "homeTab.subGenre.animation",
  music: "homeTab.subGenre.music",
  art: "homeTab.subGenre.art",
  daily: "homeTab.subGenre.daily",
  series: "homeTab.subGenre.series",
  entries: "homeTab.subRec.entries",
  awards: "homeTab.subRec.awards",
};
const FILMS_SUBS: FilmsSub[] = [
  "all",
  "film",
  "animation",
  "music",
  "art",
  "daily",
  "series",
];
const COMP_SUBS: CompSub[] = ["entries", "awards"];

// 모바일 전용 홈 — 데스크톱의 탭/캐러셀/필름레일 복합 UI 대신
// "시청 진입 최단화" 1열 세로 피드(풀폭 가로 카드). md:hidden 분기.
export function HomeMobileFeed({ videosFromDb }: { videosFromDb: Video[] }) {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const [mainTab, setMainTab] = useState<MainTab>("films");
  const [filmsSub, setFilmsSub] = useState<FilmsSub>("all");
  const [compSub, setCompSub] = useState<CompSub>("entries");
  const sub: FilmsSub | CompSub = mainTab === "films" ? filmsSub : compSub;
  const [sort, setSort] = useState<Sort>("latest");
  // 상세정보 해시태그 클릭 → /?q=태그 진입 시 검색 프리필.
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  const [videos, setVideos] = useState<Video[]>(videosFromDb);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(videosFromDb.length === 50);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Re-seed feed/pagination when the server sends a new video set —
  // documented "store previous value, adjust during render" pattern
  // (replaces a setState-in-effect; identical [videosFromDb] trigger).
  const [prevSource, setPrevSource] = useState(videosFromDb);
  if (prevSource !== videosFromDb) {
    setPrevSource(videosFromDb);
    setVideos(videosFromDb);
    setPage(0);
    setHasMore(videosFromDb.length === 50);
  }

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const next = page + 1;
      const res = await fetch(`/api/videos?page=${next}`);
      const data = await res.json();
      if (data.videos?.length) {
        setVideos((prev) => {
          const seen = new Set(prev.map((v) => v.id));
          return [...prev, ...(data.videos as Video[]).filter((v) => !seen.has(v.id))];
        });
      }
      setPage(next);
      setHasMore(data.hasMore ?? false);
    } catch {
      /* keep current list on failure */
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) void loadMore();
      },
      { rootMargin: "800px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  const q = query.trim().toLowerCase();
  const matchesGenre = (v: Video) => {
    if (mainTab === "competition") {
      return compSub === "awards"
        ? Boolean(v.isFinalist || v.award)
        : v.purpose === "competition";
    }
    // films
    if (filmsSub === "all" || filmsSub === "series") return true;
    return normalizeToMainGenre(v.genre) === filmsSub;
  };
  // 태그 포함 + 선행 '#' 제거(태그는 저장 시 '#' 없음)로 해시태그
  // 검색 지원.
  const needle = q.replace(/^#+/, "");
  const matchesSearch = (v: Video) =>
    needle
      ? `${v.title ?? ""} ${v.creatorName ?? v.uploaderDisplayName ?? ""} ${v.seriesName ?? ""} ${(v.tags ?? []).join(" ")}`
          .toLowerCase()
          .includes(needle)
      : true;
  const sortFn = (a: Video, b: Video) =>
    sort === "popular"
      ? (b.viewCount ?? 0) - (a.viewCount ?? 0)
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

  const filtered = videos
    .filter(matchesGenre)
    .filter(matchesSearch)
    .slice()
    .sort(sortFn);

  // 시리즈 모드: seriesName 기준 그룹핑 + 합산 정렬(데스크톱과 동일).
  const seriesMode = mainTab === "films" && filmsSub === "series";
  const seriesGroups =
    seriesMode
      ? Array.from(
          filtered
            .filter((v) => Boolean(v.seriesName?.trim()))
            .reduce((m, v) => {
              const key = v.seriesName!.trim();
              if (!m.has(key)) m.set(key, []);
              m.get(key)!.push(v);
              return m;
            }, new Map<string, Video[]>())
            .entries(),
        )
          .map(([name, eps]) => {
            const episodes = [...eps].sort(
              (a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0),
            );
            const totalViews = episodes.reduce(
              (s, v) => s + (v.viewCount ?? 0),
              0,
            );
            const latestAt = episodes.reduce(
              (mx, v) => Math.max(mx, new Date(v.createdAt).getTime() || 0),
              0,
            );
            return { name, episodes, totalViews, latestAt };
          })
          .sort((a, b) =>
            sort === "popular"
              ? b.totalViews - a.totalViews
              : b.latestAt - a.latestAt,
          )
      : [];

  // "전체" + 검색 없음 → 데스크톱처럼 메인 장르별 섹션으로 정돈.
  // 특정 장르 칩 선택 시엔 단일 장르라 평탄 피드 유지.
  const groupByGenre = mainTab === "films" && filmsSub === "all" && !q;
  const genreGroups = groupByGenre
    ? (() => {
        const m = new Map<string, Video[]>();
        for (const v of filtered) {
          const k = normalizeToMainGenre(v.genre) || "other";
          if (!m.has(k)) m.set(k, []);
          m.get(k)!.push(v);
        }
        const known = MAIN_GENRE_KEYS.filter((k) => m.has(k));
        const extra = [...m.keys()].filter(
          (k) => !(MAIN_GENRE_KEYS as readonly string[]).includes(k),
        );
        return [...known, ...extra].map((k) => ({
          key: k,
          label: SUB_KEY[k] ? t(SUB_KEY[k]) : k,
          videos: m.get(k)!,
        }));
      })()
    : [];

  const subChips: (FilmsSub | CompSub)[] =
    mainTab === "films" ? FILMS_SUBS : COMP_SUBS;

  const renderCard = (v: Video) => {
    const cp = videoToCardProps(v, locale);
    const tag = v.seriesName
      ? { label: t("series.sectionLabel", "Series"), series: true }
      : v.purpose === "competition"
        ? { label: t("profile.submission", "Submission"), series: false }
        : null;
    return (
      <Link
        key={v.id}
        href={`/watch/${v.id}`}
        className="relative block aspect-video w-full overflow-hidden rounded-xl border border-white/[0.06]"
      >
        <Image src={cp.thumbnail} alt="" fill sizes="100vw" className="object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-card-overlay)" }}
        />
        {tag ? (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[10.5px] font-semibold text-white/90 backdrop-blur-md ring-1 ring-white/10">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: tag.series ? "#9D95F0" : "#F5C451",
                boxShadow: `0 0 6px ${
                  tag.series ? "rgba(157,149,240,0.8)" : "rgba(245,196,81,0.8)"
                }`,
              }}
              aria-hidden
            />
            {tag.label}
          </span>
        ) : null}
        {cp.duration ? (
          <span className="absolute right-2.5 top-2.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white/85 backdrop-blur-sm">
            {cp.duration}
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[14px] font-bold leading-tight text-white">
              {cp.title}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-[12px] text-white/55">
              <span className="min-w-0 flex-1 truncate">{cp.creator}</span>
              <span className="shrink-0 text-white/20">·</span>
              <span className="shrink-0 tabular-nums">
                {cp.views} {t("watch.views", "views")}
              </span>
              <span className="text-white/20">·</span>
              <span className="inline-flex shrink-0 items-center gap-0.5 tabular-nums">
                <Heart className="h-3 w-3" />
                {v.likeCount ?? 0}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="overflow-x-hidden md:hidden">
      {/* 검색 — 피드 내 실시간 필터 (제목·크리에이터) */}
      <div className="mx-4 mt-3 flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
        <Search size={16} className="shrink-0 text-white/40" />
        <input
          type="text"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search.placeholder", "Search videos")}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-white placeholder:text-white/35 outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="shrink-0 text-[12px] font-semibold text-white/40"
            aria-label="Clear"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* 메인 탭 — 필름 / 공모전 (데스크톱과 동일 분리) */}
      <div className="mt-4 flex items-center gap-2 px-4">
        {(["films", "competition"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMainTab(tab)}
            className={
              "rounded-full px-5 py-1.5 text-[13px] font-bold transition-colors " +
              (mainTab === tab
                ? "bg-white text-[#0a0a0a]"
                : "border border-white/[0.10] bg-white/[0.03] text-white/60")
            }
          >
            {t(MAIN_TAB_KEY[tab])}
          </button>
        ))}
      </div>

      {/* 하위 장르 칩 — 가로 스크롤 (선택된 메인 탭 기준) */}
      <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {subChips.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() =>
              mainTab === "films"
                ? setFilmsSub(c as FilmsSub)
                : setCompSub(c as CompSub)
            }
            className={
              "shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors " +
              (sub === c
                ? "bg-white text-[#0a0a0a]"
                : "border border-white/[0.10] bg-white/[0.03] text-white/60")
            }
          >
            {t(SUB_KEY[c])}
          </button>
        ))}
      </div>

      {/* 정렬 토글 */}
      <div className="mt-3 flex items-center gap-1.5 px-4">
        {(["latest", "popular"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            className={
              "rounded-full px-3 py-1 text-[11px] font-semibold transition-colors " +
              (sort === s ? "bg-white/10 text-white" : "text-white/40")
            }
          >
            {s === "latest"
              ? t("home.sortLatest", "Latest")
              : t("home.sortPopular", "Popular")}
          </button>
        ))}
      </div>

      {/* 시리즈 모드: 시리즈별 섹션 / 그 외: 1열 세로 피드 */}
      {seriesMode ? (
        <div className="flex flex-col gap-7 px-4 pb-10 pt-4">
          {seriesGroups.map((g) => (
            <section key={g.name}>
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className="h-5 w-1 shrink-0 rounded-full"
                  style={{
                    background:
                      "linear-gradient(180deg, #7F77DD 0%, #534AB7 100%)",
                  }}
                  aria-hidden
                />
                <h3 className="min-w-0 flex-1 truncate text-[15px] font-bold text-white">
                  {g.name}
                </h3>
                <span className="shrink-0 rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white/45">
                  {t("profile.episodesTotal", "{n} episodes").replace(
                    "{n}",
                    String(g.episodes.length),
                  )}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {g.episodes.map((v) => renderCard(v))}
              </div>
            </section>
          ))}
        </div>
      ) : groupByGenre ? (
        <div className="flex flex-col gap-7 px-4 pb-10 pt-4">
          {genreGroups.map((g) => (
            <section key={g.key}>
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className="h-5 w-1 shrink-0 rounded-full"
                  style={{
                    background:
                      "linear-gradient(180deg, #7F77DD 0%, #534AB7 100%)",
                  }}
                  aria-hidden
                />
                <h3 className="min-w-0 flex-1 truncate text-[15px] font-bold text-white">
                  {g.label}
                </h3>
                <span className="shrink-0 rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white/45">
                  {g.videos.length}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {g.videos.map((v) => renderCard(v))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5 px-4 pb-10 pt-4">
          {filtered.map((v) => renderCard(v))}
        </div>
      )}

      {(seriesMode ? seriesGroups.length === 0 : filtered.length === 0) ? (
        <p className="px-4 pb-12 text-center text-[13px] text-white/35">
          {seriesMode
            ? t("home.series.empty", "No series yet.")
            : t("home.emptyState", "No videos yet")}
        </p>
      ) : null}

      <div ref={sentinelRef} aria-hidden />
      {loading ? (
        <p className="pb-10 text-center text-[12px] text-white/30">
          {t("common.loading", "Loading…")}
        </p>
      ) : null}
    </div>
  );
}
