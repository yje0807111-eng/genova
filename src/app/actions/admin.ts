"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth/admin";
import { createNotification } from "@/lib/notifications";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AdminResult = { ok: true } | { ok: false; message: string };

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Please check your Supabase configuration." } as const;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." } as const;
  if (!isAdminEmail(user.email)) return { error: "Access denied." } as const;
  return { supabase, user } as const;
}

export async function createCompetitionAction(form: {
  id: string;
  title: string;
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
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error ?? "Unauthorized" };
  const { supabase } = auth;
  const id = form.id.trim() || crypto.randomUUID();
  const { error } = await supabase.from("competitions").insert({
    id,
    title: form.title.trim(),
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
    templateUrl: string;
    exchange_rate_usd_krw?: number;
    exchange_rate_usd_jpy?: number;
    base_currency?: string;
  },
): Promise<AdminResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error ?? "Unauthorized" };
  const { supabase } = auth;

  const titleMain =
    form.title_ko?.trim() || form.title_en?.trim() || form.title_ja?.trim() || "";
  const prizeMain =
    form.prize_info_ko?.trim() ||
    form.prize_info_en?.trim() ||
    form.prize_info_ja?.trim() ||
    "";

  const { error } = await supabase
    .from("competitions")
    .update({
      title: titleMain,
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
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error ?? "Unauthorized" };
  const { supabase } = auth;
  const { error } = await supabase.from("competitions").update({ status }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  revalidatePath("/competition");
  return { ok: true };
}

export async function deleteCompetitionAction(id: string): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error ?? "Unauthorized" };

  const { error } = await supabase.from("competitions").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  revalidatePath("/competition");
  return { ok: true };
}

export async function setVideoFinalistAction(videoId: string, finalist: boolean): Promise<AdminResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error ?? "Unauthorized" };
  const { supabase, user } = auth;
  const { data, error } = await supabase
    .from("videos")
    .update({ is_finalist: finalist })
    .eq("id", videoId)
    .select("id, title, uploaded_by")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (data?.uploaded_by && finalist) {
    await createNotification(supabase, {
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
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error ?? "Unauthorized" };

  const { error } = await supabase.from("videos").update({ is_original: isOriginal }).eq("id", videoId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/films");
  return { ok: true };
}

export async function setVideoAwardAction(videoId: string, award: string): Promise<AdminResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error ?? "Unauthorized" };
  const { supabase, user } = auth;
  const value = award.trim() || null;
  const { data, error } = await supabase
    .from("videos")
    .update({ award: value })
    .eq("id", videoId)
    .select("id, title, uploaded_by")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (data?.uploaded_by && value) {
    await createNotification(supabase, {
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
