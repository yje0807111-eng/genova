import { mapVideo } from "@/lib/mappers";
import { mergeVideoRows } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Video } from "@/lib/types";

/**
 * F4: Films Beta 2 rails — three horizontal scrollers shown above the
 * Films-tab grid when the user is on `?tab=films`, sub-genre is "all",
 * and search is empty.
 *
 * Each function is server-only.  They're meant to be composed with
 * `Promise.all` from page.tsx (already has the pattern for the rest
 * of the home prefetch).
 *
 * Empty rails are valid — the consumer skips rendering them when the
 * returned array is empty.
 */

/**
 * Series rail: one representative entry per `series_name`.  We pick
 * the lowest episode_number for each series so the user lands on
 * episode 1 by default, then sort series alphabetically by name.
 *
 * Series mode = `series_name IS NOT NULL` (장르와 독립된 토글).
 * 과거엔 genre='series' 도 요구했으나 그런 장르가 없어 신규
 * 업로드 시리즈가 레일에 안 잡히던 문제로 조건을 완화.
 */
export async function fetchSeriesRail(limit = 12): Promise<Video[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("visibility", "public")
    .not("series_name", "is", null)
    .order("series_name", { ascending: true })
    .order("episode_number", { ascending: true, nullsFirst: false })
    .limit(limit * 4); // fetch headroom, dedupe by series below
  if (error || !data) return [];

  const seenSeries = new Set<string>();
  const oneEpisodePerSeries = [] as typeof data;
  for (const row of data) {
    const name = (row as { series_name?: string | null }).series_name;
    if (!name || seenSeries.has(name)) continue;
    seenSeries.add(name);
    oneEpisodePerSeries.push(row);
    if (oneEpisodePerSeries.length >= limit) break;
  }

  const enriched = await mergeVideoRows(
    oneEpisodePerSeries as Parameters<typeof mapVideo>[0][],
  );
  return enriched.map((row) => mapVideo(row));
}

/**
 * Award Winners rail: any public video with `is_finalist = true` OR a
 * non-empty `award`.  Sorted by award presence first (finalists with
 * an explicit prize rank above plain finalists), then by view_count.
 */
export async function fetchAwardWinnersRail(limit = 12): Promise<Video[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  // Two parallel queries: explicit award winners and finalists-only.
  // We merge + dedupe so award-bearing rows win the ordering tie
  // without a complex Postgres CASE.
  const [winnersRes, finalistsRes] = await Promise.all([
    supabase
      .from("videos")
      .select("*")
      .eq("visibility", "public")
      .not("award", "is", null)
      .order("view_count", { ascending: false })
      .limit(limit),
    supabase
      .from("videos")
      .select("*")
      .eq("visibility", "public")
      .eq("is_finalist", true)
      .is("award", null)
      .order("view_count", { ascending: false })
      .limit(limit),
  ]);

  const winners = winnersRes.data ?? [];
  const finalists = finalistsRes.data ?? [];
  const seen = new Set<string>();
  const combined = [] as typeof winners;
  for (const row of [...winners, ...finalists]) {
    const id = (row as { id: string }).id;
    if (seen.has(id)) continue;
    seen.add(id);
    combined.push(row);
    if (combined.length >= limit) break;
  }

  const enriched = await mergeVideoRows(
    combined as Parameters<typeof mapVideo>[0][],
  );
  return enriched.map((row) => mapVideo(row));
}

/**
 * Continue Watching rail: in-progress videos for the signed-in user.
 *
 * "In progress" = watch_history row exists with progress_seconds
 * between 5 (skip skim hits) and 90% of duration (skip finished
 * plays).  Joined to videos for the card render.
 *
 * Returns [] for unauthenticated callers — pure UX rail, never a
 * source of truth, so we don't surface auth errors here.
 */
export async function fetchContinueWatchingRail(
  userId: string | null | undefined,
  limit = 12,
): Promise<Video[]> {
  if (!userId) return [];
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  // Pull the recent history rows first, then resolve the matching
  // video rows.  Doing the join in PostgREST via `videos!inner(...)`
  // is finicky with the existing visibility filter; two queries is
  // simpler and still single-digit ms.
  const { data: history, error: historyErr } = await supabase
    .from("watch_history")
    .select("video_id, progress_seconds, duration_seconds, watched_at")
    .eq("user_id", userId)
    .gt("progress_seconds", 5)
    .order("watched_at", { ascending: false })
    .limit(limit * 2); // headroom for the < 90% filter and visibility drops
  if (historyErr || !history || history.length === 0) return [];

  // Filter out "essentially complete" rows client-side (Postgres
  // doesn't expose a cheap "ratio of two columns" filter).
  const filtered = history.filter((h) => {
    const prog = Number(h.progress_seconds ?? 0);
    const dur = Number(h.duration_seconds ?? 0);
    if (!Number.isFinite(prog) || !Number.isFinite(dur) || dur <= 0) return false;
    return prog < dur * 0.9;
  });
  if (filtered.length === 0) return [];

  const videoIds = filtered.map((h) => h.video_id as string);
  const { data: videos, error: vidErr } = await supabase
    .from("videos")
    .select("*")
    .in("id", videoIds)
    .eq("visibility", "public");
  if (vidErr || !videos) return [];

  // Preserve watch_history order (most recent first).
  const byId = new Map(videos.map((v) => [(v as { id: string }).id, v]));
  const ordered = videoIds
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .slice(0, limit);

  const enriched = await mergeVideoRows(
    ordered as Parameters<typeof mapVideo>[0][],
  );
  return enriched.map((row) => mapVideo(row));
}
