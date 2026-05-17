import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WatchMoreMenu } from "@/components/video/watch-more-menu";
import { ShareButton } from "@/components/video/share-modal";
import { SeriesEpisodesSlider } from "@/components/video/series-episodes-slider";
import {
  WatchDescriptionInner,
  WatchRecommendationsSections,
} from "@/components/video/watch-detail-client";
import { mapVideo } from "@/lib/mappers";
import { hrefForVideoCreator } from "@/lib/creator-links";
import { fetchCommentsForVideo } from "@/lib/queries/comments-queries";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import { incrementVideoViewCount } from "@/lib/queries/video-views";
import {
  fetchCreatorById,
  fetchRelatedVideos,
  fetchSeriesEpisodesForVideo,
  fetchVideoById,
  type SeriesEpisodesNav,
} from "@/lib/queries";
import { fetchFollowCounts, fetchIsFollowing, fetchPublicProfileById } from "@/lib/queries/profile-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WatchTracker } from "@/components/video/watch-tracker";
import { WatchDesktopFlexRow } from "@/components/video/watch-comments-panel";
import { MuxPlayer } from "@/components/video/mux-player-lazy";
import { getVideoProgress } from "@/app/actions/video-progress";
import { getServerLocale } from "@/lib/i18n/server";
import { UpNextMiniRail } from "@/components/video/up-next-mini-rail";

