import { AnimateIn } from "@/components/animate-in";
import { CompetitionPageClient } from "@/components/competition/competition-page-client";
import Link from "next/link";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import { fetchAwardedVideos, fetchCurrentCompetition, fetchFinalistVideos } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function CompetitionPage() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const canVote = Boolean(userData?.user);

  const competition = await fetchCurrentCompetition();
  const [finalistRaw, archiveVideos] = await Promise.all([fetchFinalistVideos(), fetchAwardedVideos()]);

  const finalistWithE = await attachEngagementToVideos(finalistRaw);
  const finalistSorted = [...finalistWithE].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
  const rankedFinalists = finalistSorted.map((video, i) => ({ video, rank: i + 1 }));
  const archiveWithE = await attachEngagementToVideos(archiveVideos);

  const dDay = competition
    ? Math.max(
        0,
        Math.ceil((new Date(competition.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      )
    : 0;

  return (
    <div className="page-cinematic mx-auto max-w-6xl space-y-6 px-4 py-7 text-[#F8F7FF] sm:px-6">
        <AnimateIn delay={0} className="space-y-2">
          <p className="eyebrow">Competition</p>
          <h1 className="page-title text-3xl sm:text-4xl">Competition Showcase</h1>
          <p className="page-subtitle">Explore finalists, vote for your favorite, and submit your own film.</p>
        </AnimateIn>
        <AnimateIn delay={0.05}>
          <CompetitionPageClient
          competition={
            competition
              ? { id: competition.id, title: competition.title, prizeInfo: competition.prizeInfo }
              : null
          }
          dDay={dDay}
          rankedFinalists={rankedFinalists}
          archiveVideos={archiveWithE}
          canVote={canVote}
          />
        </AnimateIn>

        <AnimateIn delay={0.1} className="rounded-xl border border-white/10 bg-[#1A1535]/75 p-5 sm:p-6">
          <h2 className="text-lg font-bold">Submit Entry</h2>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/upload"
              className="inline-flex w-fit rounded-[6px] bg-[#534AB7] px-4 py-2 text-sm font-semibold text-[#EEEDFE] transition hover:bg-[#655cd0]"
            >
              Submit Now
            </Link>
            <p className="text-xs text-[#AFA9EC]">Choose Competition Entry on the upload page.</p>
          </div>
        </AnimateIn>
    </div>
  );
}
