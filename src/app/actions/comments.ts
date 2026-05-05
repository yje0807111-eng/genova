"use server";

import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CommentActionResult = { ok: true } | { ok: false; needAuth?: boolean; message: string };

export async function createCommentAction(videoId: string, content: string, parentId: string | null): Promise<CommentActionResult> {
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, message: "Please enter a comment." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, needAuth: true, message: "Please sign in." };

  if (parentId) {
    const { data: parent } = await supabase.from("comments").select("id, video_id").eq("id", parentId).maybeSingle();
    if (!parent || (parent as { video_id: string }).video_id !== videoId) {
      return { ok: false, message: "Invalid reply target." };
    }
  }

  const { error } = await supabase.from("comments").insert({
    user_id: user.id,
    video_id: videoId,
    parent_id: parentId,
    content: trimmed,
  });
  if (error) return { ok: false, message: error.message };

  const { data: video } = await supabase
    .from("videos")
    .select("uploaded_by, title")
    .eq("id", videoId)
    .maybeSingle();

  if (video?.uploaded_by && video.uploaded_by !== user.id) {
    await createNotification(supabase, {
      userId: video.uploaded_by,
      actorId: user.id,
      type: "comment",
      title: "New comment on your film",
      body: `Someone commented on "${video.title}".`,
      href: `/watch/${videoId}`,
      entityType: "video",
      entityId: videoId,
    });
  }

  revalidatePath(`/watch/${videoId}`);
  return { ok: true };
}

export async function deleteCommentAction(commentId: string, videoId: string): Promise<CommentActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, needAuth: true, message: "Please sign in." };

  const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/watch/${videoId}`);
  return { ok: true };
}

export type ToggleCommentLikeResult =
  | { ok: true; liked: boolean; count: number }
  | { ok: false; needAuth: true }
  | { ok: false; message: string };

export async function toggleCommentLikeAction(commentId: string, videoId: string): Promise<ToggleCommentLikeResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, needAuth: true };

  const { data: existing } = await supabase.from("comment_likes").select("id").eq("user_id", user.id).eq("comment_id", commentId).maybeSingle();

  if (existing) {
    await supabase.from("comment_likes").delete().eq("user_id", user.id).eq("comment_id", commentId);
  } else {
    await supabase.from("comment_likes").insert({ user_id: user.id, comment_id: commentId });
  }

  const liked = !existing;
  const { count } = await supabase.from("comment_likes").select("*", { count: "exact", head: true }).eq("comment_id", commentId);

  revalidatePath(`/watch/${videoId}`);
  return { ok: true, liked, count: count ?? 0 };
}

export async function pinCommentAction(commentId: string, videoId: string, pin: boolean): Promise<CommentActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, needAuth: true, message: "Please sign in." };

  // 영상 업로더만 핀 가능
  const { data: video } = await supabase
    .from("videos")
    .select("uploaded_by")
    .eq("id", videoId)
    .maybeSingle();

  if (!video || video.uploaded_by !== user.id) {
    return { ok: false, message: "Only the video owner can pin comments." };
  }

  // 기존 핀 해제
  if (pin) {
    await supabase
      .from("comments")
      .update({ is_pinned: false })
      .eq("video_id", videoId);
  }

  // 새 핀 설정
  const { error } = await supabase
    .from("comments")
    .update({ is_pinned: pin })
    .eq("id", commentId);

  if (error) return { ok: false, message: error.message };
  revalidatePath(`/watch/${videoId}`);
  return { ok: true };
}
