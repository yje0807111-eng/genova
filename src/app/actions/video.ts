"use server";

import { revalidatePath } from "next/cache";
import Mux from "@mux/mux-node";
import { ensureProfile } from "@/lib/queries/profile-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MAIN_GENRE_KEYS, isValidSubGenre, needsSubGenre } from "@/lib/constants/genres";
import { MAX_VIDEO_TAGS } from "@/lib/tags";

export type VideoActionResult =
  | { ok: true; videoId: string }
  | { ok: false; message: string };

function normalizeHashtags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const cleaned = raw.trim().replace(/^#+/, "").toLowerCase();
    if (!cleaned) continue;
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
    if (out.length >= MAX_VIDEO_TAGS) break;
  }
  return out;
}

export async function createVideoAction(form: {
  title: string;
  thumbnailUrl: string;
  backdropUrl?: string | null;
  /** Main genre slug */
  genre: string;
  /** Additional selected main genres (excluding primary `genre`) */
  additionalGenres?: string[];
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

  const normalizedTags = normalizeHashtags(form.tags);

  const muxPlaybackId = form.muxPlaybackId?.trim() || null;
  const muxAssetId = form.muxAssetId?.trim() || null;
  const muxUploadId = form.muxUploadId?.trim() || null;
  if (!muxPlaybackId && !muxAssetId && !muxUploadId) {
    return { ok: false, message: "Please complete video upload." };
  }

  if (!form.title.trim()) return { ok: false, message: "Please enter a title." };
  if (!MAIN_GENRE_KEYS.includes(form.genre as (typeof MAIN_GENRE_KEYS)[number])) {
    return { ok: false, message: "Please select a genre." };
  }
  const additionalGenres = (form.additionalGenres ?? []).filter((g, i, arr) =>
    MAIN_GENRE_KEYS.includes(g as (typeof MAIN_GENRE_KEYS)[number]) &&
    g !== form.genre &&
    arr.indexOf(g) === i
  );
  if (form.subGenre && needsSubGenre(form.genre) && !isValidSubGenre(form.genre, form.subGenre)) {
    return { ok: false, message: "Please select a valid sub genre." };
  }
  if (form.purpose === "competition" && !form.submittedCompetitionId) {
    return { ok: false, message: "Please select a competition." };
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
  const seriesName = form.genre === "series" && form.seriesName?.trim() ? form.seriesName.trim() : null;
  const episodeNumber = form.genre === "series" && form.episodeNumber ? form.episodeNumber : null;

  const finalThumbnailUrl = form.thumbnailUrl
    || (muxPlaybackId ? `https://image.mux.com/${muxPlaybackId}/thumbnail.jpg?width=1280&time=2` : "");

  const { error } = await supabase.from("videos").insert({
    id,
    title: form.title.trim(),
    thumbnail_url: finalThumbnailUrl,
    backdrop_url: form.backdropUrl ?? null,
    mux_playback_id: muxPlaybackId ?? null,
    mux_asset_id: muxAssetId ?? null,
    mux_upload_id: muxUploadId ?? null,
    genre: form.genre,
    additional_genres: additionalGenres,
    sub_genre: form.subGenre || null,
    purpose,
    creator_id: null,
    uploaded_by: user.id,
    visibility: form.visibility,
    description: (form.description ?? "").trim(),
    ai_tools: form.aiTools,
    tags: normalizedTags,
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
  if (purpose === "competition" && competitionId) {
    revalidatePath(`/competition/${competitionId}`);
    revalidatePath("/competition");
  }
  return { ok: true, videoId: id };
}

export type SimpleResult = { ok: true } | { ok: false; message: string };

async function deleteMuxAssetIfExists(assetId: string | null): Promise<void> {
  if (!assetId) return;
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) return;

  try {
    const mux = new Mux({ tokenId, tokenSecret });
    await mux.video.assets.delete(assetId);
  } catch (error) {
    console.error("[deleteVideoAction] Failed to delete Mux asset:", error);
  }
}

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

  const { data: video, error: fetchError } = await supabase
    .from("videos")
    .select("id, uploaded_by, mux_asset_id, submitted_competition_id")
    .eq("id", videoId)
    .maybeSingle();
  if (fetchError) return { ok: false, message: fetchError.message };
  if (!video) return { ok: false, message: "Video not found." };
  if (video.uploaded_by !== user.id) return { ok: false, message: "You do not have permission to delete this film." };

  const { error: progressDeleteError } = await supabase.from("video_progress").delete().eq("video_id", videoId);
  if (progressDeleteError) return { ok: false, message: progressDeleteError.message };

  const { error: likesDeleteError } = await supabase.from("likes").delete().eq("video_id", videoId);
  if (likesDeleteError) return { ok: false, message: likesDeleteError.message };

  const { error: savesDeleteError } = await supabase.from("saved_videos").delete().eq("video_id", videoId);
  if (savesDeleteError) return { ok: false, message: savesDeleteError.message };

  const { error: commentsDeleteError } = await supabase.from("comments").delete().eq("video_id", videoId);
  if (commentsDeleteError) return { ok: false, message: commentsDeleteError.message };

  await deleteMuxAssetIfExists(video.mux_asset_id ?? null);

  const { error: videoDeleteError } = await supabase.from("videos").delete().eq("id", videoId).eq("uploaded_by", user.id);
  if (videoDeleteError) return { ok: false, message: videoDeleteError.message };

  revalidatePath("/profile");
  revalidatePath("/watch");
  revalidatePath("/feed");
  revalidatePath("/films");
  revalidatePath("/");
  if (video.submitted_competition_id) {
    revalidatePath(`/competition/${video.submitted_competition_id}`);
  }
  revalidatePath("/competition");
  return { ok: true };
}

export async function updateVideoAction(
  videoId: string,
  form: {
    title: string;
    thumbnailUrl: string;
    backdropUrl?: string | null;
    genre: string;
    additionalGenres?: string[];
    subGenre: string | null;
    aiTools: string[];
    tags: string[];
    seriesName: string | null;
    episodeNumber: number | null;
    description: string;
    runtimeMinutes: number;
    visibility: "public" | "private";
    submittedCompetitionId?: string | null;
    muxPlaybackId?: string | null;
    muxAssetId?: string | null;
    muxUploadId?: string | null;
  },
): Promise<VideoActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Please check your Supabase configuration." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const normalizedTags = normalizeHashtags(form.tags);

  if (!form.title.trim()) return { ok: false, message: "Please enter a title." };
  if (!form.thumbnailUrl) return { ok: false, message: "Thumbnail is required." };
  if (!MAIN_GENRE_KEYS.includes(form.genre as (typeof MAIN_GENRE_KEYS)[number])) {
    return { ok: false, message: "Please select a genre." };
  }
  const additionalGenres = (form.additionalGenres ?? []).filter((g, i, arr) =>
    MAIN_GENRE_KEYS.includes(g as (typeof MAIN_GENRE_KEYS)[number]) &&
    g !== form.genre &&
    arr.indexOf(g) === i
  );
  if (needsSubGenre(form.genre) && !form.subGenre) {
    return { ok: false, message: "Please select a sub genre." };
  }
  if (needsSubGenre(form.genre) && form.subGenre && !isValidSubGenre(form.genre, form.subGenre)) {
    return { ok: false, message: "Please select a valid sub genre." };
  }
  if (!needsSubGenre(form.genre) && form.subGenre) {
    return { ok: false, message: "This genre does not support sub genre." };
  }
  if (normalizedTags.length > MAX_VIDEO_TAGS) {
    return { ok: false, message: `You can add up to ${MAX_VIDEO_TAGS} tags.` };
  }
  if (form.genre === "series") {
    if (!form.seriesName?.trim()) return { ok: false, message: "Please enter a series name." };
    if (!form.episodeNumber || form.episodeNumber < 1) return { ok: false, message: "Please enter an episode number." };
  }

  const runtime = `${Math.round(form.runtimeMinutes)} min`;
  const seriesName = form.genre === "series" ? form.seriesName!.trim() : null;
  const episodeNumber = form.genre === "series" ? form.episodeNumber! : null;

  const { data: row, error: fetchErr } = await supabase
    .from("videos")
    .select("id, uploaded_by, genre, sub_genre, additional_genres, genre_changed_at, mux_playback_id, mux_asset_id, mux_upload_id, submitted_competition_id")
    .eq("id", videoId)
    .maybeSingle();
  if (fetchErr) return { ok: false, message: fetchErr.message };
  if (!row || row.uploaded_by !== user.id) return { ok: false, message: "You do not have permission to edit this film." };

  const currentGenre = row.genre ?? null;
  const currentSubGenre = row.sub_genre ?? null;
  const currentAdditional = Array.isArray(row.additional_genres)
    ? [...new Set(row.additional_genres)].sort()
    : [];
  const nextAdditional = [...additionalGenres].sort();
  const genreChanged =
    currentGenre !== form.genre ||
    currentSubGenre !== (needsSubGenre(form.genre) ? form.subGenre : null) ||
    currentAdditional.length !== nextAdditional.length ||
    currentAdditional.some((value, idx) => value !== nextAdditional[idx]);

  if (row.genre_changed_at && genreChanged) {
    return { ok: false, message: "장르는 이미 변경됐습니다. 운영자 문의가 필요합니다." };
  }

  const incomingMuxPlaybackId = form.muxPlaybackId?.trim() || null;
  const incomingMuxAssetId = form.muxAssetId?.trim() || null;
  const incomingMuxUploadId = form.muxUploadId?.trim() || null;
  const resolvedMuxPlaybackId = incomingMuxPlaybackId ?? row.mux_playback_id ?? null;
  const resolvedMuxAssetId = incomingMuxAssetId ?? row.mux_asset_id ?? null;
  const resolvedMuxUploadId = incomingMuxUploadId ?? row.mux_upload_id ?? null;

  if (!resolvedMuxPlaybackId && !resolvedMuxAssetId && !resolvedMuxUploadId) {
    return { ok: false, message: "Please complete video upload." };
  }

  const oldCompetitionId = row.submitted_competition_id ?? null;
  const newCompetitionId = form.submittedCompetitionId ?? oldCompetitionId;

  const { error } = await supabase
    .from("videos")
    .update({
      title: form.title.trim(),
      thumbnail_url: form.thumbnailUrl,
      ...(form.backdropUrl !== undefined ? { backdrop_url: form.backdropUrl } : {}),
      ...(incomingMuxPlaybackId !== null ? { mux_playback_id: incomingMuxPlaybackId } : {}),
      ...(incomingMuxAssetId !== null ? { mux_asset_id: incomingMuxAssetId } : {}),
      ...(incomingMuxUploadId !== null ? { mux_upload_id: incomingMuxUploadId } : {}),
      ...(form.submittedCompetitionId !== undefined ? { submitted_competition_id: form.submittedCompetitionId } : {}),
      genre: form.genre,
      additional_genres: additionalGenres,
      sub_genre: needsSubGenre(form.genre) ? form.subGenre : null,
      ...(row.genre_changed_at ? {} : (genreChanged ? { genre_changed_at: new Date().toISOString() } : {})),
      description: form.description.trim(),
      ai_tools: form.aiTools,
      tags: normalizedTags,
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
  if (oldCompetitionId) {
    revalidatePath(`/competition/${oldCompetitionId}`);
  }
  if (newCompetitionId && newCompetitionId !== oldCompetitionId) {
    revalidatePath(`/competition/${newCompetitionId}`);
  }
  revalidatePath("/competition");
  return { ok: true, videoId };
}

export async function getVideoForEdit(videoId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false as const, error: "Config error" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Unauthorized" };

  const { data: video, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", videoId)
    .eq("uploaded_by", user.id)
    .single();

  if (error || !video) return { ok: false as const, error: "Video not found" };

  return { ok: true as const, video };
}
