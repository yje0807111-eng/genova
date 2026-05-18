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
export type ContinueWatchingVideo = Video & { progressRatio?: number };

export async function fetchContinueWatchingRail(
  userId: string | null | undefined,
  limit = 12,
): Promise<ContinueWatchingVideo[]> {
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

  // 시청 진행률(0~1) — 이어보기 카드 프로그레스 바용.
  const ratioById = new Map<string, number>();
  for (const h of filtered) {
    const prog = Number(h.progress_seconds ?? 0);
    const dur = Number(h.duration_seconds ?? 0);
    if (dur > 0) {
      ratioById.set(
        h.video_id as string,
        Math.min(1, Math.max(0, prog / dur)),
      );
    }
  }

  const enriched = await mergeVideoRows(
    ordered as Parameters<typeof mapVideo>[0][],
  );
  return enriched.map((row) => {
    const v = mapVideo(row);
    return { ...v, progressRatio: ratioById.get(v.id) ?? 0 };
  });
}
