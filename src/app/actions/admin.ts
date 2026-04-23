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
}): Promise<AdminResult> {
  const auth = await requireAdmin();
if ("error" in auth) return { ok: false, message: auth.error ?? "" };
  const { supabase } = auth;
  const { error } = await supabase.from("competitions").insert({
    id: form.id.trim(),
    title: form.title.trim(),
    genre: form.genre.trim() || "All",
    status: form.status.trim() || "Open",
    deadline: form.deadline,
    vote_end: form.voteEnd,
    prize_info: form.prizeInfo.trim(),
    sponsor: form.sponsor.trim(),
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  revalidatePath("/competition");
  return { ok: true };
}

export async function updateCompetitionStatusAction(id: string, status: string): Promise<AdminResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error };
  const { supabase } = auth;
  const { error } = await supabase.from("competitions").update({ status }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin");
  revalidatePath("/competition");
  return { ok: true };
}

export async function setVideoFinalistAction(videoId: string, finalist: boolean): Promise<AdminResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error };
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

export async function setVideoAwardAction(videoId: string, award: string): Promise<AdminResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error };
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
