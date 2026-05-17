import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

/**
 * 영상 상세 페이지 로드 시 조회수 +1.
 *
 * 핵심 증가는 `increment_video_view_count` RPC(security definer, RLS
 * 우회).  RPC 미적용 환경에서는 service-role 클라이언트로 직접
 * 업데이트(RLS 우회) 폴백 — 일반 세션 클라이언트는 videos UPDATE
 * RLS 에 막혀 0 에서 안 오르던 버그 방지.
 *
 * per-user 3회 캡(watch_history)은 어뷰징 방지용 부가 기능이라,
 * 해당 테이블/컬럼 오류가 핵심 카운팅을 막지 않도록 분리한다.
 */
export async function incrementVideoViewCount(videoId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // 같은 유저·같은 영상 최대 3회까지만 가산.  watch_history 가
    // 읽히는 경우에만 캡을 적용하고, 오류 시엔 캡을 건너뛰되
    // 핵심 증가는 계속 진행한다(0 고정 방지).
    const { data: history, error: historyError } = await supabase
      .from("watch_history")
      .select("view_count_increments")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .maybeSingle();

    if (!historyError) {
      const currentIncrements =
        (history as { view_count_increments?: number | null } | null)
          ?.view_count_increments ?? 0;
      if (currentIncrements >= 3) {
        return false;
      }
      const nextIncrements = currentIncrements + 1;
      const watchedAt = new Date().toISOString();
      if (history) {
        await supabase
          .from("watch_history")
          .update({
            view_count_increments: nextIncrements,
            watched_at: watchedAt,
          })
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
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[incrementVideoViewCount] watch_history unavailable, skipping cap:",
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
  const service = createServiceSupabaseClient();
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
