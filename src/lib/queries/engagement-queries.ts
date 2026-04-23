import type { Video } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** 비디오 목록에 좋아요 수·내 좋아요·저장 여부 병합 (서버 전용) */
export async function attachEngagementToVideos(videos: Video[]): Promise<Video[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase || videos.length === 0) return videos;

  const ids = [...new Set(videos.map((v) => v.id))];
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: likeRows } = await supabase.from("likes").select("video_id, user_id").in("video_id", ids);

  const counts: Record<string, number> = {};
  const liked = new Set<string>();
  for (const row of likeRows ?? []) {
    const r = row as { video_id: string; user_id: string };
    counts[r.video_id] = (counts[r.video_id] ?? 0) + 1;
    if (user && r.user_id === user.id) liked.add(r.video_id);
  }

  let saved = new Set<string>();
  if (user) {
    const { data: sRows } = await supabase.from("saved_videos").select("video_id").eq("user_id", user.id).in("video_id", ids);
    saved = new Set((sRows ?? []).map((r: { video_id: string }) => r.video_id));
  }

  return videos.map((v) => ({
    ...v,
    likeCount: counts[v.id] ?? 0,
    likedByMe: liked.has(v.id),
    savedByMe: saved.has(v.id),
  }));
}
