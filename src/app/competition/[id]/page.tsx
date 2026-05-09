import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CompetitionDetailClient } from "@/components/competition/competition-detail-client";

export const dynamic = "force-dynamic";

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
    .select("*, profiles!videos_uploaded_by_fkey(display_name, avatar_url)")
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
  return data ?? [];
}

async function fetchFeaturedVideos(competitionId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("videos")
    .select("*, profiles!videos_uploaded_by_fkey(display_name, avatar_url)")
    .eq("purpose", "competition")
    .eq("submitted_competition_id", competitionId)
    .eq("visibility", "public")
    .eq("is_competition_featured", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchFeaturedVideos]", error);
    return [];
  }

  return data ?? [];
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
