import { redirect } from "next/navigation";
import { AnimateIn } from "@/components/animate-in";
import { UploadVideoForm } from "@/components/upload/upload-video-form";
import { fetchCompetitionsForUpload } from "@/lib/queries";
import { ensureProfile } from "@/lib/queries/profile-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function UploadPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  await ensureProfile(user.id, user.email);

  const competitions = await fetchCompetitionsForUpload();

  return (
    <div className="page-cinematic mx-auto max-w-6xl space-y-5 px-5 py-8 text-[#F8F7FF] sm:px-8 sm:py-10">
        <AnimateIn delay={0}>
        <div className="space-y-2">
          <p className="eyebrow">Upload</p>
          <h1 className="page-title text-3xl sm:text-4xl">Upload Film</h1>
          <p className="page-subtitle">Publish your work with a cinematic thumbnail, tags, and release details.</p>
        </div>
        </AnimateIn>
        <AnimateIn delay={0.1}>
          <UploadVideoForm userId={user.id} competitions={competitions} />
        </AnimateIn>
    </div>
  );
}
