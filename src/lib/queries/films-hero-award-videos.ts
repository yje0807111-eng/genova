import { mapVideo } from "@/lib/mappers";
import { mergeVideoRows } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Video } from "@/lib/types";

/** Values admins can pick in Video Manage → Set Award (`video-manage.tsx` presets + custom strings). */
function normAward(award: string | null | undefined) {
  return award?.trim().toLowerCase() ?? "";
}

function awardIn(award: string | null | undefined, candidates: readonly string[]) {
  const n = normAward(award);
  return candidates.some((c) => c.toLowerCase() === n);
}

const GRAND_AWARDS = ["대상", "grand prize"] as const;
const EXCELLENCE_AWARDS = ["우수상", "금상", "excellence"] as const;
const MERIT_AWARDS = ["장려상", "은상", "동상", "merit"] as const;
const AUDIENCE_AWARDS = ["관객상", "audience award", "입선"] as const;

export type HeroAwardVideos = {
  grandPrize: Video | null;
  excellence: Video | null;
  merit: Video | null;
  audience: Video | null;
};

/**
 * Public award entries for the Films hero gallery (featured competition).
 * Joins uploader profile display_name for `mapVideo` → `uploaderDisplayName`.
 */
export async function fetchHeroAwardVideosForCompetition(competitionId: string): Promise<HeroAwardVideos> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { grandPrize: null, excellence: null, merit: null, audience: null };
  }

  const { data } = await supabase
    .from("videos")
    .select("*")
    .eq("submitted_competition_id", competitionId)
    .not("award", "is", null)
    .eq("visibility", "public");

  // Attach uploader display_name via public_profiles instead of FK embed.
  const enriched = await mergeVideoRows((data ?? []) as Parameters<typeof mapVideo>[0][]);
  const mapped = enriched.map((row) => mapVideo(row));

  return {
    grandPrize: mapped.find((v) => awardIn(v.award, GRAND_AWARDS)) ?? null,
    excellence: mapped.find((v) => awardIn(v.award, EXCELLENCE_AWARDS)) ?? null,
    merit: mapped.find((v) => awardIn(v.award, MERIT_AWARDS)) ?? null,
    audience: mapped.find((v) => awardIn(v.award, AUDIENCE_AWARDS)) ?? null,
  };
}
