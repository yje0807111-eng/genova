"use server";

import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CommentActionResult = { ok: true } | { ok: false; needAuth?: boolean; message: string };
export type PinCommentResult = { ok: true; pinOrder: number | null } | { ok: false; needAuth?: boolean; message: string };

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
    await createNotification({
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

export async function pinCommentAction(commentId: string, videoId: string, pin: boolean): Promise<PinCommentResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const { data: { user } } = await supabase.auth.getUser();
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

  if (!pin) {
    // 핀 해제 — pin_order null로
    const { error: unpinError } = await supabase
      .from("comments")
      .update({ is_pinned: false, pin_order: null })
      .eq("id", commentId);
    if (unpinError) {
      console.error("[pinCommentAction] unpin failed:", unpinError.message, unpinError.code);
      return { ok: false, message: unpinError.message };
    }

    // 남은 pinned 댓글 순서 재정렬 (0부터 연속)
    const { data: remainingPinned } = await supabase
      .from("comments")
      .select("id, pin_order")
      .eq("video_id", videoId)
      .eq("is_pinned", true)
      .order("pin_order", { ascending: true });

    for (const [idx, row] of (remainingPinned ?? []).entries()) {
      await supabase
        .from("comments")
        .update({ pin_order: idx })
        .eq("id", (row as { id: string }).id);
    }
    revalidatePath(`/watch/${videoId}`);
    return { ok: true, pinOrder: null };
  } else {
    // 현재 최대 pin_order 가져오기
    const { data: pinned } = await supabase
      .from("comments")
      .select("pin_order")
      .eq("video_id", videoId)
      .eq("is_pinned", true)
      .order("pin_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = pinned?.pin_order != null ? pinned.pin_order + 1 : 0;

    const { error: pinError } = await supabase
      .from("comments")
      .update({ is_pinned: true, pin_order: nextOrder })
      .eq("id", commentId);
    if (pinError) {
      console.error("[pinCommentAction] pin failed:", pinError.message, pinError.code);
      return { ok: false, message: pinError.message };
    }
    revalidatePath(`/watch/${videoId}`);
    return { ok: true, pinOrder: nextOrder };
  }
}
