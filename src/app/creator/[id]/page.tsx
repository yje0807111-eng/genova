import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GenovaProfileClient } from "@/components/profile/profile-page-client";
import { ProfileHeader } from "@/components/profile/profile-header";
import { fetchCreatorById, fetchVideosByCreator } from "@/lib/queries";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import {
  fetchFollowCounts,
  fetchIsFollowing,
} from "@/lib/queries/profile-queries";
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
  const [creator, locale] = await Promise.all([fetchCreatorById(id), getServerLocale()]);
  if (!creator) return { title: "Creator not found" };
  const name = creator.name?.trim() || "Creator";
  const description =
    creator.bio?.trim() ||
    `${name} — AI filmmaker on Genova. Browse their films and recent work.`;
  const ogImage = creator.avatarUrl?.trim() || undefined;
  return {
    title: name,
    description,
    openGraph: {
      title: `${name} on Genova`,
      description,
      type: "profile",
      locale: ogLocaleFor(locale),
      images: ogImage ? [{ url: ogImage, alt: name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} on Genova`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

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

  const rawWorks = await fetchVideosByCreator(creator.id);

  const [worksWithEng, counts, initialFollowing] = await Promise.all([
    attachEngagementToVideos(rawWorks),
    fetchFollowCounts(creator.id),
    fetchIsFollowing(currentUserId ?? undefined, creator.id),
  ]);

  const displayName = creator.name?.trim() || `user_${creator.id.slice(0, 8)}`;
  const handle =
    displayName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 32) || `user_${creator.id.slice(0, 8)}`;

  const isOwner = currentUserId === creator.id;
  const avatarUrl = creator.avatarUrl ?? "/default-avatar.png";

  return (
    <div className="min-h-screen w-full text-[#F8F7FF]">
      <GenovaProfileClient
        profileId={creator.id}
        works={worksWithEng}
        competitionVideos={[]}
        savedVideos={[]}
        isOwner={isOwner}
        headerSlot={
          /* C-2b: server-rendered header.  Creators don't have a
             Profile row, so we omit `profile` / `userEmail` etc.
             ProfileHeader's edit pencil only mounts when both
             `isOwner` and `profile` are present, so creators never
             see it regardless of who's signed in. */
          <ProfileHeader
            profileId={creator.id}
            displayName={displayName}
            handle={handle}
            mainGenre={null}
            bannerUrl={null}
            avatarUrl={avatarUrl}
            headerIntro={creator.bio ?? ""}
            bioFull={creator.bio ?? ""}
            headerToolsLine=""
            country={null}
            joinedLabel={null}
            websiteUrl={null}
            twitterUrl={null}
            instagramUrl={null}
            youtubeUrl={null}
            tiktokUrl={null}
            vimeoUrl={null}
            videoCount={worksWithEng.length}
            followersCount={counts.followers}
            followingCount={counts.following}
            isOwner={isOwner}
            showFollow={Boolean(currentUserId) && currentUserId !== creator.id}
            initialFollowing={initialFollowing}
          />
        }
      />
    </div>
  );
}
