import type { Metadata } from "next";
import type { User } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { AnimateIn } from "@/components/animate-in";
import { GenovaProfileClient } from "@/components/profile/profile-page-client";
import { ProfileHeader } from "@/components/profile/profile-header";
import { fetchMyMonthlyTicketCount } from "@/lib/queries/lottery-queries";
import { mapVideo } from "@/lib/mappers";
import { profileHandle } from "@/lib/profile-handle";
import { mergeVideoRows } from "@/lib/queries";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import {
  fetchFollowCounts,
  fetchIsFollowing,
  fetchPublicProfileById,
  fetchSavedVideos,
  fetchUploadedVideos,
} from "@/lib/queries/profile-queries";
import type { Video } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getServerLocale } from "@/lib/i18n/server";

function ogLocaleFor(loc: "en" | "ko" | "ja"): "en_US" | "ko_KR" | "ja_JP" {
  return loc === "ko" ? "ko_KR" : loc === "ja" ? "ja_JP" : "en_US";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Profile not found" };
  const [profile, locale] = await Promise.all([fetchPublicProfileById(id), getServerLocale()]);
  if (!profile) return { title: "Profile not found" };
  const displayName = profile.displayName?.trim() || `user_${id.slice(0, 8)}`;
  const description =
    profile.bio?.trim() ||
    `${displayName} — AI filmmaker on Genova. Explore their films, awards, and collaborations.`;
  const ogImage = profile.bannerUrl?.trim() || profile.avatarUrl?.trim() || undefined;
  return {
    title: displayName,
    description,
    openGraph: {
      title: `${displayName} on Genova`,
      description,
      type: "profile",
      locale: ogLocaleFor(locale),
      images: ogImage ? [{ url: ogImage, alt: displayName }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} on Genova`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

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
  // Full Supabase User shape — owner-only blocks below read `email` and
  // `app_metadata.provider` off this to decide which settings UI to render.
  let currentUser: User | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    currentUser = user;
  }

  const isOwner = Boolean(currentUser?.id === id);
  const profile = await fetchPublicProfileById(id);
  if (!profile) notFound();

  const [counts, rawWorks, rawCompetitionVideos, initialFollowing, rawSaved] = await Promise.all([
    fetchFollowCounts(id),
    fetchUploadedVideos(id),
    fetchUserCompetitionVideos(id),
    fetchIsFollowing(currentUser?.id, id),
    isOwner ? fetchSavedVideos(id) : Promise.resolve([] as Video[]),
  ]);

  const savedSource = isOwner ? rawSaved : [];

  const works = await attachEngagementToVideos(rawWorks);
  const competitionVideos = await attachEngagementToVideos(rawCompetitionVideos);
  const savedVideos = isOwner ? await attachEngagementToVideos(savedSource) : [];

  // Owner-only lottery snapshot for the header card. Skip the RPC when
  // the visitor isn't the owner — non-owners never see the counter.
  const lotteryCount = isOwner ? await fetchMyMonthlyTicketCount(id) : null;

  const displayName = profile.displayName?.trim() || `user_${id.slice(0, 8)}`;
  const handle = profile.handle?.trim() || profileHandle(displayName, id);
  const avatarUrl = profile.avatarUrl?.trim() || "/default-avatar.png";
  const showFollow = Boolean(currentUser) && !isOwner;

  const userEmail = isOwner ? (currentUser?.email ?? null) : null;
  const authProvider = isOwner ? (currentUser?.app_metadata?.provider ?? "email") : "email";
  const hasPassword = authProvider === "email";
  const headerIntro = profile.bio.trim();
  const headerToolsLine = profile.tools.length ? profile.tools.join(" · ") : "";
  const joinedLabel = formatJoinedLabel(profile.joinedAt);

  return (
    <div className="min-h-screen w-full text-[#F8F7FF]">
      <AnimateIn delay={0}>
        <GenovaProfileClient
          profileId={id}
          works={works}
          competitionVideos={competitionVideos}
          savedVideos={savedVideos}
          isOwner={isOwner}
          headerSlot={
            /* C-2b: profile header is now a server component composed
               here and threaded through the client shell as a slot.
               videoCount is the server snapshot (works.length); bulk
               visibility toggles inside the client shell never add or
               remove items, so the count remains accurate. */
            <ProfileHeader
              profileId={id}
              displayName={displayName}
              handle={handle}
              mainGenre={profile.mainGenre}
              bannerUrl={profile.bannerUrl}
              avatarUrl={avatarUrl}
              headerIntro={headerIntro}
              bioFull={profile.bio}
              headerToolsLine={headerToolsLine}
              country={profile.country}
              joinedLabel={joinedLabel}
              websiteUrl={profile.websiteUrl}
              twitterUrl={profile.twitterUrl}
              instagramUrl={profile.instagramUrl}
              youtubeUrl={profile.youtubeUrl}
              tiktokUrl={profile.tiktokUrl}
              vimeoUrl={profile.vimeoUrl}
              videoCount={works.length}
              followersCount={counts.followers}
              followingCount={counts.following}
              isOwner={isOwner}
              showFollow={showFollow}
              initialFollowing={initialFollowing}
              profile={profile}
              userEmail={userEmail}
              hasPassword={hasPassword}
              authProvider={authProvider}
              lotteryCount={lotteryCount}
            />
          }
        />
      </AnimateIn>
    </div>
  );
}

