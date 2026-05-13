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
import { fetchFollowCounts, fetchIsFollowing, fetchProfileById } from "@/lib/queries/profile-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WatchTracker } from "@/components/video/watch-tracker";
import { WatchDesktopFlexRow } from "@/components/video/watch-comments-panel";
import { MuxPlayerClient } from "@/components/video/mux-player-client";
import { getVideoProgress } from "@/app/actions/video-progress";

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

  const didIncrementView = await incrementVideoViewCount(id);
  if (didIncrementView) {
    video = { ...video, viewCount: (video.viewCount ?? 0) + 1 };
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = userData?.user ?? null;

  const [vWithE] = await attachEngagementToVideos([video]);
  video = vWithE;
  const progress = await getVideoProgress(video.id);

  const cookieStore = await cookies();
  const watchedCookie = cookieStore.get("genova_watched")?.value;
  const cookieWatched: string[] = watchedCookie ? JSON.parse(watchedCookie) : [];

  const rawRelated = await fetchRelatedVideos(video.id, 20);
  const watchedSet = new Set([...cookieWatched, video.id]);

  let related = rawRelated.filter((v) => !watchedSet.has(v.id));

  if (related.length < 8) {
    const existingIds = new Set(related.map((v) => v.id));
    existingIds.add(video.id);
    const fallback = rawRelated.filter((v) => !existingIds.has(v.id));
    related = [...related, ...fallback].slice(0, 8);
  }

  related = related.slice(0, 8);

  console.log("[RELATED_FINAL]", {
    raw: rawRelated.length,
    cookieWatched: cookieWatched.length,
    unwatched: rawRelated.filter((v) => !watchedSet.has(v.id)).length,
    final: related.length,
  });

  const [creator, seriesNavRaw, comments, uploaderProfile, isFollowing] = await Promise.all([
    video.creatorId ? fetchCreatorById(video.creatorId) : Promise.resolve(null),
    fetchSeriesEpisodesForVideo(video),
    fetchCommentsForVideo(video.id),
    video.uploadedBy ? fetchProfileById(video.uploadedBy) : Promise.resolve(null),
    video.uploadedBy ? fetchIsFollowing(user?.id, video.uploadedBy) : Promise.resolve(false),
  ]);
  const seriesNav: SeriesEpisodesNav = seriesNavRaw;

  const { data: sameGenreRaw } = supabase
    ? await supabase
        .from("videos")
        .select("*, creators(*)")
        .eq("visibility", "public")
        .eq("genre", video.genre)
        .neq("id", video.id)
        .order("view_count", { ascending: false })
        .limit(12)
    : { data: [] };
  console.log("[SAMEGENRE_DEBUG]", sameGenreRaw?.length ?? 0);

  const { data: trendingRaw } = supabase
    ? await supabase
        .from("videos")
        .select("*, creators(*)")
        .eq("visibility", "public")
        .neq("id", video.id)
        .order("view_count", { ascending: false })
        .limit(24)
    : { data: [] };
  console.log("[TRENDING_DEBUG]", trendingRaw?.length ?? 0);

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
    <div className="mx-auto max-w-[1680px] px-8 py-6 text-white">
      {/* Top row: main + unified sidebar (Up Next + tabs + comments) */}
      <WatchDesktopFlexRow
        playerSlot={
          <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
            <WatchTracker videoId={video.id} />
            {video.muxPlaybackId && (
              <MuxPlayerClient
                playbackId={video.muxPlaybackId}
                title={video.title}
                nextVideoId={related[0]?.id ?? null}
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
        related={related}
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

      <WatchRecommendationsSections
        sameGenreVideos={sameGenreVideos}
        trendingVideos={trendingVideos}
        currentVideoId={video.id}
      />
    </div>
  );
}
