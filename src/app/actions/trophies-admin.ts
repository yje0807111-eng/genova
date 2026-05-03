"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth/admin";
import { FILMS_GENRE_KEYS, MAIN_GENRE_LABELS, type MainGenreKey } from "@/lib/constants/genres";
import { createNotification } from "@/lib/notifications";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

type AdminResult = { ok: true } | { ok: false; message: string };

type RequireAdminResult =
  | { error: string }
  | { supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>; user: User };

async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Please check your Supabase configuration." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  if (!isAdminEmail(user.email)) return { error: "Access denied." };
  return { supabase, user };
}

function parseWeekStartDate(input: string): string | null {
  const t = input.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const d = new Date(`${t}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return t;
}

/** Monday 00:00 UTC of the calendar week containing `d`, as YYYY-MM-DD. */
function mondayOfWeekContaining(d: Date): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const offset = (day + 6) % 7;
  x.setUTCDate(x.getUTCDate() - offset);
  return x.toISOString().slice(0, 10);
}

function previousWeekMondayUtc(): string {
  const now = new Date();
  const thisMon = new Date(`${mondayOfWeekContaining(now)}T00:00:00.000Z`);
  thisMon.setUTCDate(thisMon.getUTCDate() - 7);
  return thisMon.toISOString().slice(0, 10);
}

function weekEndExclusive(weekStart: string): string {
  const d = new Date(`${weekStart}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString();
}

const COMPETITION_AWARDS = ["대상", "금상", "은상", "입선", "장려상"] as const;
export type CompetitionAward = (typeof COMPETITION_AWARDS)[number];

export async function grantCompetitionTrophyAction(input: {
  userId: string;
  competitionId: string;
  award: string;
}): Promise<AdminResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error };
  const svc = createServiceSupabaseClient();
  if (!svc) {
    return { ok: false, message: "Set SUPABASE_SERVICE_ROLE_KEY on the server to manage trophies." };
  }

  const award = input.award.trim() as CompetitionAward;
  if (!COMPETITION_AWARDS.includes(award)) {
    return { ok: false, message: "Invalid award." };
  }
  const userId = input.userId.trim();
  const competitionId = input.competitionId.trim();
  if (!userId || !competitionId) return { ok: false, message: "User and competition are required." };

  const { data: comp, error: cErr } = await svc.from("competitions").select("id, title").eq("id", competitionId).maybeSingle();
  if (cErr || !comp) return { ok: false, message: cErr?.message ?? "Competition not found." };

  const { error: insErr } = await svc.from("trophies").insert({
    user_id: userId,
    type: "competition",
    rank: null,
    genre: null,
    competition_id: competitionId,
    award,
    week_start: null,
  });
  if (insErr) {
    if (insErr.code === "23505") return { ok: false, message: "This user already has a trophy for this competition." };
    return { ok: false, message: insErr.message };
  }

  const compTitle = comp.title as string;
  await createNotification(svc, {
    userId,
    actorId: null,
    type: "trophy",
    title: `🏆 축하합니다! [${compTitle}] ${award} 수상`,
    body: null,
    href: `/profile/${userId}`,
    entityType: "trophy",
    entityId: competitionId,
  });

  revalidatePath("/admin");
  revalidatePath(`/profile/${userId}`);
  return { ok: true };
}

/**
 * Weekly genre trophies: top 3 distinct uploaders per main genre by `view_count` among
 * public videos uploaded in `[weekStart, weekStart+7d)` (UTC).
 */
export async function runWeeklyGenreTrophiesAction(weekStartInput?: string): Promise<AdminResult> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error };
  const svc = createServiceSupabaseClient();
  if (!svc) {
    return { ok: false, message: "Set SUPABASE_SERVICE_ROLE_KEY on the server to manage trophies." };
  }

  const weekStart = weekStartInput?.trim() ? parseWeekStartDate(weekStartInput) : previousWeekMondayUtc();
  if (!weekStart) return { ok: false, message: "weekStart must be YYYY-MM-DD (Monday recommended)." };

  const weekStartIso = `${weekStart}T00:00:00.000Z`;
  const weekEndIso = weekEndExclusive(weekStart);

  const { error: delErr } = await svc.from("trophies").delete().eq("type", "weekly_genre").eq("week_start", weekStart);
  if (delErr) return { ok: false, message: delErr.message };

  const genres = [...FILMS_GENRE_KEYS];

  for (const genre of genres) {
    const { data: rows, error: qErr } = await svc
      .from("videos")
      .select("id, uploaded_by, view_count, created_at")
      .eq("visibility", "public")
      .eq("genre", genre)
      .gte("created_at", weekStartIso)
      .lt("created_at", weekEndIso)
      .not("uploaded_by", "is", null)
      .order("view_count", { ascending: false })
      .order("created_at", { ascending: true });

    if (qErr || !rows?.length) continue;

    const seen = new Set<string>();
    const picks: { userId: string; rank: number }[] = [];
    for (const row of rows) {
      const uid = row.uploaded_by as string | null;
      if (!uid || seen.has(uid)) continue;
      seen.add(uid);
      picks.push({ userId: uid, rank: picks.length + 1 });
      if (picks.length >= 3) break;
    }

    const label = MAIN_GENRE_LABELS[genre as MainGenreKey] ?? genre;

    for (const { userId, rank } of picks) {
      const { error: insErr } = await svc.from("trophies").insert({
        user_id: userId,
        type: "weekly_genre",
        rank,
        genre,
        competition_id: null,
        award: null,
        week_start: weekStart,
      });
      if (insErr) {
        if (insErr.code !== "23505") return { ok: false, message: insErr.message };
        continue;
      }

      await createNotification(svc, {
        userId,
        actorId: null,
        type: "trophy",
        title: `🏆 축하합니다! ${label} 주간 ${rank}위 트로피를 획득했습니다.`,
        body: null,
        href: `/profile/${userId}`,
        entityType: "trophy",
        entityId: `${genre}:${weekStart}:${rank}`,
      });
    }
  }

  revalidatePath("/admin");
  revalidatePath("/competition");
  return { ok: true };
}
