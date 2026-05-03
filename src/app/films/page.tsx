import { FilmsComingSoon, FilmsVideoCard } from "@/components/films/films-video-card";
import { FilmsPageClient } from "@/components/films/films-page-client";
import { FILMS_GENRE_KEYS, FILMS_GENRE_LABELS } from "@/lib/constants/genres";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import { buildFilmsPageData } from "@/lib/films-page-data";
import { fetchVideosWithCreators } from "@/lib/queries";

export default async function FilmsPage() {
  const raw = await fetchVideosWithCreators();
  const videos = await attachEngagementToVideos(raw);
  const { originals, awardWinners, editorsPicks, genreSpotlight } = buildFilmsPageData(videos);

  return (
    <FilmsPageClient
      originals={originals}
      awardWinners={awardWinners}
      editorsPicks={editorsPicks}
      genreSpotlight={genreSpotlight}
      allVideos={videos}
    />
  );
}
