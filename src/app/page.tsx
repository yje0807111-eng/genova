import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import {
  fetchCurrentCompetition,
  fetchOriginalVideos,
  fetchVideosWithCreators,
} from "@/lib/queries";
import { fetchHeroAwardVideosForCompetition } from "@/lib/queries/films-hero-award-videos";
import { fetchCompetitionStats } from "@/lib/queries/competition-stats";
import { HomePageClient } from "@/components/genova/home-page-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  const initialTab = params.tab === "films" ? "films" : "recommended";
  const supabase = await createServerSupabaseClient();
  let isLoggedIn = false;
  let followingVideos: Awaited<ReturnType<typeof fetchVideosWithCreators>> = [];

  if (supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      isLoggedIn = Boolean(user);
    } catch {
      isLoggedIn = false;
    }
  }

  const [rawVideos, rawOriginals, competition, competitionStats] = await Promise.all([
    fetchVideosWithCreators({ limit: 50 }),
    fetchOriginalVideos(),
    fetchCurrentCompetition(),
    fetchCompetitionStats(),
  ]);

  const [videosWithE, originalsWithE] = await Promise.all([
    attachEngagementToVideos(rawVideos),
    attachEngagementToVideos(rawOriginals),
  ]);

  const uploadedFirst = [...videosWithE].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));

  const heroAwardVideos = competition?.id
    ? await fetchHeroAwardVideosForCompetition(competition.id)
    : { grandPrize: null, excellence: null, merit: null, audience: null };

  return (
    <HomePageClient
      videosFromDb={uploadedFirst}
      competitionDeadlineIso={competition?.deadline ?? null}
      competition={competition}
      competitionStats={competitionStats}
      originals={originalsWithE}
      followingVideos={followingVideos}
      becauseYouWatched={[]}
      isLoggedIn={isLoggedIn}
      heroAwardVideos={heroAwardVideos}
      initialTab={initialTab}
    />
  );
}
