import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

/**
 * 영상 상세 페이지 로드 시 조회수 +1.
 *
 * - per-user 3회 캡: watch_history 를 service-role 로 읽고/쓰기
 *   (세션 클라이언트는 RLS 에 막혀 캡이 안 먹던 문제 → 무제한
 *   증가하던 버그 방지).
 * - 핵심 증가: `increment_video_view_count` RPC → 실패 시
 *   service-role 직접 업데이트(RLS 우회).
 */
export async function incrementVideoViewCount(videoId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const service = createServiceSupabaseClient();

  if (user) {
    // 캡 판정은 RLS 우회가 필요 → service 우선, 없으면 세션.
    const capClient = service ?? supabase;
    const { data: history, error: historyError } = await capClient
      .from("watch_history")
      .select("view_count_increments")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .maybeSingle();

    if (!historyError) {
      const currentIncrements =
        (history as { view_count_increments?: number | null } | null)
          ?.view_count_increments ?? 0;
      // 이미 3회 도달 → 더 올리지 않음.
      if (currentIncrements >= 3) {
        return false;
      }
      const nextIncrements = currentIncrements + 1;
      const watchedAt = new Date().toISOString();
      if (history) {
        await capClient
          .from("watch_history")
          .update({
            view_count_increments: nextIncrements,
            watched_at: watchedAt,
          })
          .eq("user_id", user.id)
          .eq("video_id", videoId);
      } else {
        await capClient.from("watch_history").insert({
          user_id: user.id,
          video_id: videoId,
          progress_seconds: 0,
          duration_seconds: 0,
          watched_at: watchedAt,
          view_count_increments: 1,
        });
      }
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[incrementVideoViewCount] watch_history unavailable, cap skipped:",
        historyError.message,
      );
    }
  }

  // 핵심 증가 — RPC(권한 우회) 우선.
  const { error } = await supabase.rpc("increment_video_view_count", {
    p_video_id: videoId,
  });
  if (!error) return true;

  // RPC 미적용/실패 → service-role 로 직접 증가(RLS 우회).
  if (service) {
    const { data: row } = await service
      .from("videos")
      .select("view_count")
      .eq("id", videoId)
      .maybeSingle();
    const next = ((row?.view_count as number | null) ?? 0) + 1;
    const { error: fallbackError } = await service
      .from("videos")
      .update({ view_count: next })
      .eq("id", videoId);
    if (!fallbackError) return true;
    console.error(
      "increment_video_view_count rpc:",
      error.message,
      "| service fallback:",
      fallbackError.message,
    );
    return false;
  }

  console.error(
    "increment_video_view_count failed (no service client):",
    error.message,
  );
  return false;
}
