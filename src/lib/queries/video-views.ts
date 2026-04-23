import { createServerSupabaseClient } from "@/lib/supabase/server";

/** 영상 상세 페이지 로드 시 조회수 +1 (RLS와 무관하게 RPC) */
export async function incrementVideoViewCount(videoId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;
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
