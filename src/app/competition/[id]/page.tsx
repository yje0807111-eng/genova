import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mapVideo } from "@/lib/mappers";
import { mergeVideoRows } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CompetitionDetailClient } from "@/components/competition/competition-detail-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const competition = await fetchCompetitionById(id);
  if (!competition) return { title: "Competition not found" };
  const title = (competition.title as string) || "Competition";
  const sponsor = (competition.sponsor as string | null)?.trim();
  const prize = (competition.prize_info as string | null)?.trim();
  const description =
    (competition.description as string | null)?.trim() ||
    [sponsor ? `Hosted by ${sponsor}.` : null, prize ? `Prize pool: ${prize}.` : null, "Submit your AI film and compete on Genova."]
      .filter(Boolean)
      .join(" ");
  const ogImage =
    (competition.banner_url as string | null)?.trim() ||
    (competition.thumbnail_url as string | null)?.trim() ||
    undefined;
  return {
    title,
    description,
    openGraph: {
      title: `${title} | Genova Competition`,
      description,
      images: ogImage ? [{ url: ogImage, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Genova Competition`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

async function fetchCompetitionById(id: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.from("competitions").select("*").eq("id", id).single();
  return data ?? null;
}

async function fetchCompetitionVideos(competitionId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("purpose", "competition")
    .eq("submitted_competition_id", competitionId)
    .eq("visibility", "public")
    .order("view_count", { ascending: false });
  console.log("[COMP_VIDEOS_DEBUG]", {
    competitionId,
    count: data?.length ?? 0,
    videos: data?.map((v) => ({ id: v.id, title: v.title })) ?? [],
    error: error ? { message: error.message, code: error.code } : null,
  });
  // Attach uploader display_name / avatar_url via public_profiles.
  return await mergeVideoRows((data ?? []) as Parameters<typeof mapVideo>[0][]);
}

async function fetchFeaturedVideos(competitionId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("purpose", "competition")
    .eq("submitted_competition_id", competitionId)
    .eq("visibility", "public")
    .eq("is_competition_featured", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchFeaturedVideos]", error);
    return [];
  }

  return await mergeVideoRows((data ?? []) as Parameters<typeof mapVideo>[0][]);
}

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [competition, videos, featuredVideos] = await Promise.all([
    fetchCompetitionById(id),
    fetchCompetitionVideos(id),
    fetchFeaturedVideos(id),
  ]);
  if (!competition) notFound();

  return (
    <CompetitionDetailClient competition={competition} videos={videos} featuredVideos={featuredVideos} />
  );
}
