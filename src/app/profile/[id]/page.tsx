import { notFound } from "next/navigation";
import { AnimateIn } from "@/components/animate-in";
import { GenovaProfileClient } from "@/components/profile/profile-page-client";
import { mapVideo } from "@/lib/mappers";
import { profileHandle } from "@/lib/profile-handle";
import { mergeVideoRows } from "@/lib/queries";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import {
  fetchFinalistVideosByUploader,
  fetchProfileAwardBadges,
  fetchFollowCounts,
  fetchFollowingPreviewUsers,
  fetchIsFollowing,
  fetchPublicProfileById,
  fetchSavedVideos,
  fetchUploadedVideos,
} from "@/lib/queries/profile-queries";
import type { Video } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatJoinedLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `Joined ${new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(d)}`;
}

type CompetitionMeta = {
  id: string;
  title: string;
  title_ko?: string | null;
  title_en?: string | null;
  title_ja?: string | null;
  status?: string | null;
};

type CompetitionVideo = Video & {
  competitions?: CompetitionMeta | null;
};

async function fetchUserCompetitionVideos(userId: string): Promise<CompetitionVideo[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("uploaded_by", userId)
    .eq("purpose", "competition")
    .not("submitted_competition_id", "is", null)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[fetchUserCompetitionVideos]", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return [];
  }

  // Attach uploader display_name via public_profiles instead of FK embed.
  const enriched = await mergeVideoRows(data as Parameters<typeof mapVideo>[0][]);
  return enriched.map((row) => mapVideo(row));
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
  const profile = await fetchPublicProfileById(id);
  if (!profile) notFound();

  const [counts, rawWorks, rawFinalist, rawCompetitionVideos, initialFollowing, rawSaved, followingUsers, rawAwards] = await Promise.all([
    fetchFollowCounts(id),
    fetchUploadedVideos(id),
    fetchFinalistVideosByUploader(id),
    fetchUserCompetitionVideos(id),
    fetchIsFollowing(currentUser?.id, id),
    isOwner ? fetchSavedVideos(id) : Promise.resolve([] as Video[]),
    fetchFollowingPreviewUsers(id),
    fetchProfileAwardBadges(id),
  ]);

  const worksSource = rawWorks;
  const finalistSource = rawFinalist;
  const savedSource = isOwner ? rawSaved : [];

  const works = await attachEngagementToVideos(worksSource);
  const finalistVideos = await attachEngagementToVideos(finalistSource);
  const competitionVideos = await attachEngagementToVideos(rawCompetitionVideos);
  const savedVideos = isOwner ? await attachEngagementToVideos(savedSource) : [];

  const displayName = profile.displayName?.trim() || `user_${id.slice(0, 8)}`;
  const handle = profileHandle(displayName, id);
  const avatarUrl = profile.avatarUrl?.trim() || "/default-avatar.png";
  const showFollow = Boolean(currentUser) && !isOwner;

  const userEmail = isOwner ? (currentUser?.email ?? null) : null;
  const authProvider = isOwner ? (currentUser?.app_metadata?.provider ?? "email") : "email";
  const hasPassword = authProvider === "email";
  const headerIntro = profile.bio.trim();
  const headerToolsLine = profile.tools.length ? profile.tools.join(" · ") : "";
  const joinedLabel = formatJoinedLabel(profile.joinedAt);
  const activityVideos = (rawWorks.length ? rawWorks : works).slice(0, 5);
  const videoCount = rawWorks.length;
  const awardBadges = rawAwards;

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
          mainGenre={profile.mainGenre}
          country={profile.country}
          availableForCollab={profile.availableForCollab}
          tagline={profile.tagline}
          pronouns={profile.pronouns}
          websiteUrl={profile.websiteUrl}
          twitterUrl={profile.twitterUrl}
          instagramUrl={profile.instagramUrl}
          youtubeUrl={profile.youtubeUrl}
          tiktokUrl={profile.tiktokUrl}
          vimeoUrl={profile.vimeoUrl}
          avatarUrl={avatarUrl}
          bannerUrl={profile.bannerUrl}
          joinedLabel={joinedLabel}
          followersCount={counts.followers}
          followingCount={counts.following}
          videoCount={videoCount}
          works={works}
          finalistVideos={finalistVideos}
          competitionVideos={competitionVideos}
          savedVideos={savedVideos}
          isOwner={isOwner}
          showFollow={showFollow}
          initialFollowing={initialFollowing}
          followingUsers={followingUsers}
          activityVideos={activityVideos}
          awardBadges={awardBadges}
          profile={profile}
          userEmail={userEmail}
          hasPassword={hasPassword}
          authProvider={authProvider}
        />
      </AnimateIn>
    </div>
  );
}

