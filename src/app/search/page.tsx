import {
  getFallbackRecommendations,
  type SearchSortMode,
  runFullSearch,
} from "@/lib/queries/search-queries";
import { SearchPageBody } from "@/components/search/search-page-body";

export const dynamic = "force-dynamic";

type ResultTab = "all" | "videos" | "creators" | "tags";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const qRaw = (sp.q ?? "").trim();
  const q = qRaw.replace(/^#+/, "").trim();
  const tabRaw = (sp.tab ?? "all").toLowerCase();
  const sortRaw = (sp.sort ?? "relevance").toLowerCase();

  const tab: ResultTab =
    tabRaw === "videos" || tabRaw === "creators" || tabRaw === "tags" || tabRaw === "all"
      ? (tabRaw as ResultTab)
      : qRaw.startsWith("#")
        ? "tags"
        : "all";
  const sort: SearchSortMode = sortRaw === "latest" ? "latest" : sortRaw === "likes" ? "likes" : "relevance";
  const hashtagQuery = (qRaw.startsWith("#") || tab === "tags") && q ? q : null;

  const empty = !q;
  const result = empty ? null : await runFullSearch(q, 60, 32, sort);
  const fallback =
    empty
      ? await getFallbackRecommendations()
      : !empty && result && (result.videos.length + result.profiles.length + result.matchingTags.length) < 4
        ? await getFallbackRecommendations()
        : null;

  const videos = result?.videos ?? [];
  const profiles = result?.profiles ?? [];
  const tags = result?.matchingTags ?? [];
  const genreMatch = result?.genreMatch;

  const globalTotal = videos.length + profiles.length + tags.length;
  const globalEmpty = !empty && globalTotal === 0;

  return (
    <SearchPageBody
      q={q}
      tab={tab}
      sort={sort}
      empty={empty}
      videos={videos}
      profiles={profiles}
      tags={tags}
      hashtagQuery={hashtagQuery}
      genreMatch={genreMatch ?? null}
      fallback={fallback}
      globalEmpty={globalEmpty}
    />
  );
}
