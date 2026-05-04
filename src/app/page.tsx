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
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      isLoggedIn = Boolean(user);
    } catch {
      isLoggedIn = false;
    }
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

  const uploadedFirst = [...videosWithE].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));

  let spotlightCreators: Awaited<ReturnType<typeof fetchSpotlightCreators>> = [];
  try {
    spotlightCreators = (await fetchSpotlightCreators()).slice(0, 5);
  } catch {
    spotlightCreators = [];
  }

  return (
    <HomePageClient
      videosFromDb={uploadedFirst}
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
