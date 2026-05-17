import type { Metadata } from "next";
import { LandingClient } from "@/components/landing/landing-client";
import { fetchTrendingVideosByLikes } from "@/lib/queries/search-queries";
import { fetchActiveCompetitions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Genova",
  description:
    "Learn about Genova — the streaming home of AI filmmakers. Browse trending films, active competitions, and creator stories.",
  openGraph: {
    title: "About Genova",
    description:
      "Learn about Genova — the streaming home of AI filmmakers.",
  },
};

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
        titleEn: c.titleEn ?? null,
        titleKo: c.titleKo ?? null,
        titleJa: c.titleJa ?? null,
        genre: c.genre ?? null,
        sponsor: c.sponsor ?? null,
        thumbnailUrl: c.thumbnailUrl ?? null,
        prizeInfo: c.prizeInfo ?? null,
        prizeInfoEn: c.prizeInfoEn ?? null,
        prizeInfoKo: c.prizeInfoKo ?? null,
        prizeInfoJa: c.prizeInfoJa ?? null,
        deadline: c.deadline ?? null,
      }))}
    />
  );
}
