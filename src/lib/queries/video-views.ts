import { createServerSupabaseClient } from "@/lib/supabase/server";

/** 영상 상세 페이지 로드 시 조회수 +1 (RLS와 무관하게 RPC) */
export async function incrementVideoViewCount(videoId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  // 같은 유저가 같은 영상 조회수를 최대 3회까지만 올리도록 제한
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: history } = await supabase
      .from("watch_history")
      .select("view_count_increments")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .maybeSingle();

    const currentIncrements = ((history as { view_count_increments?: number | null } | null)?.view_count_increments ?? 0);
    if (currentIncrements >= 3) {
      return;
    }

    const nextIncrements = currentIncrements + 1;
    const watchedAt = new Date().toISOString();
    if (history) {
      await supabase
        .from("watch_history")
        .update({ view_count_increments: nextIncrements, watched_at: watchedAt })
        .eq("user_id", user.id)
        .eq("video_id", videoId);
    } else {
      await supabase.from("watch_history").insert({
        user_id: user.id,
        video_id: videoId,
        progress_seconds: 0,
        duration_seconds: 0,
        watched_at: watchedAt,
        view_count_increments: 1,
      });
    }
  }

  const { error } = await supabase.rpc("increment_video_view_count", { p_video_id: videoId });
  if (!error) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[incrementVideoViewCount] rpc success", { videoId });
    }
    return;
  }
  // RPC 미적용 환경 대비 fallback (소유자·공개 정책에 따라 실패할 수 있음)
  const { data: row } = await supabase.from("videos").select("id, view_count").eq("id", videoId).maybeSingle();
  const next = ((row?.view_count as number | null) ?? 0) + 1;
  const { error: fallbackError } = await supabase.from("videos").update({ view_count: next }).eq("id", videoId);
  if (!fallbackError) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[incrementVideoViewCount] fallback update success", { videoId, next });
    }
    return;
  }
  console.error("increment_video_view_count", error.message, "| fallback:", fallbackError.message);
}
