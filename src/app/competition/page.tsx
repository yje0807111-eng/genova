import type { Metadata } from "next";
import { CompetitionListClient } from "@/components/competition/competition-list-client";
import { FeaturedHeroCarousel } from "@/components/competition/featured-hero-carousel";
import { CompetitionMobileBrowse } from "@/components/competition/competition-mobile-browse";
import { fetchAllCompetitions } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Competitions",
  description:
    "Submit your AI-generated film to active competitions and compete for prizes. Discover ongoing contests across the Genova community.",
  openGraph: {
    title: "Competitions | Genova",
    description:
      "Submit your AI-generated film to active competitions and compete for prizes.",
  },
};


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

  // Per-competition participant counts (unique uploaded_by)
  const participantCountMap: Record<string, number> = {};
  if (supabase) {
    const { data: submittedVideos } = await supabase
      .from("videos")
      .select("submitted_competition_id, uploaded_by")
      .eq("purpose", "competition")
      .eq("visibility", "public")
      .not("submitted_competition_id", "is", null);

    for (const v of submittedVideos ?? []) {
      const cid = v.submitted_competition_id as string;
      const uid = v.uploaded_by as string;
      if (!cid || !uid) continue;
      if (!participantCountMap[cid]) participantCountMap[cid] = 0;
      // unique uploaded_by per competition — use a Set approach
    }

    // Group by competition, count unique uploaded_by
    const grouped: Record<string, Set<string>> = {};
    for (const v of submittedVideos ?? []) {
      const cid = v.submitted_competition_id as string;
      const uid = v.uploaded_by as string;
      if (!cid || !uid) continue;
      if (!grouped[cid]) grouped[cid] = new Set();
      grouped[cid].add(uid);
    }
    for (const [cid, set] of Object.entries(grouped)) {
      participantCountMap[cid] = set.size;
    }
  }

  const featuredCompetitions = (active as any[]).filter((c) => c.is_featured);

  return (
    <div className="bg-[#0a0a0a] text-white">
      {/* 모바일 전용 — 캐러셀/밀집툴바 대신 피처카드+세로리스트 */}
      <CompetitionMobileBrowse
        active={active as any[]}
        upcoming={upcoming as any[]}
        closed={closed as any[]}
        participantCounts={participantCountMap}
      />

      {/* 데스크톱 — 기존 레이아웃 유지 */}
      <div className="hidden md:block">
        {featuredCompetitions.length > 0 && (
          <FeaturedHeroCarousel competitions={featuredCompetitions} />
        )}

        <div className="bg-[#0a0a0a]">
          <div className="mx-auto max-w-[1680px] px-4 pt-8 pb-12 sm:px-8 lg:px-12">
            <CompetitionListClient
              active={active as any[]}
              upcoming={upcoming as any[]}
              closed={closed as any[]}
              now={now.toISOString()}
              participantCounts={participantCountMap}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
