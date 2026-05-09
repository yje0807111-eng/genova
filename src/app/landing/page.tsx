import { LandingClient } from "@/components/landing/landing-client";
import { fetchTrendingVideosByLikes } from "@/lib/queries/search-queries";
import { fetchActiveCompetitions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const trendingVideos = await fetchTrendingVideosByLikes(12);
  const featuredCompetitions = await fetchActiveCompetitions(2).catch(() => []);

  return (
    <LandingClient
      trendingVideos={trendingVideos.map((v) => ({
        id: v.id,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl ?? null,
      }))}
      featuredCompetitions={featuredCompetitions.map((c) => ({
        id: c.id,
        title: c.title,
        genre: c.genre ?? null,
        sponsor: c.sponsor ?? null,
        thumbnailUrl: c.thumbnailUrl ?? null,
        prizeInfo: c.prizeInfo ?? null,
        deadline: c.deadline ?? null,
      }))}
    />
  );
}
