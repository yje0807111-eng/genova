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
  const { data: profile } = await supabase
    .from("profiles")
    .select("custom_ai_tools, hidden_ai_tools, saved_hashtags")
    .eq("id", user.id)
    .maybeSingle();
  const { data: recentVideos } = await supabase
    .from("videos")
    .select("tags")
    .eq("uploaded_by", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentTags = Array.from(
    new Set(
      (recentVideos ?? [])
        .flatMap((v) => (v.tags as string[]) ?? [])
        .filter(Boolean)
    )
  ).slice(0, 20);

  return (
    <div className="page-cinematic px-4 py-6 text-[#F8F7FF] sm:px-6">
      <AnimateIn delay={0}>
        <UploadVideoForm
          userId={user.id}
          competitions={competitions}
          userCustomTools={(profile?.custom_ai_tools as string[]) ?? []}
          userHiddenTools={(profile?.hidden_ai_tools as string[]) ?? []}
          savedHashtags={(profile?.saved_hashtags as string[]) ?? []}
          recentTags={recentTags}
        />
      </AnimateIn>
    </div>
  );
}
