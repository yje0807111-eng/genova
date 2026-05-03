import { notFound } from "next/navigation";
import { AnimateIn } from "@/components/animate-in";
import { GenovaProfileClient } from "@/components/profile/profile-page-client";
import { createProfileMockGridVideos } from "@/lib/profile-mock-grid-videos";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import {
  fetchFinalistVideosByUploader,
  fetchProfileAwardBadges,
  fetchFollowCounts,
  fetchFollowingPreviewUsers,
  fetchIsFollowing,
  fetchProfileById,
  fetchSavedVideos,
  fetchUploadedVideos,
  type ProfileAwardBadge,
} from "@/lib/queries/profile-queries";
import type { Video } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function profileHandle(displayName: string, id: string): string {
  const slug = displayName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "");
  if (slug.length >= 2) return slug.slice(0, 32);
  return `user_${id.replace(/-/g, "").slice(0, 8)}`;
}

function formatJoinedLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `Joined ${new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(d)}`;
}

export default async function ProfileByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createServerSupabaseClient();
  let currentUser: { id: string } | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    currentUser = user;
  }

  const isOwner = Boolean(currentUser?.id === id);
  const profile = await fetchProfileById(id);
  if (!profile) notFound();

  const [counts, rawWorks, rawFinalist, initialFollowing, rawSaved, followingUsers, rawAwards] = await Promise.all([
    fetchFollowCounts(id),
    fetchUploadedVideos(id),
    fetchFinalistVideosByUploader(id),
    fetchIsFollowing(currentUser?.id, id),
    isOwner ? fetchSavedVideos(id) : Promise.resolve([] as Video[]),
    fetchFollowingPreviewUsers(id),
    fetchProfileAwardBadges(id),
  ]);

  const worksSource = rawWorks.length ? rawWorks : createProfileMockGridVideos("videos").slice(0, 2);
  const finalistSource = rawFinalist.length ? rawFinalist : createProfileMockGridVideos("competition").slice(0, 2);
  const savedSource = isOwner ? (rawSaved.length ? rawSaved : createProfileMockGridVideos("saved").slice(0, 2)) : [];

  const works = await attachEngagementToVideos(worksSource);
  const finalistVideos = await attachEngagementToVideos(finalistSource);
  const savedVideos = isOwner ? await attachEngagementToVideos(savedSource) : [];

  const displayName = profile.displayName?.trim() || `user_${id.slice(0, 8)}`;
  const handle = profileHandle(displayName, id);
  const avatarUrl = profile.avatarUrl?.trim() || "/placeholder-user.jpg";
  const showFollow = Boolean(currentUser) && !isOwner;
  const headerIntro = profile.bio.trim();
  const headerToolsLine = profile.tools.length ? profile.tools.join(" · ") : "";
  const joinedLabel = formatJoinedLabel(profile.joinedAt);
  const activityVideos = (rawWorks.length ? rawWorks : works).slice(0, 5);
  const videoCount = rawWorks.length;
  const mockAwardBadges: ProfileAwardBadge[] = [
    { id: "mock-award-weekly-gold", awardType: "weekly", awardTier: "gold", createdAt: new Date().toISOString() },
    { id: "mock-award-comp-1", awardType: "competition", awardTier: "1", createdAt: new Date().toISOString() },
    { id: "mock-award-weekly-silver", awardType: "weekly", awardTier: "silver", createdAt: new Date().toISOString() },
  ];
  const awardBadges: ProfileAwardBadge[] = rawAwards.length ? rawAwards : mockAwardBadges;

  return (
    <div className="min-h-screen w-full text-[#F8F7FF]">
      <AnimateIn delay={0}>
        <GenovaProfileClient
          profileId={id}
          displayName={displayName}
          handle={handle}
          headerIntro={headerIntro}
          headerToolsLine={headerToolsLine}
          bioFull={profile.bio}
          avatarUrl={avatarUrl}
          bannerUrl={profile.bannerUrl}
          joinedLabel={joinedLabel}
          followersCount={counts.followers}
          followingCount={counts.following}
          videoCount={videoCount}
          works={works}
          finalistVideos={finalistVideos}
          savedVideos={savedVideos}
          isOwner={isOwner}
          showFollow={showFollow}
          initialFollowing={initialFollowing}
          followingUsers={followingUsers}
          activityVideos={activityVideos}
          awardBadges={awardBadges}
        />
      </AnimateIn>
    </div>
  );
}

