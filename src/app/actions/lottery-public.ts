"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type PublicMonthlyWinner = {
  id: string;
  prizeTier: number;
  prizeAmountUsd: number;
  drawMonthKey: string;
  creatorName: string;
  videoId: string | null;
  videoTitle: string | null;
};

function kstMonthKey(): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  return `${p.find((x) => x.type === "year")?.value}-${p.find((x) => x.type === "month")?.value}`;
}

/**
 * Public-safe current-month winners for the global winners popup.
 * Reads the owner-runs public_monthly_winners view (no claim_token).
 */
export async function getCurrentMonthWinners(
  monthKey?: string,
): Promise<{ monthKey: string; winners: PublicMonthlyWinner[] }> {
  const supabase = await createServerSupabaseClient();
  const mk = monthKey?.trim() || kstMonthKey();
  if (!supabase) return { monthKey: mk, winners: [] };

  const { data } = await supabase
    .from("public_monthly_winners")
    .select("id, draw_month_key, user_id, prize_tier, prize_amount_usd, video_id")
    .eq("draw_month_key", mk)
    .order("prize_tier", { ascending: true });

  if (!data || data.length === 0) return { monthKey: mk, winners: [] };

  const userIds = [...new Set(data.map((r) => r.user_id as string))];
  const videoIds = [
    ...new Set(data.map((r) => r.video_id as string | null).filter(Boolean)),
  ] as string[];

  const [{ data: profs }, vidsRes] = await Promise.all([
    supabase.from("public_profiles").select("id, display_name").in("id", userIds),
    videoIds.length
      ? supabase.from("videos").select("id, title").in("id", videoIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const nameMap = new Map(
    (profs ?? []).map((p) => [p.id as string, (p.display_name as string | null) ?? ""]),
  );
  const titleMap = new Map(
    (vidsRes.data ?? []).map((v) => [v.id as string, (v.title as string) ?? ""]),
  );

  return {
    monthKey: mk,
    winners: data.map((r) => ({
      id: r.id as string,
      prizeTier: r.prize_tier as number,
      prizeAmountUsd: r.prize_amount_usd as number,
      drawMonthKey: r.draw_month_key as string,
      creatorName: nameMap.get(r.user_id as string) || "Creator",
      videoId: (r.video_id as string | null) ?? null,
      videoTitle: r.video_id ? titleMap.get(r.video_id as string) ?? null : null,
    })),
  };
}
