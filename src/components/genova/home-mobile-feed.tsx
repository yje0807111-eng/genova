"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import type { Video } from "@/lib/types";
import { useI18n } from "@/components/genova/language-provider";
import { VideoCardFromVideo } from "@/components/genova/video-card";
import { MAIN_GENRE_KEYS, MAIN_GENRE_LABELS, normalizeToMainGenre } from "@/lib/constants/genres";

type GenreChip = "all" | (typeof MAIN_GENRE_KEYS)[number];
type Sort = "latest" | "popular";

// 모바일 전용 홈 — 데스크톱의 탭/캐러셀/필름레일 복합 UI 대신
// "시청 진입 최단화" 세로 피드. md:hidden 으로 분기(데스크톱은 기존 유지).
export function HomeMobileFeed({ videosFromDb }: { videosFromDb: Video[] }) {
  const { t } = useI18n();
  const [genre, setGenre] = useState<GenreChip>("all");
  const [sort, setSort] = useState<Sort>("latest");

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
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  const filtered = videos
    .filter((v) => (genre === "all" ? true : normalizeToMainGenre(v.genre) === genre))
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
    <div className="md:hidden">
      {/* 공모전 진입 스트립 — 모바일은 시청·공모전 시청 중심 */}
      <Link
        href="/competition"
        className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3"
      >
        <span className="flex items-center gap-2.5">
          <Trophy size={16} className="text-[#AFA9EC]" />
          <span className="text-[13px] font-bold text-white">
            {t("nav.competition", "Competition")}
          </span>
        </span>
        <span className="text-[12px] font-semibold text-white/45">
          {t("competition.detail.viewDetailsCta", "View →")}
        </span>
      </Link>

      {/* 장르 칩 — 가로 스크롤 (줄바꿈으로 세로 점유 안 함) */}
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

      {/* 세로 피드 — 2열 */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-10 pt-4">
        {filtered.map((v) => (
          <VideoCardFromVideo key={v.id} video={v} />
        ))}
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