// Map our internal Locale codes to BCP-47 OpenGraph locale strings.  Kept
// inline (not exported) because every generateMetadata in B.2-4 needs the
// same 3-row table and duplicating is cheaper than a one-import helper.
function ogLocaleFor(loc: "en" | "ko" | "ja"): "en_US" | "ko_KR" | "ja_JP" {
  return loc === "ko" ? "ko_KR" : loc === "ja" ? "ja_JP" : "en_US";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [video, locale] = await Promise.all([fetchVideoById(id), getServerLocale()]);
  if (!video) return { title: "Film not found" };
  const title = video.title || "Untitled film";
  const creator = video.uploaderDisplayName || video.creatorName || "a Genova creator";
  // Description fallback stays English — search engines accept mixed-locale
  // metadata, and most films don't have translated descriptions.  Real
  // user-authored `video.description` is locale-agnostic content.
  const description =
    video.description?.trim() ||
    `Watch "${title}" by ${creator} on Genova — AI-generated film streaming.`;
  const ogImage = video.thumbnailUrl?.trim() || undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "video.other",
      locale: ogLocaleFor(locale),
      images: ogImage ? [{ url: ogImage, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function WatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let video = await fetchVideoById(id);
  if (!video) {
    redirect("/?notice=video-removed");
  }

  // Parallelize the post-resolve I/O block.  All six are independent
  // (they share no state beyond the resolved `video` and `id`) so
  // running them concurrently shaves multiple round-trips off TTFB on
  // the highest-traffic dynamic page.  Each helper creates its own
  // request-cached server supabase client internally — no shared
  // handle needed.
  const supabase = await createServerSupabaseClient();
  const [
    didIncrementView,
    userResult,
    engagementResult,
    progress,
    cookieStore,
    rawRelated,
  ] = await Promise.all([
    incrementVideoViewCount(id),
    supabase
      ? supabase.auth.getUser()
      : Promise.resolve({ data: { user: null } }),
    attachEngagementToVideos([video]),
    getVideoProgress(video.id),
    cookies(),
    fetchRelatedVideos(video.id, 20),
  ]);

  const user = userResult.data?.user ?? null;
  video = engagementResult[0];
  if (didIncrementView) {
    video = { ...video, viewCount: (video.viewCount ?? 0) + 1 };
  }

  const watchedCookie = cookieStore.get("genova_watched")?.value;
  const cookieWatched: string[] = watchedCookie ? JSON.parse(watchedCookie) : [];
  const watchedSet = new Set([...cookieWatched, video.id]);

  let related = rawRelated.filter((v) => !watchedSet.has(v.id));

  if (related.length < 8) {
    const existingIds = new Set(related.map((v) => v.id));
    existingIds.add(video.id);
    const fallback = rawRelated.filter((v) => !existingIds.has(v.id));
    related = [...related, ...fallback].slice(0, 8);
  }

  related = related.slice(0, 8);

  // Second parallel block: detail-page dependencies that need the
  // resolved user / video.
  const [
    creatorResult,
    seriesNavRaw,
    comments,
    uploaderProfile,
    isFollowing,
    sameGenreRes,
    trendingRes,
  ] = await Promise.all([
    video.creatorId ? fetchCreatorById(video.creatorId) : Promise.resolve(null),
    fetchSeriesEpisodesForVideo(video),
    fetchCommentsForVideo(video.id),
    video.uploadedBy ? fetchPublicProfileById(video.uploadedBy) : Promise.resolve(null),
    video.uploadedBy ? fetchIsFollowing(user?.id, video.uploadedBy) : Promise.resolve(false),
    supabase
      ? supabase
          .from("videos")
          .select("*, creators(*)")
          .eq("visibility", "public")
          .eq("genre", video.genre)
          .neq("id", video.id)
          .order("view_count", { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [] as unknown[] }),
    supabase
      ? supabase
          .from("videos")
          .select("*, creators(*)")
          .eq("visibility", "public")
          .neq("id", video.id)
          .order("view_count", { ascending: false })
          .limit(24)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);
  const creator = creatorResult;
  const seriesNav: SeriesEpisodesNav = seriesNavRaw;
  const sameGenreRaw = sameGenreRes.data;
  const trendingRaw = trendingRes.data;

  const sameGenreVideos = (sameGenreRaw ?? []).map((v) => mapVideo(v));
  const sameGenreIds = new Set(sameGenreVideos.map((v) => v.id));
  const trendingVideos = (trendingRaw ?? [])
    .map((v) => mapVideo(v))
    .filter((v) => !sameGenreIds.has(v.id))
    .slice(0, 12);

  const displaySeriesNav = seriesNav;

  const showSeries = seriesNav.episodes.length > 0;
  const creatorHref = hrefForVideoCreator(video);

  const isVideoOwner = Boolean(user?.id && video.uploadedBy && user.id === video.uploadedBy);

  const hasCatalogCreator = Boolean(video.creatorId && creator);
  const displayName = hasCatalogCreator
    ? creator!.name
    : (video.uploaderDisplayName ?? uploaderProfile?.displayName ?? "Creator");
  const avatarUrl = hasCatalogCreator ? creator!.avatarUrl : uploaderProfile?.avatarUrl ?? null;

  let creatorVideoCount = 0;
  let creatorFollowerCount = 0;
  if (hasCatalogCreator && video.creatorId && supabase) {
    const { count } = await supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", video.creatorId)
      .eq("visibility", "public");
    creatorVideoCount = count ?? 0;
    creatorFollowerCount = creator!.followerCount ?? 0;
  } else if (video.uploadedBy && supabase) {
    const [vidCount, followCounts] = await Promise.all([
      supabase.from("videos").select("id", { count: "exact", head: true })
        .eq("uploaded_by", video.uploadedBy)
        .eq("visibility", "public"),
      fetchFollowCounts(video.uploadedBy),
    ]);
    creatorVideoCount = vidCount.count ?? 0;
    creatorFollowerCount = followCounts.followers;
  }

  const rawDescription = video.description?.trim() ? video.description.trim() : null;
  const displayTags = video.tags;
  const displayAiTools = video.aiTools;

  const displayComments = comments;

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-6 text-white md:px-8">
      {/* Top row: main + unified sidebar (Up Next + tabs + comments) */}
      <WatchDesktopFlexRow
        playerSlot={
          <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
            <WatchTracker videoId={video.id} />
            {video.muxPlaybackId && (
              <MuxPlayer
                playbackId={video.muxPlaybackId}
                title={video.title}
                nextVideoId={
                  showSeries && seriesNav.nextId
                    ? seriesNav.nextId
                    : (related[0]?.id ?? null)
                }
                userId={user?.id ?? null}
                videoId={video.id}
                initialProgressSeconds={progress?.progressSeconds ?? 0}
              />
            )}
          </div>
        }
        belowPlayerSlot={
          <>
            <ShareButton title={video.title} videoId={video.id} thumbnailUrl={video.thumbnailUrl} />
            <WatchMoreMenu videoId={video.id} />
          </>
        }
        descriptionInner={
          <WatchDescriptionInner description={rawDescription} tags={displayTags} aiTools={displayAiTools} />
        }
        leftAfterDescription={
          showSeries ? (
            <SeriesEpisodesSlider
              episodes={displaySeriesNav.episodes}
              currentVideoId={video.id}
              seriesTitle={displaySeriesNav.seriesTitle}
              seasons={displaySeriesNav.seasons}
            />
          ) : null
        }
        upNextSlot={
          /* Server-rendered: B.2-5 canary — UpNextMiniRail is async and
             reads locale via getServerLocale; composed here as a slot
             so the client `WatchDesktopFlexRow` doesn't need to
             re-render it on state changes. */
          <UpNextMiniRail related={related} currentVideoId={video.id} />
        }
        videoId={video.id}
        commentCount={displayComments.length}
        initialComments={displayComments}
        currentUserId={user?.id ?? null}
        isVideoOwner={isVideoOwner}
        video={video}
        creatorName={displayName}
        creatorAvatarUrl={avatarUrl}
        creatorHref={creatorHref}
        creatorVideoCount={creatorVideoCount}
        creatorFollowerCount={creatorFollowerCount}
        creatorId={video.uploadedBy ?? video.creatorId ?? ""}
        isFollowingCreator={isFollowing}
      />

      {/* 모바일에선 숨김 — 시청 페이지 과밀 완화 */}
      <div className="hidden md:block">
        <WatchRecommendationsSections
          sameGenreVideos={sameGenreVideos}
          trendingVideos={trendingVideos}
          currentVideoId={video.id}
        />
      </div>
    </div>
  );
}
