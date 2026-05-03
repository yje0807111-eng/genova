import { notFound, redirect } from "next/navigation";
import { AnimateIn } from "@/components/animate-in";
import { EditVideoForm } from "@/components/upload/edit-video-form";
import { fetchCompetitionsForUpload } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: video } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .eq("uploaded_by", user.id)
    .single();

  if (!video) notFound();

  const competitions = await fetchCompetitionsForUpload();

  return (
    <div className="page-cinematic px-4 py-6 text-[#F8F7FF] sm:px-6">
      <AnimateIn delay={0}>
        <EditVideoForm userId={user.id} video={video} competitions={competitions} />
      </AnimateIn>
    </div>
  );
}
