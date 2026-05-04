"use server";

import { revalidatePath } from "next/cache";
import { ensureProfile } from "@/lib/queries/profile-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MAIN_GENRE_KEYS, needsSubGenre } from "@/lib/constants/genres";
import { MAX_VIDEO_TAGS } from "@/lib/tags";
import { extractVimeoId } from "@/lib/vimeo";

export type VideoActionResult =
  | { ok: true; videoId: string }
  | { ok: false; message: string };

export async function createVideoAction(form: {
  title: string;
  vimeoUrl: string | null;
  thumbnailUrl: string;
  /** Main genre slug */
  genre: string;
  subGenre: string | null;
  purpose: "personal" | "competition";
  aiTools: string[];
  tags: string[];
  seriesName: string | null;
  episodeNumber: number | null;
  description: string;
  runtimeMinutes: number;
  visibility: "public" | "private";
  submittedCompetitionId: string | null;
  muxPlaybackId?: string | null;
  muxAssetId?: string | null;
  muxUploadId?: string | null;
}): Promise<VideoActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Please check your Supabase configuration." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const muxPlaybackId = form.muxPlaybackId?.trim() || null;
  const muxAssetId = form.muxAssetId?.trim() || null;
  const muxUploadId = form.muxUploadId?.trim() || null;
  const vimeoId = extractVimeoId(form.vimeoUrl ?? "");

  if (!muxPlaybackId && !vimeoId) {
    return { ok: false, message: "Please enter a valid Vimeo URL or video ID, or complete Mux upload." };
  }

  if (!form.title.trim()) return { ok: false, message: "Please enter a title." };
  if (!form.thumbnailUrl) return { ok: false, message: "Please upload a thumbnail." };
  if (Math.round(form.runtimeMinutes * 60) < 1) return { ok: false, message: "Please enter runtime in minutes." };
  if (!MAIN_GENRE_KEYS.includes(form.genre as (typeof MAIN_GENRE_KEYS)[number])) {
    return { ok: false, message: "Please select a genre." };
  }
  if (needsSubGenre(form.genre) && !form.subGenre) {
    return { ok: false, message: "Please select a sub genre." };
  }
  if (!needsSubGenre(form.genre) && form.subGenre) {
    return { ok: false, message: "This genre does not support sub genre." };
  }
  if (form.purpose === "competition" && !form.submittedCompetitionId) {
    return { ok: false, message: "Please select a competition." };
  }
  if (form.tags.length > MAX_VIDEO_TAGS) {
    return { ok: false, message: `You can add up to ${MAX_VIDEO_TAGS} tags.` };
  }
  if (form.genre === "series") {
    if (!form.seriesName?.trim()) return { ok: false, message: "Please enter a series name." };
    if (!form.episodeNumber || form.episodeNumber < 1) return { ok: false, message: "Please enter an episode number." };
  }

  const profileOk = await ensureProfile(user.id, user.email);
  if (profileOk === false) {
    return { ok: false, message: "Unable to create profile. Please check profiles table RLS policy." };
  }

  const id = crypto.randomUUID();
  const totalSec = Math.round(form.runtimeMinutes * 60);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const runtime = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const purpose = form.purpose;
  const competitionId = purpose === "competition" ? form.submittedCompetitionId : null;
  const seriesName = form.genre === "series" ? form.seriesName!.trim() : null;
  const episodeNumber = form.genre === "series" ? form.episodeNumber! : null;

  const { error } = await supabase.from("videos").insert({
    id,
    title: form.title.trim(),
    thumbnail_url: form.thumbnailUrl,
    vimeo_id: muxPlaybackId ? null : vimeoId,
    mux_playback_id: muxPlaybackId ?? null,
    mux_asset_id: muxAssetId ?? null,
    mux_upload_id: muxUploadId ?? null,
    genre: form.genre,
    sub_genre: form.subGenre,
    purpose,
    creator_id: null,
    uploaded_by: user.id,
    visibility: form.visibility,
    description: form.description.trim(),
    ai_tools: form.aiTools,
    tags: form.tags,
    series_name: seriesName,
    episode_number: episodeNumber,
    runtime,
    is_original: false,
    is_finalist: false,
    submitted_competition_id: competitionId,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/profile");
  revalidatePath("/watch");
  revalidatePath("/feed");
  revalidatePath("/films");
  revalidatePath("/");
  return { ok: true, videoId: id };
}

export type SimpleResult = { ok: true } | { ok: false; message: string };

export async function updateVideoVisibilityAction(videoId: string, visibility: "public" | "private"): Promise<SimpleResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Please check your Supabase configuration." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const { error } = await supabase.from("videos").update({ visibility }).eq("id", videoId).eq("uploaded_by", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/profile");
  revalidatePath(`/watch/${videoId}`);
  return { ok: true };
}

