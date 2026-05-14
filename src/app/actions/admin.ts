"use server";

import { revalidatePath } from "next/cache";
import { requireAdminWithService } from "@/lib/auth/admin-actions";
import { createNotification } from "@/lib/notifications";

type AdminResult = { ok: true } | { ok: false; message: string };

export async function createCompetitionAction(form: {
  id: string;
  title: string;
  subtitle?: string;
  genre: string;
  status: string;
  deadline: string;
  voteEnd: string;
  prizeInfo: string;
  sponsor: string;
  thumbnailUrl: string;
  rules: string;
  judgingCriteria: string;
  eligibility: string;
  submissionGuidelines: string;
  currency?: string;
}): Promise<AdminResult> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error ?? "Unauthorized" };
  const { service } = auth;
  const id = form.id.trim() || crypto.randomUUID();
  const { error } = await service.from("competitions").insert({
    id,
    title: form.title.trim(),
    description: form.subtitle?.trim() || null,
    genre: form.genre.trim() || "All",
    status: form.status.trim() || "Open",
    deadline: form.deadline || null,
    vote_end: form.voteEnd || null,
    prize_info: form.prizeInfo.trim(),
    sponsor: form.sponsor.trim(),
    thumbnail_url: form.thumbnailUrl.trim() || null,
    rules: form.rules.trim() || null,
    judging_criteria: form.judgingCriteria.trim() || null,
    eligibility: form.eligibility.trim() || null,
    submission_guidelines: form.submissionGuidelines.trim() || null,
    currency: form.currency ?? "KRW",
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  revalidatePath("/competition");
  return { ok: true };
}

export async function updateCompetitionAction(
  id: string,
  form: {
    title_ko?: string;
    title_en?: string;
    title_ja?: string;
    description?: string;
    genre: string;
    status: string;
    deadline: string;
    voteEnd: string;
    prize_info_ko?: string;
    prize_info_en?: string;
    prize_info_ja?: string;
    sponsor: string;
    thumbnailUrl: string;
    sponsorLogoUrl: string;
    rules_ko?: string;
    rules_en?: string;
    rules_ja?: string;
    eligibility_ko?: string;
    eligibility_en?: string;
    eligibility_ja?: string;
    judging_criteria_ko?: string;
    judging_criteria_en?: string;
    judging_criteria_ja?: string;
    submission_guidelines_ko?: string;
    submission_guidelines_en?: string;
    submission_guidelines_ja?: string;
    announcement_ko?: string;
    announcement_en?: string;
    announcement_ja?: string;
    concept_ko?: string;
    concept_en?: string;
    concept_ja?: string;
    start_date?: string;
    prize_grand?: string;
    prize_excellence?: string;
    prize_merit?: string;
    prize_audience?: string;
    prize_audience_count?: number;
    templateUrl: string;
    exchange_rate_usd_krw?: number;
    exchange_rate_usd_jpy?: number;
    base_currency?: string;
  },
): Promise<AdminResult> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error ?? "Unauthorized" };
  const { service } = auth;

  const titleMain =
    form.title_ko?.trim() || form.title_en?.trim() || form.title_ja?.trim() || "";
  const prizeMain =
    form.prize_info_ko?.trim() ||
    form.prize_info_en?.trim() ||
    form.prize_info_ja?.trim() ||
    "";

  const { error } = await service
    .from("competitions")
    .update({
      title: titleMain,
      description: form.description?.trim() || null,
      title_ko: form.title_ko?.trim() || null,
      title_en: form.title_en?.trim() || null,
      title_ja: form.title_ja?.trim() || null,
      genre: form.genre.trim() || "All",
      status: form.status.trim() || "Open",
      deadline: form.deadline || null,
      vote_end: form.voteEnd || null,
      prize_info: prizeMain,
      prize_info_ko: form.prize_info_ko?.trim() || null,
      prize_info_en: form.prize_info_en?.trim() || null,
      prize_info_ja: form.prize_info_ja?.trim() || null,
      sponsor: form.sponsor.trim(),
      thumbnail_url: form.thumbnailUrl.trim() || null,
      sponsor_logo_url: form.sponsorLogoUrl.trim() || null,
      rules:
        form.rules_ko?.trim() || form.rules_en?.trim() || form.rules_ja?.trim() || null,
      rules_ko: form.rules_ko?.trim() || null,
      rules_en: form.rules_en?.trim() || null,
      rules_ja: form.rules_ja?.trim() || null,
      judging_criteria:
        form.judging_criteria_ko?.trim() ||
        form.judging_criteria_en?.trim() ||
        form.judging_criteria_ja?.trim() ||
        null,
      judging_criteria_ko: form.judging_criteria_ko?.trim() || null,
      judging_criteria_en: form.judging_criteria_en?.trim() || null,
      judging_criteria_ja: form.judging_criteria_ja?.trim() || null,
      eligibility:
        form.eligibility_ko?.trim() ||
        form.eligibility_en?.trim() ||
        form.eligibility_ja?.trim() ||
        null,
      eligibility_ko: form.eligibility_ko?.trim() || null,
      eligibility_en: form.eligibility_en?.trim() || null,
      eligibility_ja: form.eligibility_ja?.trim() || null,
      submission_guidelines:
        form.submission_guidelines_ko?.trim() ||
        form.submission_guidelines_en?.trim() ||
        form.submission_guidelines_ja?.trim() ||
        null,
      submission_guidelines_ko: form.submission_guidelines_ko?.trim() || null,
      submission_guidelines_en: form.submission_guidelines_en?.trim() || null,
      submission_guidelines_ja: form.submission_guidelines_ja?.trim() || null,
      announcement:
        form.announcement_ko?.trim() ||
        form.announcement_en?.trim() ||
        form.announcement_ja?.trim() ||
        null,
      announcement_ko: form.announcement_ko?.trim() || null,
      announcement_en: form.announcement_en?.trim() || null,
      announcement_ja: form.announcement_ja?.trim() || null,
      concept: form.concept_ko?.trim() || form.concept_en?.trim() || form.concept_ja?.trim() || null,
      concept_ko: form.concept_ko?.trim() || null,
      concept_en: form.concept_en?.trim() || null,
      concept_ja: form.concept_ja?.trim() || null,
      start_date: form.start_date || null,
      prize_grand: form.prize_grand?.trim() || null,
      prize_excellence: form.prize_excellence?.trim() || null,
      prize_merit: form.prize_merit?.trim() || null,
      prize_audience: form.prize_audience?.trim() || null,
      prize_audience_count: form.prize_audience_count ?? 1,
      template_url: form.templateUrl.trim() || null,
      exchange_rate_usd_krw: form.exchange_rate_usd_krw ?? 1350,
      exchange_rate_usd_jpy: form.exchange_rate_usd_jpy ?? 148,
      base_currency: form.base_currency ?? "USD",
    })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  revalidatePath("/competition");
  revalidatePath(`/competition/${id}`);
  return { ok: true };
}

