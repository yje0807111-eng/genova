import { FilmsComingSoon, FilmsVideoCard } from "@/components/films/films-video-card";
import { FilmsPageClient } from "@/components/films/films-page-client";
import { FILMS_GENRE_KEYS, FILMS_GENRE_LABELS } from "@/lib/constants/genres";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import { buildFilmsPageData } from "@/lib/films-page-data";
import { mapVideo } from "@/lib/mappers";
import { fetchVideosWithCreators } from "@/lib/queries";
import { fetchHeroAwardVideosForCompetition } from "@/lib/queries/films-hero-award-videos";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRecentProgress } from "@/app/actions/video-progress";

export default async function FilmsPage() {
  const raw = await fetchVideosWithCreators();
  const videos = await attachEngagementToVideos(raw);
  const { originals, awardWinners, editorsPicks, genreSpotlight } = buildFilmsPageData(videos);

  const supabase = await createServerSupabaseClient();
  const { data: userData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = userData?.user ?? null;
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

  let heroFeaturedCompetition: { id: string; deadline: string | null } | null = null;

  if (supabase) {
    const { data: compSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "films_featured_competition_id")
      .maybeSingle();

    featuredCompetitionId = compSetting?.value ?? "";

    if (featuredCompetitionId) {
      const { data: compRow } = await supabase
        .from("competitions")
        .select("id, deadline")
        .eq("id", featuredCompetitionId)
        .maybeSingle();

      if (compRow?.id) {
        heroFeaturedCompetition = {
          id: compRow.id,
          deadline: compRow.deadline ?? null,
        };
      }

      heroAwardVideos = await fetchHeroAwardVideosForCompetition(featuredCompetitionId);
    }
  }

  const recentProgress = await getRecentProgress(10);
  const continueWatchingItems = recentProgress
    .map((row) => {
      const rawVideo = row.video as Record<string, unknown> | null;
      if (!rawVideo) return null;
      const video = mapVideo(rawVideo as Parameters<typeof mapVideo>[0]);
      return {
        video,
        progressSeconds: row.progressSeconds,
        durationSeconds: row.durationSeconds,
      };
    })
    .filter((item): item is { video: (typeof videos)[number]; progressSeconds: number; durationSeconds: number } => item !== null);

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
      heroFeaturedCompetition={heroFeaturedCompetition}
      continueWatchingItems={continueWatchingItems}
      isLoggedIn={Boolean(user)}
    />
  );
}
