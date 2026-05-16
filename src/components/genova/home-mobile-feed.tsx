"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import type { Video } from "@/lib/types";
import { useI18n } from "@/components/genova/language-provider";
import { videoToCardProps } from "@/components/genova/video-card";
import { MAIN_GENRE_KEYS, MAIN_GENRE_LABELS, normalizeToMainGenre } from "@/lib/constants/genres";
import { ScrollReveal } from "@/components/scroll-reveal";

type GenreChip = "all" | (typeof MAIN_GENRE_KEYS)[number];
type Sort = "latest" | "popular";

// 모바일 전용 홈 — 데스크톱의 탭/캐러셀/필름레일 복합 UI 대신
// "시청 진입 최단화" 1열 세로 피드(풀폭 가로 카드). md:hidden 분기.
export function HomeMobileFeed({ videosFromDb }: { videosFromDb: Video[] }) {
  const { t, locale } = useI18n();
  const [genre, setGenre] = useState<GenreChip>("all");
  const [sort, setSort] = useState<Sort>("latest");
  const [query, setQuery] = useState("");

  const [videos, setVideos] = useState<Video[]>(videosFromDb);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(videosFromDb.length === 50);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVideos(videosFromDb);
    setPage(0);
    setHasMore(videosFromDb.length === 50);
  }, [videosFromDb]);

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
  const filtered = videos
    .filter((v) => (genre === "all" ? true : normalizeToMainGenre(v.genre) === genre))
    .filter((v) =>
      q
        ? `${v.title ?? ""} ${v.creatorName ?? v.uploaderDisplayName ?? ""}`
            .toLowerCase()
            .includes(q)
        : true,
    )
    .slice()
    .sort((a, b) =>
      sort === "popular"
        ? (b.viewCount ?? 0) - (a.viewCount ?? 0)
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const chips: { key: GenreChip; label: string }[] = [
    { key: "all", label: t("home.filterAll", "All") },
    ...MAIN_GENRE_KEYS.map((k) => ({ key: k, label: MAIN_GENRE_LABELS[k] })),
  ];

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

      {/* 장르 칩 — 가로 스크롤 */}
      <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setGenre(c.key)}
            className={
              "shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors " +
              (genre === c.key
                ? "bg-white text-[#0a0a0a]"
                : "border border-white/[0.10] bg-white/[0.03] text-white/60")
            }
          >
            {c.label}
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

      {/* 1열 세로 피드 — 풀폭 가로 카드 */}
      <div className="flex flex-col gap-5 px-4 pb-10 pt-4">
        {filtered.map((v, i) => {
          const cp = videoToCardProps(v, locale);
          return (
            <ScrollReveal key={v.id} delay={Math.min(i, 6) * 0.05}>
            <Link href={`/watch/${v.id}`} className="block">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/[0.06]">
                <Image
                  src={cp.thumbnail}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
                {cp.duration ? (
                  <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    {cp.duration}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex items-start gap-2.5">
                {cp.avatar ? (
                  <span className="relative mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full">
                    <Image src={cp.avatar} alt="" fill sizes="32px" className="object-cover" />
                  </span>
                ) : null}
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-white">
                    {cp.title}
                  </h3>
                  <p className="mt-1 text-[12px] text-white/45">
                    {cp.creator}
                    {cp.views ? ` · ${cp.views}` : ""}
                  </p>
                </div>
              </div>
            </Link>
            </ScrollReveal>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 pb-12 text-center text-[13px] text-white/35">
          {t("home.emptyState", "No videos yet")}
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
