"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnimateIn } from "@/components/animate-in";
import { useI18n } from "@/components/genova/language-provider";
import { HighlightText } from "@/components/ui/highlight-text";
import { trackHashtagEvent } from "@/lib/hashtags/client-track";
import { formatGenreDisplay } from "@/lib/constants/genres";
import type { SearchProfile, SearchSortMode, SearchGenreMatch } from "@/lib/queries/search-queries";
import type { Video } from "@/lib/types";

type ResultTab = "all" | "videos" | "creators" | "tags";

function buildSearchHref(q: string, tab: ResultTab, sort: SearchSortMode): string {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (tab !== "all") p.set("tab", tab);
  if (sort !== "relevance") p.set("sort", sort);
  const s = p.toString();
  return s ? `/search?${s}` : "/search";
}

export type SearchPageBodyProps = {
  q: string;
  hashtagQuery?: string | null;
  tab: ResultTab;
  sort: SearchSortMode;
  empty: boolean;
  videos: Video[];
  profiles: SearchProfile[];
  tags: string[];
  genreMatch: SearchGenreMatch | null;
  fallback: { videos: Video[]; genreSuggestions: SearchGenreMatch[] } | null;
  globalEmpty: boolean;
};

export function SearchPageBody({
  q,
  hashtagQuery,
  tab,
  sort,
  empty,
  videos,
  profiles,
  tags,
  genreMatch,
  fallback,
  globalEmpty,
}: SearchPageBodyProps) {
  const { t } = useI18n();
  useEffect(() => {
    if (!hashtagQuery) return;
    trackHashtagEvent(hashtagQuery, "search");
  }, [hashtagQuery]);

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 text-white">
      <div className="mx-auto max-w-[1400px] space-y-5">
        {!empty && genreMatch && (
          <AnimateIn delay={0.05}>
            <Link
              href={`/genre/${genreMatch.slug}`}
              className="flex items-center justify-between rounded-2xl border border-[#7F77DD]/20 px-6 py-4 transition hover:border-[#7F77DD]/40"
              style={{ background: "rgba(83,74,183,0.1)" }}
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#7F77DD]/60">
                  {t("search.browseByGenreEyebrow")}
                </p>
                <p className="mt-0.5 text-lg font-black text-white">{genreMatch.label}</p>
              </div>
              <span className="text-[#7F77DD]">{t("search.viewAllGenres")}</span>
            </Link>
          </AnimateIn>
        )}

        {!empty && (
          <div className="space-y-3">
            {hashtagQuery && (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#7F77DD]/30 bg-[#534AB7]/20 px-4 py-1.5 text-xs font-semibold text-[#C8C3F7]">
                <span className="text-[#EEEDFE]">현재 해시태그 검색 중:</span>
                <span className="rounded-full bg-[#7F77DD]/25 px-2.5 py-0.5 text-[#EEEDFE]">#{hashtagQuery}</span>
                <Link
                  href={buildSearchHref(q, "all", sort)}
                  aria-label="해시태그 검색 해제"
                  className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#AFA9EC]/30 text-[#EEEDFE] transition hover:border-[#EEEDFE]/60 hover:bg-white/10"
                >
                  <svg viewBox="0 0 20 20" aria-hidden className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                  </svg>
                </Link>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <div
                className="flex gap-1 rounded-xl p-1"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
              {(
                [
                  ["all", "search.tabAll"],
                  ["videos", "search.tabFilms"],
                  ["creators", "search.tabCreators"],
                  ["tags", "search.tabTags"],
                ] as const
              ).map(([key, labelKey]) => (
                <Link
                  key={key}
                  href={buildSearchHref(q, key as ResultTab, sort)}
                  className="rounded-lg px-4 py-1.5 text-sm font-semibold transition-all duration-200"
                  style={{
                    background: tab === key
                      ? "linear-gradient(135deg, rgba(83,74,183,0.6) 0%, rgba(107,95,212,0.5) 100%)"
                      : "transparent",
                    border: tab === key ? "1px solid rgba(127,119,221,0.4)" : "1px solid transparent",
                    color: tab === key ? "#AFA9EC" : "rgba(255,255,255,0.35)",
                    boxShadow: tab === key ? "0 2px 8px rgba(83,74,183,0.3)" : "none",
                  }}
                >
                  {t(labelKey)}
                </Link>
              ))}
              </div>

              <div className="flex gap-1">
              {(
                [
                  ["relevance", "search.sortRelevance"],
                  ["latest", "search.sortLatest"],
                  ["likes", "search.sortMostLiked"],
                ] as const
              ).map(([key, labelKey]) => (
                <Link
                  key={key}
                  href={buildSearchHref(q, tab, key as SearchSortMode)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200"
                  style={{
                    background: sort === key ? "rgba(83,74,183,0.2)" : "transparent",
                    border: `1px solid ${sort === key ? "rgba(127,119,221,0.3)" : "rgba(255,255,255,0.06)"}`,
                    color: sort === key ? "#AFA9EC" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {t(labelKey)}
                </Link>
              ))}
              </div>
            </div>
          </div>
        )}

        {!empty && !fallback && (tab === "all" || tab === "videos") && videos.length > 0 && (
          <AnimateIn delay={0.1}>
            <section className="space-y-4">
              <h2 className="text-[20px] font-bold text-white tracking-tight">
                {t("search.sectionFilms")}
                <span className="ml-2 inline-block h-[3px] w-6 rounded-full bg-[#7F77DD] align-middle" />
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {videos.map((v) => (
                  <Link
                    key={v.id}
                    href={`/watch/${v.id}`}
                    className="group/card relative block cursor-pointer overflow-hidden rounded-xl border border-white/[0.08] transition-all duration-300 hover:scale-[1.03] hover:border-[#7F77DD]/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
                  >
                    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      <img
                        src={v.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                      />
                      <div
                        className="absolute inset-x-0 bottom-0 z-[1]"
                        style={{
                          height: "80%",
                          background: "linear-gradient(to top, rgba(8,6,24,1) 0%, rgba(8,6,24,0.9) 30%, transparent 100%)",
                        }}
                      />
                      <div className="absolute left-2 top-2 z-[2]">
                        <span
                          className="rounded px-2 py-0.5 text-[10px] font-semibold text-white/90"
                          style={{
                            background: "linear-gradient(135deg, rgba(83,74,183,0.7) 0%, rgba(39,33,92,0.5) 100%)",
                            backdropFilter: "blur(4px)",
                            border: "1px solid rgba(127,119,221,0.25)",
                          }}
                        >
                          {formatGenreDisplay(v.genre, v.subGenre)}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 z-[3] px-3 pb-2.5">
                        <h3 className="line-clamp-1 text-[13px] font-bold text-white">
                          <HighlightText text={v.title} query={q} />
                        </h3>
                        <div className="mt-0.5 flex items-center justify-between">
                          <p className="text-[11px] text-white/40">♥ {v.likeCount ?? 0}</p>
                          {v.viewCount != null && (
                            <p className="text-[11px] text-white/30">
                              {v.viewCount >= 1000 ? `${(v.viewCount / 1000).toFixed(1)}K` : v.viewCount}{" "}
                              {t("search.viewsWord")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </AnimateIn>
        )}

        {!empty && !fallback && (tab === "all" || tab === "creators") && profiles.length > 0 && (
          <AnimateIn delay={0.12}>
            <section className="space-y-4">
              <h2 className="text-[20px] font-bold text-white tracking-tight">
                {t("search.sectionCreators")}
                <span className="ml-2 inline-block h-[3px] w-6 rounded-full bg-[#7F77DD] align-middle" />
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {profiles.map((p) => (
                  <Link
                    key={p.id}
                    href={`/profile/${p.id}`}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.08] p-4 transition hover:border-[#7F77DD]/30 hover:bg-white/[0.03]"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <div
                      className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10"
                      style={{ boxShadow: "0 0 0 2px rgba(83,74,183,0.3)" }}
                    >
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-white/40 bg-[#26215C]">?</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">
                        <HighlightText text={p.displayName ?? t("search.userFallback")} query={q} />
                      </p>
                      <p className="text-[11px] text-white/40">
                        {p.followerCount} {t("search.followersWord")}
                      </p>
                      {p.bio && <p className="mt-0.5 line-clamp-1 text-[11px] text-white/30">{p.bio}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </AnimateIn>
        )}

        {!empty && !fallback && (tab === "all" || tab === "tags") && tags.length > 0 && (
          <section id="search-tags-section" className="scroll-mt-24 space-y-4">
            <h2 className="text-[20px] font-bold text-white tracking-tight">
              {t("search.sectionTags")}
              <span className="ml-2 inline-block h-[3px] w-6 rounded-full bg-[#7F77DD] align-middle" />
            </h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}&tab=tags#search-tags-section`}
                  onClick={() => trackHashtagEvent(tag, "click")}
                  className="rounded-full border border-[#7F77DD]/25 bg-[#534AB7]/20 px-4 py-2 text-sm font-medium text-[#AFA9EC] transition hover:border-[#7F77DD]/50 hover:bg-[#534AB7]/30"
                >
                  <HighlightText text={`#${tag}`} query={q} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {!empty && !fallback && globalEmpty && (
          <div
            className="rounded-2xl border border-white/[0.06] py-20 text-center"
            style={{ background: "linear-gradient(135deg, rgba(26,21,71,0.4) 0%, rgba(15,13,36,0.6) 100%)" }}
          >
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "rgba(83,74,183,0.2)", border: "1px solid rgba(127,119,221,0.2)" }}
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#7F77DD]/60" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </div>
            <p className="text-lg font-black text-white">{t("search.noResultsLine").replace("{q}", q)}</p>
            <p className="mt-1 text-sm text-white/35">{t("search.tryOtherKeywords")}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {(
                [
                  ["film", "search.genreChipFilm"],
                  ["animation", "search.genreChipAnimation"],
                  ["music", "search.genreChipMusic"],
                  ["daily", "search.genreChipDaily"],
                  ["art", "search.genreChipArt"],
                ] as const
              ).map(([slug, labelKey]) => (
                <Link
                  key={slug}
                  href={`/genre/${slug}`}
                  className="rounded-full border border-[#7F77DD]/20 bg-[#534AB7]/15 px-4 py-2 text-sm text-[#AFA9EC] transition hover:bg-[#534AB7]/25"
                >
                  {t(labelKey)}
                </Link>
              ))}
            </div>
          </div>
        )}

        {!empty && fallback && (
          <section className="space-y-5">
            <div>
              <h2 className="text-[20px] font-bold text-white">{t("search.youMayAlsoLike")}</h2>
              <p className="mt-0.5 text-sm text-white/35">{t("search.popularFilmsInstead")}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {fallback.videos.map((v) => (
                <Link
                  key={v.id}
                  href={`/watch/${v.id}`}
                  className="group/card relative block overflow-hidden rounded-xl border border-white/[0.08] transition hover:scale-[1.03] hover:border-[#7F77DD]/40"
                >
                  <div className="relative aspect-video w-full overflow-hidden">
                    <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover transition group-hover/card:scale-105" />
                    <div className="absolute inset-x-0 bottom-0 z-[1]" style={{ height: "60%", background: "linear-gradient(to top, rgba(8,6,24,1) 0%, transparent 100%)" }} />
                    <p className="absolute bottom-2 left-3 right-3 z-[2] line-clamp-1 text-[13px] font-bold text-white">{v.title}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {fallback.genreSuggestions.map((g) => (
                <Link
                  key={g.slug}
                  href={`/genre/${g.slug}`}
                  className="rounded-full border border-[#7F77DD]/25 bg-[#534AB7]/20 px-4 py-2 text-sm text-[#AFA9EC] transition hover:bg-[#534AB7]/30"
                >
                  {g.label}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
