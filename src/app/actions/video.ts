"use server";

import { revalidatePath } from "next/cache";
import Mux from "@mux/mux-node";
import { ensureProfile } from "@/lib/queries/profile-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { MAIN_GENRE_KEYS } from "@/lib/constants/genres";
import { MAX_VIDEO_TAGS } from "@/lib/tags";

export type LotteryIssuance =
  | {
      ok: true;
      ticketId: string;
      monthlyCount: number;
      entriesCreated: number;
    }
  | {
      ok: false;
      /** machine-readable skip / failure reason — see Phase 2A
       *  issue_lottery_ticket() for the full list */
      reason: string;
    };

export type VideoActionResult =
  | { ok: true; videoId: string; lottery?: LotteryIssuance | null }
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
  purpose: "personal" | "competition";
  aiTools: string[];
  workflow?: import("@/lib/types").VideoWorkflow | null;
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
  /** Raw asset duration in seconds (Phase 2A: gated on >= 30 for
   *  lottery ticket issuance).  Optional — callers that don't have
   *  it yet pass undefined (treated as 0). */
  durationSeconds?: number;
  /** True iff the uploader checked the "본인 제작" attestation box.
   *  Required by issue_lottery_ticket(); falsy means no ticket
   *  attempt (video INSERT still succeeds). */
  originalAttestation?: boolean;
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
  // 시리즈는 장르와 독립된 토글(폼이 isSeriesMode 일 때만 값 전달).
  // 과거엔 genre === "series" 로 게이트했으나 그런 장르가 없어
  // 시리즈가 저장되지 않던 버그 → seriesName 유무로만 판단.
  const seriesName = form.seriesName?.trim() ? form.seriesName.trim() : null;
  const episodeNumber = seriesName
    ? form.episodeNumber && form.episodeNumber >= 1
      ? form.episodeNumber
      : 1
    : null;

  const finalThumbnailUrl = form.thumbnailUrl
    || (muxPlaybackId ? `https://image.mux.com/${muxPlaybackId}/thumbnail.jpg?width=1280&time=2` : "");

  // Phase 2: lottery prerequisites.  Both fields are nullable on the
  // row — the issuance function gates on attestation being non-NULL
  // and duration being numerically >= 30, so a video uploaded
  // without the attestation box still lives normally but never gets
  // a ticket.
  const durationSeconds = Math.max(0, Math.round(form.durationSeconds ?? 0));
  const attestationAt = form.originalAttestation ? new Date().toISOString() : null;

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
    purpose,
    creator_id: null,
    uploaded_by: user.id,
    visibility: form.visibility,
    description: (form.description ?? "").trim(),
    ai_tools: form.aiTools,
    ...(form.workflow != null ? { workflow: form.workflow } : {}),
    tags: normalizedTags,
    series_name: seriesName,
    episode_number: episodeNumber,
    runtime,
    duration_seconds: durationSeconds,
    original_attestation_at: attestationAt,
    is_original: false,
    is_finalist: false,
    submitted_competition_id: competitionId,
  });

  if (error) return { ok: false, message: error.message };

  // Phase 2B: lottery issuance.  Best-effort — failures (validation,
  // monthly cap, RPC error) don't roll back the video.  Skip the RPC
  // entirely when the attestation isn't there or the clip is too
  // short, both to avoid unnecessary round-trips and to give a clean
  // `reason` string back to the UI instead of a raised exception.
  let lottery: LotteryIssuance | null = null;
  if (!form.originalAttestation) {
    lottery = { ok: false, reason: "no_attestation" };
  } else if (durationSeconds < 30) {
    lottery = { ok: false, reason: "duration_below_threshold" };
  } else {
    const { data, error: lotteryErr } = await supabase
      .rpc("issue_lottery_ticket", { p_user_id: user.id, p_video_id: id })
      .single<{ ticket_id: string; monthly_count: number; entries_created: number }>();
    if (lotteryErr) {
      // Map the Phase 2A errcodes to a short reason string.  Anything
      // we don't recognize falls back to the raw message so logs
      // stay diagnostic.
      const msg = lotteryErr.message ?? "";
      console.error(
        `[lottery-issue] issue_lottery_ticket failed (user=${user.id} video=${id}):`,
        msg,
        (lotteryErr as { details?: string }).details ?? "",
      );
      const reason =
        msg.includes("monthly_limit_reached") ? "monthly_limit_reached"
        : msg.includes("not_owner") ? "not_owner"
        : msg.includes("no_attestation") ? "no_attestation"
        : msg.includes("duration_below_threshold") ? "duration_below_threshold"
        : msg.includes("video_not_found") ? "video_not_found"
        : msg;
      lottery = { ok: false, reason };
    } else if (data) {
      lottery = {
        ok: true,
        ticketId: data.ticket_id,
        monthlyCount: data.monthly_count,
        entriesCreated: data.entries_created,
      };
    }
  }

  revalidatePath("/profile");
  revalidatePath("/watch");
  revalidatePath("/feed");
  revalidatePath("/films");
  revalidatePath("/");
  if (purpose === "competition" && competitionId) {
    revalidatePath(`/competition/${competitionId}`);
    revalidatePath("/competition");
  }
  return { ok: true, videoId: id, lottery };
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

  // Revoke any lottery ticket(s) earned from this video so they leave the
  // active monthly pool. We do this explicitly (service client, before the
  // video row is removed) instead of relying solely on the DB
  // `entry_tickets_video_delete_trigger`, which may not be present on every
  // environment. Revoked tickets still count toward the monthly cap by
  // design (anti-abuse penalty policy — see CLAUDE.md), so the user's
  // remaining-ticket count is intentionally not restored.
  const service = createServiceSupabaseClient();
  if (service) {
    await service
      .from("entry_tickets")
      .update({
        status: "revoked",
        revoked_reason: "video_deleted",
        revoked_at: new Date().toISOString(),
      })
      .eq("video_id", videoId)
      .eq("status", "active");
  }

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
    aiTools: string[];
    workflow?: import("@/lib/types").VideoWorkflow | null;
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
  if (normalizedTags.length > MAX_VIDEO_TAGS) {
    return { ok: false, message: `You can add up to ${MAX_VIDEO_TAGS} tags.` };
  }
  // 시리즈 모드 = 폼이 seriesName 을 non-null 로 전달(장르 무관).
  const wantsSeries = form.seriesName !== null && form.seriesName !== undefined;
  if (wantsSeries) {
    if (!form.seriesName!.trim()) return { ok: false, message: "Please enter a series name." };
    if (!form.episodeNumber || form.episodeNumber < 1) return { ok: false, message: "Please enter an episode number." };
  }

  const runtime = `${Math.round(form.runtimeMinutes)} min`;
  const seriesName = wantsSeries ? form.seriesName!.trim() : null;
  const episodeNumber = wantsSeries ? form.episodeNumber! : null;

  const { data: row, error: fetchErr } = await supabase
    .from("videos")
    .select("id, uploaded_by, genre, additional_genres, genre_changed_at, mux_playback_id, mux_asset_id, mux_upload_id, submitted_competition_id")
    .eq("id", videoId)
    .maybeSingle();
  if (fetchErr) return { ok: false, message: fetchErr.message };
  if (!row || row.uploaded_by !== user.id) return { ok: false, message: "You do not have permission to edit this film." };

  const currentGenre = row.genre ?? null;
  const currentAdditional = Array.isArray(row.additional_genres)
    ? [...new Set(row.additional_genres)].sort()
    : [];
  const nextAdditional = [...additionalGenres].sort();
  const genreChanged =
    currentGenre !== form.genre ||
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
      ...(row.genre_changed_at ? {} : (genreChanged ? { genre_changed_at: new Date().toISOString() } : {})),
      description: form.description.trim(),
      ai_tools: form.aiTools,
      ...(form.workflow !== undefined ? { workflow: form.workflow } : {}),
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
