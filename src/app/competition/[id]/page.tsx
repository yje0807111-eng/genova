import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CompetitionDetailClient } from "@/components/competition/competition-detail-client";

async function fetchCompetitionById(id: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.from("competitions").select("*").eq("id", id).single();
  return data ?? null;
}

async function fetchCompetitionVideos(competitionId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("videos")
    .select("*")
    .eq("purpose", "competition")
    .eq("visibility", "public")
    .order("view_count", { ascending: false });
  return data ?? [];
}

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const competition = await fetchCompetitionById(id);
  if (!competition) notFound();
  const videos = await fetchCompetitionVideos(id);

  return <CompetitionDetailClient competition={competition} videos={videos} />;
}
