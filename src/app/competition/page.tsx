import { CompetitionListClient } from "@/components/competition/competition-list-client";
import { CompetitionHero } from "@/components/competition/competition-hero";
import { fetchAllCompetitions } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function parsePrizeToUSD(prizeInfo: string): number {
  if (!prizeInfo) return 0;
  // 달러
  const usdMatch = prizeInfo.match(/\$([0-9,]+)/);
  if (usdMatch) return parseInt(usdMatch[1].replace(/,/g, ""));
  // 만원 → USD (1350 기준)
  const wonMatch = prizeInfo.match(/([0-9,]+)만원/);
  if (wonMatch) {
    const krw = parseInt(wonMatch[1].replace(/,/g, "")) * 10000;
    return Math.round(krw / 1350);
  }
  // 원 단위
  const krwMatch = prizeInfo.match(/([0-9,]+)원/);
  if (krwMatch) {
    const krw = parseInt(krwMatch[1].replace(/,/g, ""));
    return Math.round(krw / 1350);
  }
  // ₩ 단위
  const wonSymbolMatch = prizeInfo.match(/₩([0-9,]+)/);
  if (wonSymbolMatch) {
    const krw = parseInt(wonSymbolMatch[1].replace(/,/g, ""));
    return Math.round(krw / 1350);
  }
  return 0;
}

export default async function CompetitionPage() {
  const supabase = await createServerSupabaseClient();
  const competitions = await fetchAllCompetitions();
  const now = new Date();
  const active = competitions.filter((c) =>
    ["Open", "접수중", "결선 진행중", "In Review", "Voting"].includes(c.status),
  );
  const upcoming = competitions.filter((c) => c.status === "Upcoming" || c.status === "예정");
  const closed = competitions.filter(
    (c) => !["Open", "접수중", "결선 진행중", "In Review", "Voting", "Upcoming", "예정"].includes(c.status),
  );

  // 총상금 — 종료되지 않은 공모전만 합산, 달러로 통일
  const totalPrizeUSD = competitions
    .filter((c) => !["Closed", "종료", "마감"].includes(c.status))
    .reduce((sum, c) => sum + parsePrizeToUSD(c.prize_info), 0);

  const totalPrizeLabel = totalPrizeUSD >= 1000
    ? `$${(totalPrizeUSD / 1000).toFixed(0)}K+`
    : totalPrizeUSD > 0
      ? `$${totalPrizeUSD}+`
      : "TBA";

  // 총 참가자 수
  const { count: totalParticipants } = supabase
    ? await supabase
      .from("videos")
      .select("*", { count: "exact", head: true })
      .eq("purpose", "competition")
      .eq("visibility", "public")
    : { count: 0 };

  return (
    <div className="bg-[#080618] text-white">
      <CompetitionHero
        activeCount={active.length}
        upcomingCount={upcoming.length}
        totalPrizeLabel={totalPrizeLabel}
        totalParticipants={totalParticipants ?? 0}
      />

      {/* Tab filters - client component */}
      <div className="bg-[#080618]">
        <div className="mx-auto max-w-[1680px] px-16 py-12">
          <CompetitionListClient
            active={active as any[]}
            upcoming={upcoming as any[]}
            closed={closed as any[]}
            now={now.toISOString()}
          />
        </div>
      </div>
    </div>
  );
}
