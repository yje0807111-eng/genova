"use server";

import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ToggleEngagementResult =
  | { ok: true; liked: boolean; count: number }
  | { ok: false; needAuth: true }
  | { ok: false; message: string };

export type ToggleSaveResult =
  | { ok: true; saved: boolean; count: number }
  | { ok: false; needAuth: true }
  | { ok: false; message: string };

export async function toggleLikeAction(videoId: string): Promise<ToggleEngagementResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, needAuth: true };

  const { data: existing } = await supabase.from("likes").select("id").eq("user_id", user.id).eq("video_id", videoId).maybeSingle();

  if (existing) {
    const { error } = await supabase.from("likes").delete().eq("user_id", user.id).eq("video_id", videoId);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("likes").insert({ user_id: user.id, video_id: videoId });
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
        type: "like",
        title: "Someone liked your film",
        body: `"${video.title}" received a new like.`,
        href: `/watch/${videoId}`,
        entityType: "video",
        entityId: videoId,
      });
    }
  }

  const liked = !existing;
  const { count } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("video_id", videoId);

  revalidatePath(`/watch/${videoId}`);
  revalidatePath("/watch");
  revalidatePath("/feed");
  revalidatePath("/films");
  revalidatePath("/");
  revalidatePath("/competition");
  revalidatePath("/profile");

  return { ok: true, liked, count: count ?? 0 };
}

export async function toggleSaveAction(videoId: string): Promise<ToggleSaveResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, needAuth: true };

  const { data: existing } = await supabase.from("saved_videos").select("id").eq("user_id", user.id).eq("video_id", videoId).maybeSingle();

  if (existing) {
    const { error } = await supabase.from("saved_videos").delete().eq("user_id", user.id).eq("video_id", videoId);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("saved_videos").insert({ user_id: user.id, video_id: videoId });
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
        type: "like",
        title: "Someone saved your film",
        body: `"${video.title}" was saved by a viewer.`,
        href: `/watch/${videoId}`,
        entityType: "video",
        entityId: videoId,
      });
    }
  }

  const saved = !existing;

  const { count } = await supabase.from("saved_videos").select("*", { count: "exact", head: true }).eq("video_id", videoId);

  revalidatePath(`/watch/${videoId}`);
  revalidatePath("/profile");

  return { ok: true, saved, count: count ?? 0 };
}
