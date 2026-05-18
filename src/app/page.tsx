import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import {
  fetchCurrentCompetition,
  fetchOriginalVideos,
  fetchVideosWithCreators,
} from "@/lib/queries";
import { fetchHeroAwardVideosForCompetition } from "@/lib/queries/films-hero-award-videos";
import {
  fetchAwardWinnersRail,
  fetchContinueWatchingRail,
} from "@/lib/queries/films-rails";
import { fetchCompetitionStats } from "@/lib/queries/competition-stats";
import { HomePageClient } from "@/components/genova/home-page-client";
import { HomeCompetitionBanner } from "@/components/genova/home-competition-banner";
import { FilmsRails } from "@/components/films/films-rails";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  const initialTab = params.tab === "competition" ? "competition" : "films";
  const supabase = await createServerSupabaseClient();
  let isLoggedIn = false;
  let currentUserId: string | null = null;
  const followingVideos: Awaited<ReturnType<typeof fetchVideosWithCreators>> = [];

  if (supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      isLoggedIn = Boolean(user);
      currentUserId = user?.id ?? null;
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

  // F4: Films Beta 2 rails — only prefetch when the user is actually
  // landing on the Films tab.  Three parallel queries are tiny but the
  // Recommended tab doesn't surface them, so saving the round-trips
  // when not needed is the cleaner default.  Continue Watching is
  // user-specific and returns [] for signed-out callers.
  const [heroAwardVideos, awardWinnersRail, continueWatchingRail] =
    await Promise.all([
      competition?.id
        ? fetchHeroAwardVideosForCompetition(competition.id)
        : Promise.resolve({
            grandPrize: null,
            excellence: null,
            merit: null,
            audience: null,
          }),
      initialTab === "films" ? fetchAwardWinnersRail() : Promise.resolve([]),
      initialTab === "films"
        ? fetchContinueWatchingRail(currentUserId)
        : Promise.resolve([]),
    ]);

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
      competitionBannerSlot={
        /* B.2-8a: banner is async server now.  Render once on the
           server so the locale-aware copy + stat cards ship as
           static HTML, then thread through the client shell. */
        <HomeCompetitionBanner competition={competition} stats={competitionStats} />
      }
      filmsRailsSlot={
        /* F4: only ship rails markup when initialTab === "films".
           Empty arrays render nothing (FilmsRails returns null), so
           this is also harmless for users with no series / awards /
           watch history. */
        initialTab === "films" ? (
          <FilmsRails
            awardWinners={awardWinnersRail}
            continueWatching={continueWatchingRail}
          />
        ) : null
      }
    />
  );
}
