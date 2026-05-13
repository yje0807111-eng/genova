import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mergeVideoRows } from "@/lib/queries";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import type { Video } from "@/lib/types";

export async function fetchTrendingCompetitionVideos(limit = 10): Promise<Video[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from("videos")
    .select("*")
    .eq("purpose", "competition")
    .eq("visibility", "public")
    .gte("created_at", since)
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error || !rows) return [];

  const videos = await mergeVideoRows(rows);
  await attachEngagementToVideos(videos);

  return videos;
}