export async function updateCompetitionStatusAction(id: string, status: string): Promise<AdminResult> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error ?? "Unauthorized" };
  const { service } = auth;
  const { error } = await service.from("competitions").update({ status }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  revalidatePath("/competition");
  return { ok: true };
}

export async function deleteCompetitionAction(id: string): Promise<{ ok: boolean; message?: string }> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error ?? "Unauthorized" };
  const { service } = auth;

  const { error } = await service.from("competitions").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  revalidatePath("/competition");
  return { ok: true };
}

export async function setVideoFinalistAction(videoId: string, finalist: boolean): Promise<AdminResult> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error ?? "Unauthorized" };
  const { service, user } = auth;
  const { data, error } = await service
    .from("videos")
    .update({ is_finalist: finalist })
    .eq("id", videoId)
    .select("id, title, uploaded_by")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (data?.uploaded_by && finalist) {
    await createNotification({
      userId: data.uploaded_by as string,
      actorId: user.id,
      type: "competition_result",
      title: "Finalist selected",
      body: `${(data.title as string) ?? "Your film"} has been selected as a finalist.`,
      href: `/watch/${videoId}`,
      entityType: "video",
      entityId: videoId,
    });
  }
  revalidatePath("/admin");
  revalidatePath("/competition");
  return { ok: true };
}

export async function setVideoOriginalAction(videoId: string, isOriginal: boolean): Promise<{ ok: boolean; message?: string }> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error ?? "Unauthorized" };
  const { service } = auth;

  const { error } = await service.from("videos").update({ is_original: isOriginal }).eq("id", videoId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/films");
  return { ok: true };
}

