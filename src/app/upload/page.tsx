import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AnimateIn } from "@/components/animate-in";
import { UploadVideoFormSimple } from "@/components/upload/upload-video-form-simple";
import { fetchCompetitionsForUpload, fetchCurrentCompetition } from "@/lib/queries";
import { ensureProfile } from "@/lib/queries/profile-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Upload",
  robots: { index: false, follow: false },
};

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ competitionId?: string }>;
}) {
  const params = await searchParams;
  const prefilledCompetitionId = params.competitionId ?? null;
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  await ensureProfile(user.id, user.email);

  const [competitions, currentCompetition] = await Promise.all([
    fetchCompetitionsForUpload(),
    fetchCurrentCompetition(),
  ]);

  return (
    <AnimateIn delay={0}>
      <UploadVideoFormSimple
        userId={user.id}
        competitions={competitions}
        activeCompetitionId={currentCompetition?.id}
        prefilledCompetitionId={prefilledCompetitionId}
      />
    </AnimateIn>
  );
}
