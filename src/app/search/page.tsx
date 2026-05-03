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
  const q = (sp.q ?? "").trim();
  const tabRaw = (sp.tab ?? "all").toLowerCase();
  const sortRaw = (sp.sort ?? "relevance").toLowerCase();

  const tab: ResultTab =
    tabRaw === "videos" || tabRaw === "creators" || tabRaw === "tags" || tabRaw === "all" ? (tabRaw as ResultTab) : "all";
  const sort: SearchSortMode = sortRaw === "latest" ? "latest" : sortRaw === "likes" ? "likes" : "relevance";

  const empty = !q;
  const result = empty ? null : await runFullSearch(q, 60, 32, sort);
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

  return (
    <SearchPageBody
      q={q}
      tab={tab}
      sort={sort}
      empty={empty}
      videos={videos}
      profiles={profiles}
      tags={tags}
      genreMatch={genreMatch}
      fallback={fallback}
      globalEmpty={globalEmpty}
    />
  );
}
