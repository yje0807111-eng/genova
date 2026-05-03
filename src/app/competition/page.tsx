import { CompetitionListClient } from "@/components/competition/competition-list-client";
import { CompetitionHero } from "@/components/competition/competition-hero";
import { fetchAllCompetitions } from "@/lib/queries";

export default async function CompetitionPage() {
  const competitions = await fetchAllCompetitions();
  const now = new Date();
  const active = competitions.filter((c) =>
    ["Open", "접수중", "결선 진행중", "In Review", "Voting"].includes(c.status),
  );
  const upcoming = competitions.filter((c) => c.status === "Upcoming" || c.status === "예정");
  const closed = competitions.filter(
    (c) => !["Open", "접수중", "결선 진행중", "In Review", "Voting", "Upcoming", "예정"].includes(c.status),
  );

  return (
    <div className="bg-[#080618] text-white">
      <CompetitionHero activeCount={active.length} upcomingCount={upcoming.length} />

      {/* Tab filters - client component */}
      <div className="bg-[#080618]">
        <div className="mx-auto max-w-[1680px] px-16 py-12">
          <CompetitionListClient
            active={active}
            upcoming={upcoming}
            closed={closed}
            now={now.toISOString()}
          />
        </div>
      </div>
    </div>
  );
}
