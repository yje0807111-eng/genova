import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AnimateIn } from "@/components/animate-in";
import { EditVideoFormSimple } from "@/components/upload/edit-video-form-simple";
import { fetchCompetitionsForUpload, fetchCurrentCompetition } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edit Film",
  robots: { index: false, follow: false },
};

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [{ data: video }, competitions, currentCompetition] = await Promise.all([
    supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("uploaded_by", user.id)
      .single(),
    fetchCompetitionsForUpload(),
    fetchCurrentCompetition(),
  ]);

  if (!video) notFound();

  return (
    <div className="page-cinematic px-4 py-6 text-[#F8F7FF] sm:px-6">
      <AnimateIn delay={0}>
        <EditVideoFormSimple
          video={video}
          userId={user.id}
          competitions={competitions}
          activeCompetitionId={currentCompetition?.id}
        />
      </AnimateIn>
    </div>
  );
}
