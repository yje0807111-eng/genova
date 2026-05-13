import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function fetchCompetitionStats() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { activeCount: 0, totalPrizeUSD: 0, participantCount: 0 };

  const { data: activeCompetitions } = await supabase
    .from("competitions")
    .select("id, prize_grand, prize_excellence, prize_merit, prize_audience, prize_audience_count, base_currency, exchange_rate_usd_krw, exchange_rate_usd_jpy")
    .in("status", ["Open", "접수중", "In Review", "Voting"]);

  const activeCount = activeCompetitions?.length ?? 0;

  let totalPrizeUSD = 0;
  if (activeCompetitions) {
    for (const c of activeCompetitions) {
      const grand = parseFloat(String(c.prize_grand ?? 0)) || 0;
      const excellence = parseFloat(String(c.prize_excellence ?? 0)) || 0;
      const merit = parseFloat(String(c.prize_merit ?? 0)) || 0;
      const audience = (parseFloat(String(c.prize_audience ?? 0)) || 0) * (c.prize_audience_count ?? 1);
      const total = grand + excellence + merit + audience;

      if (c.base_currency === "KRW") {
        totalPrizeUSD += total / (c.exchange_rate_usd_krw ?? 1350);
      } else if (c.base_currency === "JPY") {
        totalPrizeUSD += total / (c.exchange_rate_usd_jpy ?? 150);
      } else {
        totalPrizeUSD += total;
      }
    }
  }

  const { data: videos } = await supabase
    .from("videos")
    .select("uploaded_by")
    .eq("purpose", "competition")
    .eq("visibility", "public");

  const uniqueParticipants = new Set(videos?.map((v) => v.uploaded_by) ?? []);

  return {
    activeCount,
    totalPrizeUSD: Math.round(totalPrizeUSD),
    participantCount: uniqueParticipants.size,
  };
}
