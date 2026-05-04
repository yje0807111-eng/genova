import { FilmsComingSoon, FilmsVideoCard } from "@/components/films/films-video-card";
import { FilmsPageClient } from "@/components/films/films-page-client";
import { FILMS_GENRE_KEYS, FILMS_GENRE_LABELS } from "@/lib/constants/genres";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import { buildFilmsPageData } from "@/lib/films-page-data";
import { mapVideo } from "@/lib/mappers";
import { fetchVideosWithCreators } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function FilmsPage() {
  const raw = await fetchVideosWithCreators();
  const videos = await attachEngagementToVideos(raw);
  const { originals, awardWinners, editorsPicks, genreSpotlight } = buildFilmsPageData(videos);

  const supabase = await createServerSupabaseClient();
  let heroEyebrowKo = "";
  let heroEyebrowEn = "2ND GENOVA AI FILM COMPETITION";
  let heroEyebrowJa = "";
  if (supabase) {
    const [eyebrowKoRes, eyebrowEnRes, eyebrowJaRes] = await Promise.all([
      supabase.from("site_settings").select("value").eq("key", "films_hero_eyebrow_ko").maybeSingle(),
      supabase.from("site_settings").select("value").eq("key", "films_hero_eyebrow_en").maybeSingle(),
      supabase.from("site_settings").select("value").eq("key", "films_hero_eyebrow_ja").maybeSingle(),
    ]);

    heroEyebrowKo = eyebrowKoRes.data?.value ?? "";
    heroEyebrowEn = eyebrowEnRes.data?.value ?? "2ND GENOVA AI FILM COMPETITION";
    heroEyebrowJa = eyebrowJaRes.data?.value ?? "";
  }

  let featuredCompetitionId = "";
  let heroAwardVideos: {
    grandPrize: (typeof videos)[0] | null;
    excellence: (typeof videos)[0] | null;
    merit: (typeof videos)[0] | null;
    audience: (typeof videos)[0] | null;
  } = { grandPrize: null, excellence: null, merit: null, audience: null };

  if (supabase) {
    const { data: compSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "films_featured_competition_id")
      .maybeSingle();

    featuredCompetitionId = compSetting?.value ?? "";

    if (featuredCompetitionId) {
      const { data: awardVideos } = await supabase
        .from("videos")
        .select("*")
        .eq("submitted_competition_id", featuredCompetitionId)
        .not("award", "is", null);

      const mapped = (awardVideos ?? []).map((v) => mapVideo(v));

      const GRAND = ["대상", "Grand Prize", "grand prize"];
      const EXCELLENCE = ["우수상", "금상", "Excellence", "excellence"];
      const MERIT = ["장려상", "은상", "Merit", "merit"];
      const AUDIENCE = ["관객상", "Audience Award", "audience award", "입선"];

      heroAwardVideos = {
        grandPrize: mapped.find((v) => GRAND.includes(v.award ?? "")) ?? null,
        excellence: mapped.find((v) => EXCELLENCE.includes(v.award ?? "")) ?? null,
        merit: mapped.find((v) => MERIT.includes(v.award ?? "")) ?? null,
        audience: mapped.find((v) => AUDIENCE.includes(v.award ?? "")) ?? null,
      };
    }
  }

  return (
    <FilmsPageClient
      originals={originals}
      awardWinners={awardWinners}
      editorsPicks={editorsPicks}
      genreSpotlight={genreSpotlight}
      allVideos={videos}
      heroEyebrow={heroEyebrowEn}
      heroEyebrowKo={heroEyebrowKo}
      heroEyebrowEn={heroEyebrowEn}
      heroEyebrowJa={heroEyebrowJa}
      heroAwardVideos={heroAwardVideos}
    />
  );
}
