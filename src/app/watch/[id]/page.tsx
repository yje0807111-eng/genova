import MuxPlayer from "@mux/mux-player-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowButton } from "@/components/profile/follow-button";
import { ProfileTextLink } from "@/components/links/profile-text-link";
import { WatchMoreMenu } from "@/components/video/watch-more-menu";
import { ShareButton } from "@/components/video/share-modal";
import { VideoEngagementBar } from "@/components/video/video-engagement-bar";
import { CreatorFollowButton } from "@/components/video/creator-follow-button";
import { SeriesEpisodesSlider } from "@/components/video/series-episodes-slider";
import {
  WatchDescriptionInner,
  WatchRecommendationsSections,
  WatchVideoMetaRow,
} from "@/components/video/watch-detail-client";
import { mapVideo } from "@/lib/mappers";
import { hrefForVideoCreator } from "@/lib/creator-links";
import { fetchCommentsForVideo } from "@/lib/queries/comments-queries";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import { incrementVideoViewCount } from "@/lib/queries/video-views";
import {
  fetchCreatorById,
  fetchForYouSameGenreVideos,
  fetchRelatedVideos,
  fetchSeriesEpisodesForVideo,
  fetchVideoById,
  type SeriesEpisodesNav,
} from "@/lib/queries";
import { fetchIsFollowing, fetchProfileById } from "@/lib/queries/profile-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WatchTracker } from "@/components/video/watch-tracker";
import { WatchDesktopFlexRow } from "@/components/video/watch-comments-panel";

export default async function WatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let video = await fetchVideoById(id);
  if (!video) notFound();

  await incrementVideoViewCount(id);
  video = { ...video, viewCount: (video.viewCount ?? 0) + 1 };

  const supabase = await createServerSupabaseClient();
  const { data: userData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = userData?.user ?? null;

  const [vWithE] = await attachEngagementToVideos([video]);
  video = vWithE;

  const [creator, related, forYouVideos, seriesNavRaw, comments, uploaderProfile, isFollowing] = await Promise.all([
    video.creatorId ? fetchCreatorById(video.creatorId) : Promise.resolve(null),
    fetchRelatedVideos(video.id, 8),
    fetchForYouSameGenreVideos(video.id, video.genre, 8),
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
        .eq("genre", video.genre)
        .neq("id", video.id)
        .order("view_count", { ascending: false })
        .limit(10)
    : { data: [] };

  const { data: trendingRaw } = supabase
    ? await supabase
        .from("videos")
        .select("*, creators(*)")
        .neq("id", video.id)
        .order("view_count", { ascending: false })
        .limit(10)
    : { data: [] };

  const sameGenreVideos = (sameGenreRaw ?? []).map((v) => mapVideo(v));
  const trendingVideos = (trendingRaw ?? []).map((v) => mapVideo(v));

  const displaySeriesNav = seriesNav;

  const showSeries = seriesNav.episodes.length > 0;
  const creatorHref = hrefForVideoCreator(video);

  const showFollow = Boolean(video.uploadedBy && user?.id && user.id !== video.uploadedBy);
  const showFollowCreator = Boolean(video.creatorId && creator && user?.id);

  const hasCatalogCreator = Boolean(video.creatorId && creator);
  const displayName = hasCatalogCreator
    ? creator!.name
    : (video.uploaderDisplayName ?? uploaderProfile?.displayName ?? "Creator");
  const avatarUrl = hasCatalogCreator ? creator!.avatarUrl : uploaderProfile?.avatarUrl ?? null;
  const bioOneLine = hasCatalogCreator ? creator!.bio : uploaderProfile?.bio ?? "";
  const rawDescription = video.description?.trim() ? video.description.trim() : null;
  const displayTags = video.tags;
  const displayAiTools = video.aiTools;

  const displayComments = comments;

  return (
    <div className="mx-auto max-w-[1680px] px-8 py-6 text-white">
      {/* Top row: main + unified sidebar (Up Next + tabs + comments) */}
      <WatchDesktopFlexRow
        leftBeforeDescription={
          <>
            <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
              <WatchTracker videoId={video.id} />
              {video.muxPlaybackId ? (
                <MuxPlayer
                  playbackId={video.muxPlaybackId}
                  envKey={process.env.NEXT_PUBLIC_MUX_ENV_KEY}
                  streamType="on-demand"
                  className="h-full w-full"
                  style={{ aspectRatio: "16/9" }}
                  accentColor="#534AB7"
                  title={video.title}
                />
              ) : (
                <iframe
                  src={`https://player.vimeo.com/video/${video.vimeoId}?title=0&byline=0&portrait=0&badge=0&like=0&watchlater=0&share=0`}
                  className="h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={video.title}
                />
              )}
            </div>

            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">{video.title}</h1>
                <WatchVideoMetaRow
                  genre={video.genre}
                  subGenre={video.subGenre}
                  runtime={video.runtime}
                  viewCount={video.viewCount ?? 0}
                  createdAt={video.createdAt}
                />
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <VideoEngagementBar
                  videoId={video.id}
                  likeCount={video.likeCount ?? 0}
                  likedByMe={video.likedByMe ?? false}
                  savedByMe={video.savedByMe ?? false}
                  saveCount={video.saveCount ?? 0}
                />
                <ShareButton title={video.title} />
                <WatchMoreMenu />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {creatorHref ? (
                  <Link href={creatorHref} className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#26215C] transition hover:opacity-80">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/70">
                        {displayName.slice(0, 1)}
                      </div>
                    )}
                  </Link>
                ) : (
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#26215C]">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/70">
                        {displayName.slice(0, 1)}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  {creatorHref ? (
                    <ProfileTextLink href={creatorHref} className="text-sm font-semibold text-white hover:underline">
                      {displayName}
                    </ProfileTextLink>
                  ) : (
                    <p className="text-sm font-semibold text-white">{displayName}</p>
                  )}
                  {bioOneLine ? <p className="text-xs text-white/50">{bioOneLine}</p> : null}
                </div>
              </div>
              {showFollow ? (
                <FollowButton targetUserId={video.uploadedBy!} initialFollowing={isFollowing} />
              ) : showFollowCreator ? (
                <CreatorFollowButton creatorName={displayName} />
              ) : null}
            </div>
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
      />

      <WatchRecommendationsSections
        forYouVideos={forYouVideos}
        sameGenreVideos={sameGenreVideos}
        trendingVideos={trendingVideos}
        mainGenre={video.genre}
        subGenre={video.subGenre}
      />
    </div>
  );
}
