import { HomeAfterHero } from "@/components/home-after-hero";
import { HeroSection } from "@/components/hero-section";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import { fetchCreators, fetchCurrentCompetition, fetchOriginalVideos, fetchVideosWithCreators } from "@/lib/queries";

export default async function Home() {
  const [rawVideos, rawOriginals, creators, competition] = await Promise.all([
    fetchVideosWithCreators(),
    fetchOriginalVideos(),
    fetchCreators(),
    fetchCurrentCompetition(),
  ]);
  const videosWithE = await attachEngagementToVideos(rawVideos);
  const originalsWithE = await attachEngagementToVideos(rawOriginals);
  const uploadedFirst = [...videosWithE].sort((a, b) => {
    const aUploaded = a.uploadedBy ? 1 : 0;
    const bUploaded = b.uploadedBy ? 1 : 0;
    if (aUploaded !== bUploaded) return bUploaded - aUploaded;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const originals = originalsWithE.length > 0 ? originalsWithE : uploadedFirst.filter((video) => video.isOriginal);
  const latestVideos = uploadedFirst.slice(0, 8);
  const spotlightCreators = creators.slice(0, 3);
  const dDay = competition
    ? Math.max(
        0,
        Math.ceil((new Date(competition.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      )
    : 0;
  const heroCompetition = competition?.status?.toLowerCase() === "active"
    ? { title: competition.title, prizeInfo: competition.prizeInfo }
    : null;

  return (
    <div className="text-[#EEEDFE]">
      <HeroSection
        competition={heroCompetition}
        dDay={dDay}
      />
      <HomeAfterHero
        latestVideos={latestVideos}
        originals={originals}
        creators={spotlightCreators}
      />
    </div>
  );
}
