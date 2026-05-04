import { FilmsComingSoon, FilmsVideoCard } from "@/components/films/films-video-card";
import { FilmsPageClient } from "@/components/films/films-page-client";
import { FILMS_GENRE_KEYS, FILMS_GENRE_LABELS } from "@/lib/constants/genres";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import { buildFilmsPageData } from "@/lib/films-page-data";
import { fetchVideosWithCreators } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function FilmsPage() {
  const raw = await fetchVideosWithCreators();
  const videos = await attachEngagementToVideos(raw);
  const { originals, awardWinners, editorsPicks, genreSpotlight } = buildFilmsPageData(videos);

  const supabase = await createServerSupabaseClient();
  let heroEyebrow = "2ND GENOVA AI FILM COMPETITION";
  if (supabase) {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "films_hero_eyebrow")
      .maybeSingle();
    if (data?.value) heroEyebrow = data.value;
  }

  return (
    <FilmsPageClient
      originals={originals}
      awardWinners={awardWinners}
      editorsPicks={editorsPicks}
      genreSpotlight={genreSpotlight}
      allVideos={videos}
      heroEyebrow={heroEyebrow}
    />
  );
}
