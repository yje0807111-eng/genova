import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import {
  fetchCurrentCompetition,
  fetchOriginalVideos,
  fetchSpotlightCreators,
  fetchVideosWithCreators,
} from "@/lib/queries";
import { HomePageClient } from "@/components/genova/home-page-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  let isLoggedIn = false;
  let followingVideos: Awaited<ReturnType<typeof fetchVideosWithCreators>> = [];

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = Boolean(user);
  }

  const [rawVideos, rawOriginals, competition] = await Promise.all([
    fetchVideosWithCreators(),
    fetchOriginalVideos(),
    fetchCurrentCompetition(),
  ]);

  const [videosWithE, originalsWithE] = await Promise.all([
    attachEngagementToVideos(rawVideos),
    attachEngagementToVideos(rawOriginals),
  ]);

  let spotlightCreators: Awaited<ReturnType<typeof fetchSpotlightCreators>> = [];
  try {
    spotlightCreators = (await fetchSpotlightCreators()).slice(0, 5);
  } catch {
    spotlightCreators = [];
  }

  return (
    <HomePageClient
      useMockFallback={videosWithE.length === 0}
      videosFromDb={videosWithE}
      competitionDeadlineIso={competition?.deadline ?? null}
      competition={competition}
      originals={originalsWithE}
      spotlightCreators={spotlightCreators}
      followingVideos={followingVideos}
      becauseYouWatched={[]}
      isLoggedIn={isLoggedIn}
    />
  );
}
