import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AnimateIn } from "@/components/animate-in";
import { LotteryCounter } from "@/components/lottery/lottery-counter";
import { UploadVideoFormSimple } from "@/components/upload/upload-video-form-simple";
import { fetchCompetitionsForUpload, fetchCurrentCompetition } from "@/lib/queries";
import { fetchMyMonthlyTicketCount } from "@/lib/queries/lottery-queries";
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

  const [competitions, currentCompetition, lotteryCount] = await Promise.all([
    fetchCompetitionsForUpload(),
    fetchCurrentCompetition(),
    fetchMyMonthlyTicketCount(user.id),
  ]);

  return (
    <AnimateIn delay={0}>
      {/* Server-rendered lottery counter pinned above the form so
          the uploader sees their current cap before deciding whether
          to check the attestation box below. */}
      {lotteryCount ? (
        <div className="mx-auto mb-4 max-w-[640px] px-4 sm:px-6">
          <LotteryCounter count={lotteryCount} variant="card" />
        </div>
      ) : null}
      <UploadVideoFormSimple
        userId={user.id}
        competitions={competitions}
        activeCompetitionId={currentCompetition?.id}
        prefilledCompetitionId={prefilledCompetitionId}
      />
    </AnimateIn>
  );
}
