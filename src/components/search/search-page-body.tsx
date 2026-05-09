"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnimateIn } from "@/components/animate-in";
import { useI18n } from "@/components/genova/language-provider";
import { VideoCard, VideoCardFromVideo } from "@/components/genova/video-card";
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
  const totalResultCount = videos.length + profiles.length + tags.length;
  useEffect(() => {
    if (!hashtagQuery) return;
    trackHashtagEvent(hashtagQuery, "search");
  }, [hashtagQuery]);

  useEffect(() => {
    if (!hashtagQuery && tab !== "tags") return;
    const el = document.getElementById("search-tags-section");
    if (!el) return;
    setTimeout(() => {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }, 300);
  }, [hashtagQuery, tab]);

  return (
    <div className="min-h-screen text-white">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-white/[0.05]">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -left-20 top-0 h-[400px] w-[600px] rounded-full opacity-60"
            style={{
              background: "radial-gradient(ellipse, rgba(127,119,221,0.25) 0%, transparent 65%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute -right-20 top-10 h-[300px] w-[500px] rounded-full opacity-50"
            style={{
              background: "radial-gradient(circle, rgba(83,74,183,0.2) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
        </div>
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: "linear-gradient(to right, transparent, rgba(127,119,221,0.4) 30%, rgba(175,169,236,0.25) 60%, transparent)",
          }}
        />
        <div className="relative mx-auto max-w-[1600px] px-6 pt-12 pb-10 sm:px-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30">
            Search
          </p>
          <div className="mt-3 flex items-baseline gap-4 flex-wrap">
            <h1 className="bg-gradient-to-br from-white via-white to-[#AFA9EC] bg-clip-text pb-2 text-[64px] font-black tracking-[-0.04em] leading-[1.1] text-transparent sm:text-[80px]" style={{ animation: "search-pulse 4s ease-in-out infinite" }}>
              {q || "Discover"}
            </h1>
            {!empty && (
              <span className="text-[16px] font-medium text-white/35">
                {totalResultCount} {totalResultCount === 1 ? "result" : "results"}
              </span>
            )}
          </div>
          {empty && (
            <p className="mt-3 text-[14px] text-white/40">
              Type to search films, creators, and tags.
            </p>
          )}

          {hashtagQuery && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#7F77DD]/25 bg-[#534AB7]/15 px-3 py-1 text-[11px] font-medium text-[#C8C3F7]">
              <span className="text-[#AFA9EC]">#</span>
              <span>{hashtagQuery}</span>
              <Link
                href={buildSearchHref(q, "all", sort)}
                className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-white/50 transition hover:text-white"
              >
                <svg viewBox="0 0 20 20" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 sm:px-10">
        {/* Discover (empty state) */}
        {empty && (
          <div className="space-y-16 py-12">
            <AnimateIn delay={0.1}>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7F77DD]/70">
                  ✦ Discover
                </p>
                <h2 className="text-[28px] font-bold tracking-[-0.02em] text-white">
                  Browse by Genre
                </h2>
                <p className="mt-1 text-[13px] text-white/35">5 curated genres of AI cinema</p>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {([
                    { slug: "film", label: "Film", grad: "from-[#7F77DD]/20 via-[#534AB7]/10 to-transparent" },
                    { slug: "animation", label: "Animation", grad: "from-[#AFA9EC]/20 via-[#7F77DD]/10 to-transparent" },
                    { slug: "music", label: "Music", grad: "from-[#534AB7]/25 via-[#26215C]/15 to-transparent" },
                    { slug: "daily", label: "Daily", grad: "from-[#7F77DD]/15 via-[#AFA9EC]/10 to-transparent" },
                    { slug: "art", label: "Art", grad: "from-[#AFA9EC]/25 via-[#534AB7]/15 to-transparent" },
                  ] as const).map(({ slug, label, grad }, i) => (
                    <Link
                      key={slug}
                      href={`/genre/${slug}`}
                      className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br ${grad} p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[#7F77DD]/40 hover:shadow-[0_20px_60px_rgba(127,119,221,0.35)]`}
                      style={{
                        animation: `fade-in-up 0.6s ease-out ${i * 0.08}s both`,
                      }}
                    >
                      <div
                        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{
                          background: "radial-gradient(circle, rgba(127,119,221,0.4) 0%, transparent 70%)",
                          filter: "blur(30px)",
                        }}
                      />
                      <div
                        className="pointer-events-none absolute inset-0 opacity-30"
                        style={{
                          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
                          backgroundSize: "16px 16px",
                        }}
                      />
                      <div className="relative">
                        <span className="text-[14px] text-[#AFA9EC] transition group-hover:text-white">✦</span>
                        <p className="mt-3 text-[18px] font-bold text-white transition group-hover:text-[#AFA9EC]">
                          {label}
                        </p>
                        <span className="mt-2 inline-block text-[11px] font-medium uppercase tracking-wider text-white/30 transition group-hover:text-[#AFA9EC]/70">
                          Explore →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </AnimateIn>

            {fallback && fallback.videos.length > 0 && (
              <AnimateIn delay={0.25}>
                <section>
                  <div className="mb-5 flex items-baseline gap-3">
                    <span className="text-[10px] text-[#7F77DD]">✦</span>
                    <h2 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-white">
                      Trending Now
                    </h2>
                    <span className="text-[11px] text-white/30">{fallback.videos.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {fallback.videos.map((v) => (
                    <Link key={v.id} href={`/watch/${v.id}`} className="group block">
                      <div
                        className="relative w-full overflow-hidden rounded-md bg-white/[0.03] transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_20px_60px_rgba(127,119,221,0.4)]"
                        style={{ aspectRatio: "16/9" }}
                      >
                        <img
                          src={v.thumbnailUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                        />
                        <div
                          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                          style={{
                            background: "linear-gradient(180deg, transparent 50%, rgba(83,74,183,0.3) 100%)",
                          }}
                        />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/[0.06] transition duration-500 group-hover:ring-[#7F77DD]/50 rounded-md" />
                      </div>
                      <div className="mt-3 px-0.5">
                        <h3 className="line-clamp-1 text-[13px] font-semibold text-white transition group-hover:text-[#AFA9EC]">
                          {v.title}
                        </h3>
                        <p className="mt-1 text-[11px] text-white/35">
                          {formatGenreDisplay(v.genre, v.subGenre)}
                        </p>
                      </div>
                    </Link>
                  ))}
                  </div>
                </section>
              </AnimateIn>
            )}
          </div>
        )}

        {/* Tabs + Sort */}
        {!empty && (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/[0.05] bg-[#080618]/80 py-4 backdrop-blur-xl">
            <div className="flex items-center gap-6">
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
                  className={
                    tab === key
                      ? "relative text-[13px] font-semibold text-white pb-1 after:absolute after:left-0 after:right-0 after:-bottom-[17px] after:h-[2px] after:bg-gradient-to-r after:from-white after:via-[#AFA9EC] after:to-[#7F77DD] after:transition-all after:duration-300"
                      : "text-[13px] font-medium text-white/35 transition-all duration-300 hover:text-white/80"
                  }
                >
                  {t(labelKey)}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-1 text-[11px]">
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
                  className={
                    sort === key
                      ? "rounded-full bg-white/10 px-3 py-1 font-semibold text-white"
                      : "rounded-full px-3 py-1 font-medium text-white/35 transition hover:text-white/70"
                  }
                >
                  {t(labelKey)}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-14 py-10">
          {/* Genre suggestion */}
          {!empty && genreMatch && (
            <AnimateIn delay={0.05}>
              <Link
                href={`/genre/${genreMatch.slug}`}
                className="group flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3 transition hover:border-[#7F77DD]/30 hover:bg-[#534AB7]/10"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                    Genre
                  </span>
                  <span className="text-[13px] font-semibold text-white">{genreMatch.label}</span>
                </div>
                <span className="text-[11px] text-white/40 group-hover:text-[#AFA9EC]">→</span>
              </Link>
            </AnimateIn>
          )}

          {/* Films */}
          {!empty && (tab === "all" || tab === "videos" || hashtagQuery) && videos.length > 0 && (
            <AnimateIn delay={0.1}>
              <section>
                <div className="mb-5 flex items-baseline gap-3">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-white">
                    {t("search.sectionFilms")}
                  </h2>
                  <span className="text-[11px] text-white/30">{videos.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {videos.map((v) => (
                    <Link
                      key={v.id}
                      href={`/watch/${v.id}`}
                      className="group block"
                    >
                      <div
                        className="relative w-full overflow-hidden rounded-md bg-white/[0.03] transition-all duration-500 group-hover:shadow-[0_20px_60px_rgba(127,119,221,0.4)] group-hover:-translate-y-1"
                        style={{ aspectRatio: "16/9" }}
                      >
                        <img
                          src={v.thumbnailUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                        />
                        <div
                          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                          style={{
                            background: "linear-gradient(180deg, transparent 50%, rgba(83,74,183,0.3) 100%)",
                          }}
                        />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/[0.06] transition duration-500 group-hover:ring-[#7F77DD]/50 rounded-md" />
                      </div>
                      <div className="mt-3 px-0.5">
                        <h3 className="line-clamp-1 text-[13px] font-semibold text-white transition group-hover:text-[#AFA9EC]">
                          <HighlightText text={v.title} query={q} />
                        </h3>
                        <p className="text-[11px] font-medium text-white/50 truncate">
                          {v.creatorName ?? v.uploaderDisplayName ?? "—"}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-white/45">
                          <span>{formatGenreDisplay(v.genre, v.subGenre)}</span>
                          <span className="text-white/15">·</span>
                          <span>♥ {v.likeCount ?? 0}</span>
                          {v.viewCount != null && (
                            <>
                              <span className="text-white/15">·</span>
                              <span>
                                {v.viewCount >= 1000 ? `${(v.viewCount / 1000).toFixed(1)}K` : v.viewCount}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </AnimateIn>
          )}

          {/* Creators */}
          {!empty && (tab === "all" || tab === "creators") && profiles.length > 0 && (
            <AnimateIn delay={0.12}>
              <section>
                <div className="mb-5 flex items-baseline gap-3">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-white">
                    {t("search.sectionCreators")}
                  </h2>
                  <span className="text-[11px] text-white/30">{profiles.length}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {profiles.map((p) => (
                    <Link
                      key={p.id}
                      href={`/profile/${p.id}`}
                      className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-white/[0.06] p-4 transition-all duration-500 hover:-translate-y-0.5 hover:border-[#7F77DD]/40 hover:shadow-[0_12px_40px_rgba(127,119,221,0.25)]"
                      style={{
                        background: "linear-gradient(135deg, rgba(127,119,221,0.05) 0%, rgba(8,6,24,0.3) 100%)",
                      }}
                    >
                      <div
                        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{
                          background: "radial-gradient(circle, rgba(127,119,221,0.3) 0%, transparent 70%)",
                          filter: "blur(30px)",
                        }}
                      />
                      <div className="relative shrink-0">
                        <div
                          className="absolute inset-0 rounded-full opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100"
                          style={{
                            background: "conic-gradient(from 0deg, #7F77DD, #AFA9EC, #534AB7, #7F77DD)",
                          }}
                        />
                        <div className="relative h-14 w-14 overflow-hidden rounded-full border border-white/10 ring-2 ring-[#534AB7]/30 transition group-hover:ring-[#7F77DD]/60">
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#26215C] text-sm text-white/40">?</div>
                          )}
                        </div>
                      </div>
                      <div className="relative min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold tracking-tight text-white transition group-hover:text-[#AFA9EC]">
                          <HighlightText text={p.displayName ?? t("search.userFallback")} query={q} />
                        </p>
                        {p.bio && (
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-white/35">{p.bio}</p>
                        )}
                        <div className="mt-1.5 flex items-baseline gap-1.5">
                          <span className="text-[12px] font-bold text-white/70">{p.followerCount}</span>
                          <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
                            {t("search.followersWord")}
                          </span>
                        </div>
                      </div>
                      <span className="relative shrink-0 text-[16px] font-light text-white/20 transition-all duration-500 group-hover:translate-x-1 group-hover:text-[#AFA9EC]">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            </AnimateIn>
          )}

          {/* Tags */}
          {!empty && (tab === "all" || tab === "tags") && tags.length > 0 && (
            <section id="search-tags-section" className="scroll-mt-24">
              <div className="mb-5 flex items-baseline gap-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-white">
                  {t("search.sectionTags")}
                </h2>
                <span className="text-[11px] text-white/30">{tags.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}&tab=tags#search-tags-section`}
                    onClick={() => trackHashtagEvent(tag, "click")}
                    className="group inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[12px] font-medium text-white/70 transition hover:border-[#7F77DD]/40 hover:bg-[#534AB7]/15 hover:text-white"
                  >
                    <span className="text-[#7F77DD]/70 group-hover:text-[#AFA9EC]">#</span>
                    <HighlightText text={tag} query={q} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Empty */}
          {!empty && globalEmpty && (
            <div className="py-24 text-center">
              <p className="text-[15px] font-semibold text-white/60">
                {t("search.noResultsLine").replace("{q}", q)}
              </p>
              <p className="mt-1 text-[12px] text-white/30">{t("search.tryOtherKeywords")}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
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
                    className="rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-1.5 text-[12px] font-medium text-white/60 transition hover:border-[#7F77DD]/30 hover:text-white"
                  >
                    {t(labelKey)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recommended */}
          {!empty && fallback && (
            <section className="border-t border-white/[0.05] pt-10">
              <div className="mb-5 flex items-baseline justify-between gap-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-white">
                  {t("search.youMayAlsoLike")}
                </h2>
                <p className="text-[11px] text-white/30">{t("search.popularFilmsInstead")}</p>
              </div>
              <div className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {fallback.videos.slice(0, 6).map((v) => (
                  <Link key={v.id} href={`/watch/${v.id}`} className="group block">
                    <div
                      className="relative w-full overflow-hidden rounded-md bg-white/[0.03] transition-all duration-500 group-hover:shadow-[0_20px_60px_rgba(127,119,221,0.4)] group-hover:-translate-y-1"
                      style={{ aspectRatio: "16/9" }}
                    >
                      <img
                        src={v.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                      />
                      <div
                        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{
                          background: "linear-gradient(180deg, transparent 50%, rgba(83,74,183,0.3) 100%)",
                        }}
                      />
                      <div className="absolute inset-0 ring-1 ring-inset ring-white/[0.06] transition duration-500 group-hover:ring-[#7F77DD]/50 rounded-md" />
                    </div>
                    <div className="mt-3 px-0.5">
                      <h3 className="line-clamp-1 text-[13px] font-semibold text-white transition group-hover:text-[#AFA9EC]">
                        {v.title}
                      </h3>
                      <p className="mt-1 text-[12px] text-white/55">
                        {formatGenreDisplay(v.genre, v.subGenre)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
