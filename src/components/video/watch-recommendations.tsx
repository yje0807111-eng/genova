import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mergeVideoRows } from "@/lib/queries";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import { mapVideo } from "@/lib/mappers";
import { WatchRecommendationsSections } from "@/components/video/watch-detail-client";

/**
 * Async server component for the below-the-fold "MORE TO WATCH" tail.
 * Streamed via <Suspense> from the watch page so the player / sidebar
 * / comments render immediately — the same-genre + trending fetch and
 * the public_profiles merge no longer sit on the page's critical path.
 */
export async function WatchRecommendations({
  videoId,
  genre,
  currentSeriesName,
}: {
  videoId: string;
  genre: string;
  currentSeriesName: string | null;
}) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const [sameGenreRes, trendingRes] = await Promise.all([
    supabase
      .from("videos")
      .select("*, creators(*)")
      .eq("visibility", "public")
      .eq("genre", genre)
      .neq("id", videoId)
      .order("view_count", { ascending: false })
      .limit(12),
    supabase
      .from("videos")
      .select("*, creators(*)")
      .eq("visibility", "public")
      .neq("id", videoId)
      .order("view_count", { ascending: false })
      .limit(24),
  ]);

  const sameGenreRows = (sameGenreRes.data ?? []) as Parameters<
    typeof mapVideo
  >[0][];
  const trendingRows = (trendingRes.data ?? []) as Parameters<
    typeof mapVideo
  >[0][];

  const unionById = new Map<string, Parameters<typeof mapVideo>[0]>();
  for (const r of [...sameGenreRows, ...trendingRows]) {
    if (!unionById.has(r.id)) unionById.set(r.id, r);
  }
  const merged = await mergeVideoRows([...unionById.values()]);
  const mergedById = new Map(merged.map((r) => [r.id, r]));

  const sameGenreMapped = sameGenreRows.map((r) =>
    mapVideo(mergedById.get(r.id) ?? r),
  );
  const sameGenreIds = new Set(sameGenreMapped.map((v) => v.id));
  const trendingMapped = trendingRows
    .map((r) => mapVideo(mergedById.get(r.id) ?? r))
    .filter((v) => !sameGenreIds.has(v.id))
    .slice(0, 12);

  // 좋아요 수 표시용 — likes 는 별도 테이블이라 attach 필요
  // (하단 추천 카드도 홈 카드처럼 좋아요 노출).
  const [sameGenreVideos, trendingVideos] = await Promise.all([
    attachEngagementToVideos(sameGenreMapped),
    attachEngagementToVideos(trendingMapped),
  ]);

  return (
    <WatchRecommendationsSections
      sameGenreVideos={sameGenreVideos}
      trendingVideos={trendingVideos}
      currentVideoId={videoId}
      currentSeriesName={currentSeriesName}
    />
  );
}