export async function setVideoAwardAction(videoId: string, award: string): Promise<AdminResult> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error ?? "Unauthorized" };
  const { service, user } = auth;
  const value = award.trim() || null;
  const { data, error } = await service
    .from("videos")
    .update({ award: value })
    .eq("id", videoId)
    .select("id, title, uploaded_by")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (data?.uploaded_by && value) {
    await createNotification({
      userId: data.uploaded_by as string,
      actorId: user.id,
      type: "competition_result",
      title: "Competition winner selected",
      body: `${(data.title as string) ?? "Your film"} · ${value}`,
      href: `/watch/${videoId}`,
      entityType: "video",
      entityId: videoId,
    });
  }
  revalidatePath("/admin");
  revalidatePath("/competition");
  return { ok: true };
}

/** Single-competition submissions for admin expand panel (likes from `likes` table; no `videos.like_count` column). */
export type CompetitionSubmissionVideo = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number | null;
  created_at: string;
  like_count: number;
  is_finalist: boolean;
  is_original: boolean;
  is_competition_featured: boolean;
  award: string | null;
  visibility: "public" | "private";
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

export async function getCompetitionVideosAction(competitionId: string): Promise<CompetitionSubmissionVideo[]> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return [];
  // Admin needs to see private competition submissions too — service role
  // is required because videos_select_visible only exposes public + own.
  const { service, supabase } = auth;
  const cid = competitionId.trim();
  if (!cid) return [];

  const { data, error } = await service
    .from("videos")
    .select(
      "id, title, thumbnail_url, view_count, created_at, is_finalist, is_original, is_competition_featured, award, visibility, profiles!videos_uploaded_by_fkey(display_name, avatar_url)",
    )
    .eq("submitted_competition_id", cid)
    .eq("purpose", "competition")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getCompetitionVideosAction]", error.message);
    return [];
  }

  const rows = data ?? [];
  const ids = rows.map((r) => r.id as string);
  const likeCountMap = new Map<string, number>();
  if (ids.length > 0) {
    const { data: likeRows, error: likesErr } = await supabase.from("likes").select("video_id").in("video_id", ids);
    if (likesErr) {
      console.error("[getCompetitionVideosAction] likes", likesErr.message);
    } else {
      for (const row of likeRows ?? []) {
        const vid = row.video_id as string;
        likeCountMap.set(vid, (likeCountMap.get(vid) ?? 0) + 1);
      }
    }
  }

  return rows.map((v) => ({
    id: v.id as string,
    title: (v.title as string) ?? "",
    thumbnail_url: (v.thumbnail_url as string | null) ?? null,
    view_count: (v.view_count as number | null) ?? null,
    created_at: v.created_at as string,
    like_count: likeCountMap.get(v.id as string) ?? 0,
    is_finalist: Boolean(v.is_finalist),
    is_original: Boolean(v.is_original),
    is_competition_featured: Boolean(v.is_competition_featured),
    award: (v.award as string | null) ?? null,
    visibility: (v.visibility as "public" | "private") ?? "public",
    profiles: (Array.isArray(v.profiles) ? v.profiles[0] : v.profiles) as CompetitionSubmissionVideo["profiles"] ?? null,
  }));
}

export async function toggleCompetitionFeaturedAction(videoId: string, featured: boolean): Promise<AdminResult> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error ?? "Unauthorized" };
  const { service } = auth;

  const { data: video, error: fetchErr } = await service
    .from("videos")
    .select("id, submitted_competition_id, purpose")
    .eq("id", videoId)
    .maybeSingle();

  if (fetchErr) return { ok: false, message: fetchErr.message };
  if (!video) return { ok: false, message: "영상을 찾을 수 없습니다." };
  if (video.purpose !== "competition" || !video.submitted_competition_id) {
    return { ok: false, message: "공모전 출품작이 아닙니다." };
  }

  const { error } = await service.from("videos").update({ is_competition_featured: featured }).eq("id", videoId);

  if (error) {
    console.error("[toggleCompetitionFeaturedAction]", error.message);
    return { ok: false, message: error.message };
  }

  revalidatePath(`/competition/${video.submitted_competition_id as string}`);
  revalidatePath("/competition");
  revalidatePath("/admin");
  return { ok: true };
}

/** 공모전 행 `competitions.is_featured` (목록 추천). 영상용 `toggleCompetitionFeaturedAction`과 구분. */
export async function toggleCompetitionFeaturedFlagAction(competitionId: string, featured: boolean): Promise<AdminResult> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error ?? "Unauthorized" };
  const { service } = auth;

  const { error } = await service.from("competitions").update({ is_featured: featured }).eq("id", competitionId);

  if (error) {
    console.error("[toggleCompetitionFeaturedFlagAction]", error.message);
    return { ok: false, message: error.message };
  }

  revalidatePath("/competition");
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}
