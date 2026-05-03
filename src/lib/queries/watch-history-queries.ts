import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export async function fetchWatchHistory(userId: string) {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("watch_history")
    .select("video_id, progress_seconds, duration_seconds, watched_at")
    .eq("user_id", userId)
    .order("watched_at", { ascending: false })
    .limit(10);

  if (error) return [];
  return data ?? [];
}

export async function upsertWatchHistory({
  userId,
  videoId,
  progressSeconds,
  durationSeconds,
}: {
  userId: string;
  videoId: string;
  progressSeconds: number;
  durationSeconds: number;
}) {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return;

  await supabase.from("watch_history").upsert({
    user_id: userId,
    video_id: videoId,
    progress_seconds: progressSeconds,
    duration_seconds: durationSeconds,
    watched_at: new Date().toISOString(),
  }, { onConflict: "user_id,video_id" });
}
