import { notFound } from "next/navigation";
import { GenovaProfileClient } from "@/components/profile/profile-page-client";
import { fetchCreatorById, fetchVideosByCreator } from "@/lib/queries";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import {
  fetchFollowCounts,
  fetchIsFollowing,
  fetchFollowingPreviewUsers,
  fetchProfileAwardBadges,
} from "@/lib/queries/profile-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const creator = await fetchCreatorById(id);
  if (!creator) notFound();

  const supabase = await createServerSupabaseClient();
  let currentUserId: string | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    currentUserId = user?.id ?? null;
  }

  const works = await fetchVideosByCreator(creator.id);
  const finalistVideos = works.filter((v) => v.isFinalist);

  const rawWorks = works.filter((v) => !v.isFinalist);
  const rawFinalist = finalistVideos;

  const [worksWithEng, finalistWithEng, counts, initialFollowing, followingUsers, awardBadges] = await Promise.all([
    attachEngagementToVideos(rawWorks),
    attachEngagementToVideos(rawFinalist),
    fetchFollowCounts(creator.id),
    fetchIsFollowing(currentUserId ?? undefined, creator.id),
    fetchFollowingPreviewUsers(creator.id),
    fetchProfileAwardBadges(creator.id),
  ]);

  const displayName = creator.name?.trim() || `user_${creator.id.slice(0, 8)}`;
  const handle =
    displayName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 32) || `user_${creator.id.slice(0, 8)}`;

  return (
    <div className="min-h-screen w-full text-[#F8F7FF]">
      <GenovaProfileClient
        profileId={creator.id}
        displayName={displayName}
        handle={handle}
        headerIntro={creator.bio ?? ""}
        headerToolsLine=""
        bioFull={creator.bio ?? ""}
        avatarUrl={creator.avatarUrl ?? "/placeholder-user.jpg"}
        bannerUrl={null}
        joinedLabel={null}
        followersCount={counts.followers}
        followingCount={counts.following}
        videoCount={rawWorks.length}
        works={worksWithEng}
        finalistVideos={finalistWithEng}
        savedVideos={[]}
        isOwner={currentUserId === creator.id}
        showFollow={Boolean(currentUserId) && currentUserId !== creator.id}
        initialFollowing={initialFollowing}
        followingUsers={followingUsers}
        activityVideos={worksWithEng.slice(0, 5)}
        awardBadges={awardBadges}
      />
    </div>
  );
}
