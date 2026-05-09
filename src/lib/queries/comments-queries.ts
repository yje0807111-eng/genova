import type { VideoComment } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Comment row counts per video (for feeds). */
export async function fetchCommentCountsForVideoIds(videoIds: string[]): Promise<Record<string, number>> {
  if (videoIds.length === 0) return {};
  const supabase = await createServerSupabaseClient();
  if (!supabase) return {};
  const { data, error } = await supabase.from("comments").select("video_id").in("video_id", videoIds);
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const row of data as { video_id: string }[]) {
    counts[row.video_id] = (counts[row.video_id] ?? 0) + 1;
  }
  return counts;
}

export async function fetchCommentsForVideo(videoId: string): Promise<VideoComment[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows, error } = await supabase
    .from("comments")
    .select("*")
    .eq("video_id", videoId)
    .order("is_pinned", { ascending: false })
    .order("pin_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error || !rows?.length) {
    return [];
  }

  const userIds = [...new Set((rows as { user_id: string }[]).map((r) => r.user_id))];
  const { data: profs } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds);
  const profMap = new Map((profs ?? []).map((p) => [p.id as string, p]));

  const flat = (rows as { id: string; user_id: string; video_id: string; parent_id: string | null; content: string; created_at: string }[]).map(
    (row) => {
      const pr = profMap.get(row.user_id);
      return {
        id: row.id,
        userId: row.user_id,
        videoId: row.video_id,
        parentId: row.parent_id,
        content: row.content,
        isPinned: (row as any).is_pinned ?? false,
        pinOrder: (row as any).pin_order ?? null,
        createdAt: row.created_at,
        displayName: pr?.display_name ?? null,
        avatarUrl: pr?.avatar_url ?? null,
        likeCount: 0,
        likedByMe: false,
        replies: [] as VideoComment[],
      };
    },
  );

  const ids = flat.map((c) => c.id);
  const { data: likeRows } = await supabase.from("comment_likes").select("comment_id, user_id").in("comment_id", ids);

  const likeCountMap: Record<string, number> = {};
  const likedSet = new Set<string>();
  for (const lr of likeRows ?? []) {
    const r = lr as { comment_id: string; user_id: string };
    likeCountMap[r.comment_id] = (likeCountMap[r.comment_id] ?? 0) + 1;
    if (user && r.user_id === user.id) likedSet.add(r.comment_id);
  }

  for (const c of flat) {
    c.likeCount = likeCountMap[c.id] ?? 0;
    c.likedByMe = likedSet.has(c.id);
  }

  const byId = new Map(flat.map((c) => [c.id, { ...c, replies: [] as VideoComment[] }]));
  const roots: VideoComment[] = [];

  for (const c of flat) {
    const node = byId.get(c.id)!;
    if (c.parentId) {
      const parent = byId.get(c.parentId);
      if (parent) parent.replies.push(node as VideoComment);
    } else {
      roots.push(node as VideoComment);
    }
  }

  return roots;
}
