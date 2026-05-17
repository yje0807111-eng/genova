import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

/**
 * 영상 상세 페이지 로드 시 조회수 +1.
 *
 * - per-user 3회 캡: watch_history 에 (user, video) 행이 여러 개
 *   존재할 수 있어(진행률 추적 등) 단일 행 기준으로는 누적이 안 돼
 *   캡이 안 먹던 문제 → 전체 행의 view_count_increments 합으로
 *   판정.  RLS 우회 위해 service-role 로 읽고/쓴다.
 * - 핵심 증가: `increment_video_view_count` RPC → 실패 시
 *   service-role 직접 업데이트(RLS 우회).
 */
export async function incrementVideoViewCount(
  videoId: string,
  opts?: { uploaderId?: string | null },
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 업로더 본인 조회는 조회수에서 제외(일반 플랫폼 방식).
  if (user && opts?.uploaderId && user.id === opts.uploaderId) {
    return false;
  }

  const service = createServiceSupabaseClient();

  if (user) {
    const capClient = service ?? supabase;
    // (user, video) 의 모든 행 — 합산으로 누적 캡 판정.
    const { data: rows, error: historyError } = await capClient
      .from("watch_history")
      .select("id, view_count_increments, watched_at")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .order("watched_at", { ascending: false });

    if (!historyError) {
      const list = (rows ?? []) as {
        id: string | number;
        view_count_increments?: number | null;
        watched_at?: string | null;
      }[];
      const total = list.reduce(
        (s, r) => s + (r.view_count_increments ?? 0),
        0,
      );
      // 이미 3회 도달 → 더 올리지 않음.
      if (total >= 3) {
        return false;
      }
      const watchedAt = new Date().toISOString();
      const latest = list[0];
      if (latest) {
        // 가장 최근 행의 카운터만 +1 (합계가 3 도달 시 자동 캡).
        await capClient
          .from("watch_history")
          .update({
            view_count_increments: (latest.view_count_increments ?? 0) + 1,
            watched_at: watchedAt,
          })
          .eq("id", latest.id);
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
