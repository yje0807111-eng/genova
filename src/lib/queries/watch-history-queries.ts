import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

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
