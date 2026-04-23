import Link from "next/link";
import { AnimateIn } from "@/components/animate-in";
import { HighlightText } from "@/components/ui/highlight-text";
import { formatGenreDisplay } from "@/lib/constants/genres";
import {
  getFallbackRecommendations,
  getRelatedTagSuggestions,
  type SearchSortMode,
  runFullSearch,
} from "@/lib/queries/search-queries";

export const dynamic = "force-dynamic";

type ResultTab = "all" | "videos" | "creators" | "tags";

function buildSearchHref(q: string, tab: ResultTab, sort: SearchSortMode): string {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (tab !== "all") p.set("tab", tab);
  if (sort !== "relevance") p.set("sort", sort);
  const s = p.toString();
  return s ? `/search?${s}` : "/search";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const tabRaw = (sp.tab ?? "all").toLowerCase();
  const sortRaw = (sp.sort ?? "relevance").toLowerCase();

  const tab: ResultTab =
    tabRaw === "videos" || tabRaw === "creators" || tabRaw === "tags" || tabRaw === "all" ? (tabRaw as ResultTab) : "all";
  const sort: SearchSortMode = sortRaw === "latest" ? "latest" : sortRaw === "likes" ? "likes" : "relevance";

  const empty = !q;
  const result = empty ? null : await runFullSearch(q, 60, 32, sort);
  const relatedTags = empty ? [] : await getRelatedTagSuggestions(q);
  const fallback =
    !empty && result && result.videos.length === 0 && result.profiles.length === 0 && result.matchingTags.length === 0
      ? await getFallbackRecommendations()
      : null;

  const videos = result?.videos ?? [];
  const profiles = result?.profiles ?? [];
  const tags = result?.matchingTags ?? [];
  const genreMatch = result?.genreMatch;

  const globalTotal = videos.length + profiles.length + tags.length;
  const globalEmpty = !empty && globalTotal === 0;

  const totalCount =
    tab === "all"
      ? globalTotal
      : tab === "videos"
        ? videos.length
        : tab === "creators"
          ? profiles.length
          : tags.length;

  const tabOnlyEmpty =
    !empty &&
    !globalEmpty &&
    (tab === "videos" ? videos.length === 0 : tab === "creators" ? profiles.length === 0 : tab === "tags" ? tags.length === 0 : false);

  return (
    <div className="page-cinematic mx-auto max-w-6xl space-y-6 px-6 py-8 text-[#F8F7FF]">
        <AnimateIn delay={0} className="space-y-4 rounded-2xl border border-white/10 bg-[#1A1535]/70 p-6">
          <div className="space-y-2">
            <p className="eyebrow">Search</p>
            <h1 className="page-title text-3xl sm:text-4xl">Explore Films</h1>
            <p className="page-subtitle">Search by title, creator, genre, and tags across the platform.</p>
          </div>
          <form action="/search" className="flex flex-col gap-3 sm:flex-row">
            <input type="hidden" name="tab" value={tab} />
            <input type="hidden" name="sort" value={sort} />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Title, tags, creators, genre..."
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#0A0A18]/70 px-4 py-3 text-sm text-[#EEEDFE] outline-none transition focus:border-[#7F77DD]/50 focus:ring-2 focus:ring-[#534AB7]/35"
            />
            <button
              type="submit"
              className="rounded-[6px] bg-[#534AB7] px-6 py-3 text-sm font-semibold text-[#EEEDFE] transition hover:bg-[#655cd0]"
            >
              Search
            </button>
          </form>

          {empty ? (
            <p className="text-sm text-[#AFA9EC]">Type a query or use the search icon above.</p>
          ) : (
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
              <p className="text-[#AFA9EC]">
                <span className="text-[#EEEDFE]">"{q}"</span> ·{" "}
                <span className="font-semibold text-[#EEEDFE]">{globalTotal}</span> results
                {tab !== "all" ? (
                  <span className="text-[#AFA9EC]/80">
                    {" "}
                    (this tab: {totalCount})
                  </span>
                ) : null}
              </p>
            </div>
          )}
        </AnimateIn>

        {!empty && genreMatch ? (
          <AnimateIn delay={0.05}>
          <Link
            href={`/genre/${genreMatch.slug}`}
            className="block rounded-2xl border border-[#534AB7]/40 bg-gradient-to-r from-[#534AB7]/25 to-[#1A1535] px-6 py-4 transition hover:border-[#7F77DD]/60"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[#AFA9EC]">Browse by Genre</p>
            <p className="mt-1 text-lg font-bold text-[#EEEDFE]">{genreMatch.label} View All →</p>
          </Link>
          </AnimateIn>
        ) : null}

        {!empty ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1 border-b border-white/10" role="tablist">
              {(
                [
                  ["all", "All"],
                  ["videos", "Films"],
                  ["creators", "Creators"],
                  ["tags", "Tags"],
                ] as const
              ).map(([key, label]) => (
                <Link
                  key={key}
                  href={buildSearchHref(q, key as ResultTab, sort)}
                  className={`tab-underline text-sm font-semibold ${
                    tab === key ? "border-b-[#7F77DD] text-[#EEEDFE]" : ""
                  }`}
                  role="tab"
                  aria-selected={tab === key}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1 border-b border-white/10 text-sm">
              {(
                [
                  ["relevance", "Relevance"],
                  ["latest", "Latest"],
                  ["likes", "Most Liked"],
                ] as const
              ).map(([key, label]) => (
                <Link
                  key={key}
                  href={buildSearchHref(q, tab, key as SearchSortMode)}
                  className={`tab-underline text-xs font-medium ${
                    sort === key ? "border-b-[#7F77DD] text-[#EEEDFE]" : ""
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {!empty && relatedTags.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[#AFA9EC]">Related Tags</h2>
            <div className="flex flex-wrap gap-2">
              {relatedTags.map((t) => (
                <Link
                  key={t}
                  href={buildSearchHref(t, "all", "relevance")}
                  className="rounded-full border border-white/15 bg-[#131028] px-3 py-1.5 text-xs text-[#E8E4FF] transition hover:border-[#7F77DD]/50 hover:bg-[#534AB7]/25"
                >
                  #{t}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {!empty && fallback ? (
          <section className="space-y-6 rounded-2xl border border-dashed border-white/20 bg-[#131028]/60 p-6">
            <div>
              <p className="text-lg font-bold text-[#EEEDFE]">You may also like</p>
              <p className="mt-1 text-sm text-[#AFA9EC]">No close matches found, showing popular films instead.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {fallback.videos.map((v) => (
                <Link
                  key={v.id}
                  href={`/watch/${v.id}`}
                  className="overflow-hidden rounded-xl border border-white/10 bg-[#1A1535] transition hover:border-[#7F77DD] hover:shadow-[0_10px_30px_rgba(20,16,44,0.45)]"
                >
                  <img src={v.thumbnailUrl} alt="" className="aspect-video w-full object-cover transition duration-300 hover:scale-105" />
                  <p className="line-clamp-2 p-3 text-sm font-semibold text-[#EEEDFE]">{v.title}</p>
                </Link>
              ))}
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-[#AFA9EC]">Similar Genres</p>
              <div className="flex flex-wrap gap-2">
                {fallback.genreSuggestions.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/genre/${g.slug}`}
                    className="rounded-full bg-[#534AB7]/30 px-3 py-1.5 text-xs text-[#EEEDFE] hover:bg-[#534AB7]/50"
                  >
                    {g.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {!empty && !fallback && (tab === "all" || tab === "videos") && videos.length > 0 ? (
          <AnimateIn delay={0.1} className="space-y-4">
            {(tab === "all" || tab === "videos") && <h2 className="text-xl font-bold text-[#EEEDFE]">Films</h2>}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(tab === "all" || tab === "videos" ? videos : []).map((v, idx) => (
                <AnimateIn key={v.id} delay={0.14 + idx * 0.08}>
                <Link
                  key={v.id}
                  href={`/watch/${v.id}`}
                  className="group overflow-hidden rounded-xl border border-white/10 bg-[#1A1535] transition hover:border-[#7F77DD]"
                >
                  <img src={v.thumbnailUrl} alt="" className="aspect-video w-full object-cover transition duration-300 group-hover:scale-105" />
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-2 text-sm font-semibold">
                      <HighlightText text={v.title} query={q} />
                    </p>
                    <p className="text-[11px] text-[#AFA9EC]">{formatGenreDisplay(v.genre, v.subGenre)}</p>
                    <p className="text-[11px] text-[#AFA9EC]">
                      ♥ <span className="text-[#E8E4FF]">{v.likeCount ?? 0}</span>
                    </p>
                  </div>
                </Link>
                </AnimateIn>
              ))}
            </div>
          </AnimateIn>
        ) : null}

        {!empty && !fallback && (tab === "all" || tab === "creators") && profiles.length > 0 ? (
          <AnimateIn delay={0.12} className="space-y-4">
            <h2 className="text-xl font-bold text-[#EEEDFE]">Creators</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(tab === "all" || tab === "creators" ? profiles : []).map((p, idx) => (
                <AnimateIn key={p.id} delay={0.16 + idx * 0.08}>
                <Link
                  key={p.id}
                  href={`/profile/${p.id}`}
                  className="rounded-xl border border-white/10 bg-[#1A1535] p-4 transition hover:border-[#7F77DD]"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#26215C]">
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-[#AFA9EC]">?</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        <HighlightText text={p.displayName ?? "User"} query={q} />
                      </p>
                      <p className="mt-1 text-xs text-[#AFA9EC]">Followers {p.followerCount}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-[#AFA9EC]/90">{p.bio || "No bio yet."}</p>
                    </div>
                  </div>
                </Link>
                </AnimateIn>
              ))}
            </div>
          </AnimateIn>
        ) : null}

        {!empty && !fallback && (tab === "all" || tab === "tags") && tags.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#EEEDFE]">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {(tab === "all" || tab === "tags" ? tags : []).map((t) => (
                <Link
                  key={t}
                  href={buildSearchHref(t, "all", "relevance")}
                  className="rounded-full bg-[#26215C] px-4 py-2 text-sm font-medium text-[#EEEDFE] ring-1 ring-white/10 hover:bg-[#534AB7]/40"
                >
                  <HighlightText text={`#${t}`} query={q} />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {!empty && !fallback && globalEmpty ? (
          <p className="rounded-2xl border border-white/10 bg-[#131028]/50 py-16 text-center text-[#AFA9EC]">
            No results found
          </p>
        ) : null}

        {!empty && !fallback && tabOnlyEmpty ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-[#131028]/40 py-10 text-center text-sm text-[#AFA9EC]">
            No results in this tab. Try another tab.
          </p>
        ) : null}
    </div>
  );
}
