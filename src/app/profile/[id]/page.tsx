import { notFound } from "next/navigation";
import { AnimateIn } from "@/components/animate-in";
import { ProfilePageClient } from "@/components/profile/public-profile-client";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import {
  fetchFollowCounts,
  fetchIsFollowing,
  fetchProfileById,
  fetchSavedVideos,
  fetchUploadedVideos,
  fetchUserAwards,
} from "@/lib/queries/profile-queries";
import { fetchTrophiesForUser } from "@/lib/queries/trophies-queries";
import type { Video } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ProfileByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createServerSupabaseClient();
  let currentUser: { id: string; email?: string | null } | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    currentUser = user;
  }

  const isOwner = Boolean(currentUser?.id === id);

  const profile = await fetchProfileById(id);
  if (!profile) notFound();

  const [counts, rawWorks, awards, trophies, initialFollowing, rawSaved] = await Promise.all([
    fetchFollowCounts(id),
    fetchUploadedVideos(id),
    fetchUserAwards(id),
    fetchTrophiesForUser(id),
    fetchIsFollowing(currentUser?.id, id),
    isOwner ? fetchSavedVideos(id) : Promise.resolve([] as Video[]),
  ]);
  const works = await attachEngagementToVideos(rawWorks);
  const saved = isOwner ? await attachEngagementToVideos(rawSaved) : [];

  const showFollow = Boolean(currentUser) && !isOwner;

  return (
    <div className="page-cinematic mx-auto max-w-6xl space-y-5 px-6 py-8 text-[#F8F7FF]">
        <AnimateIn delay={0} className="space-y-2">
          <p className="eyebrow">Profile</p>
          <h1 className="page-title text-3xl sm:text-4xl">{isOwner ? "My Profile" : "Creator Profile"}</h1>
          <p className="page-subtitle">Manage profile details, published films, saved titles, and awards.</p>
        </AnimateIn>
        <AnimateIn delay={0.05}>
          <ProfilePageClient
          profile={profile}
          works={works}
          awards={awards}
          trophies={trophies}
          saved={saved}
          followers={counts.followers}
          following={counts.following}
          isOwner={isOwner}
          userEmail={isOwner ? (currentUser?.email ?? "") : ""}
          showFollow={showFollow}
          initialFollowing={initialFollowing}
          />
        </AnimateIn>
    </div>
  );
}