export async function deleteVideoAction(videoId: string): Promise<SimpleResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Please check your Supabase configuration." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const { error } = await supabase.from("videos").delete().eq("id", videoId).eq("uploaded_by", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/profile");
  revalidatePath("/watch");
  revalidatePath("/feed");
  revalidatePath("/films");
  revalidatePath("/");
  return { ok: true };
}

export async function updateVideoAction(
  videoId: string,
  form: {
    title: string;
    thumbnailUrl: string;
    genre: string;
    subGenre: string | null;
    aiTools: string[];
    tags: string[];
    seriesName: string | null;
    episodeNumber: number | null;
    description: string;
    runtimeMinutes: number;
    visibility: "public" | "private";
  },
): Promise<VideoActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Please check your Supabase configuration." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };

  if (!form.title.trim()) return { ok: false, message: "Please enter a title." };
  if (!form.thumbnailUrl) return { ok: false, message: "Thumbnail is required." };
  if (form.runtimeMinutes < 1) return { ok: false, message: "Please enter runtime in minutes." };
  if (!MAIN_GENRE_KEYS.includes(form.genre as (typeof MAIN_GENRE_KEYS)[number])) {
    return { ok: false, message: "Please select a genre." };
  }
  if (needsSubGenre(form.genre) && !form.subGenre) {
    return { ok: false, message: "Please select a sub genre." };
  }
  if (!needsSubGenre(form.genre) && form.subGenre) {
    return { ok: false, message: "This genre does not support sub genre." };
  }
  if (form.tags.length > MAX_VIDEO_TAGS) {
    return { ok: false, message: `You can add up to ${MAX_VIDEO_TAGS} tags.` };
  }
  if (form.genre === "series") {
    if (!form.seriesName?.trim()) return { ok: false, message: "Please enter a series name." };
    if (!form.episodeNumber || form.episodeNumber < 1) return { ok: false, message: "Please enter an episode number." };
  }

  const runtime = `${Math.round(form.runtimeMinutes)} min`;
  const seriesName = form.genre === "series" ? form.seriesName!.trim() : null;
  const episodeNumber = form.genre === "series" ? form.episodeNumber! : null;

  const { data: row, error: fetchErr } = await supabase.from("videos").select("id, uploaded_by").eq("id", videoId).maybeSingle();
  if (fetchErr) return { ok: false, message: fetchErr.message };
  if (!row || row.uploaded_by !== user.id) return { ok: false, message: "You do not have permission to edit this film." };

  const { error } = await supabase
    .from("videos")
    .update({
      title: form.title.trim(),
      thumbnail_url: form.thumbnailUrl,
      genre: form.genre,
      sub_genre: needsSubGenre(form.genre) ? form.subGenre : null,
      description: form.description.trim(),
      ai_tools: form.aiTools,
      tags: form.tags,
      runtime,
      visibility: form.visibility,
      series_name: seriesName,
      episode_number: episodeNumber,
    })
    .eq("id", videoId)
    .eq("uploaded_by", user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/profile");
  revalidatePath("/watch");
  revalidatePath("/feed");
  revalidatePath("/films");
  revalidatePath(`/watch/${videoId}`);
  revalidatePath(`/upload/edit/${videoId}`);
  revalidatePath("/");
  return { ok: true, videoId };
}
