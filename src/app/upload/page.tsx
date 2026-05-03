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
    <div className="page-cinematic px-4 py-6 text-[#F8F7FF] sm:px-6">
      <AnimateIn delay={0}>
        <UploadVideoForm userId={user.id} competitions={competitions} />
      </AnimateIn>
    </div>
  );
}
