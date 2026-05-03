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

  const [creator, related, forYouVideos, seriesNav, comments, uploaderProfile, isFollowing] = await Promise.all([
    video.creatorId ? fetchCreatorById(video.creatorId) : Promise.resolve(null),
    fetchRelatedVideos(video.id, 8),
    fetchForYouSameGenreVideos(video.id, video.genre, 8),
    fetchSeriesEpisodesForVideo(video),
    fetchCommentsForVideo(video.id),
    video.uploadedBy ? fetchProfileById(video.uploadedBy) : Promise.resolve(null),
    video.uploadedBy ? fetchIsFollowing(user?.id, video.uploadedBy) : Promise.resolve(false),
  ]);

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

  const mockSeason1: typeof seriesNav.episodes = [
    ...seriesNav.episodes,
    {
      id: "mock-ep-2",
      title: "Suspicious Scent",
      thumbnailUrl: "https://picsum.photos/seed/ep2dog/400/225",
      vimeoId: "",
      genre: "series",
      subGenre: null,
      purpose: "personal",
      creatorId: null,
      isOriginal: false,
      isFinalist: false,
      award: null,
      runtime: "6:23",
      createdAt: new Date("2026-04-15").toISOString(),
      visibility: "public",
      description: "The scent grows stronger, but the trail vanishes into thin air.",
      aiTools: [],
      tags: [],
      seriesName: video.seriesName,
      episodeNumber: 2,
      uploadedBy: video.uploadedBy,
      viewCount: 196,
    },
    {
      id: "mock-ep-3",
      title: "The Chase Begins",
      thumbnailUrl: "https://picsum.photos/seed/ep3dog/400/225",
      vimeoId: "",
      genre: "series",
      subGenre: null,
      purpose: "personal",
      creatorId: null,
      isOriginal: false,
      isFinalist: false,
      award: null,
      runtime: "7:45",
      createdAt: new Date("2026-04-16").toISOString(),
      visibility: "public",
      description: "The clues are faint, but the tracker refuses to quit.",
      aiTools: [],
      tags: [],
      seriesName: video.seriesName,
      episodeNumber: 3,
      uploadedBy: video.uploadedBy,
      viewCount: 156,
    },
    {
      id: "mock-ep-4",
      title: "An Unexpected Lead",
      thumbnailUrl: "https://picsum.photos/seed/ep4dog/400/225",
      vimeoId: "",
      genre: "series",
      subGenre: null,
      purpose: "personal",
      creatorId: null,
      isOriginal: false,
      isFinalist: false,
      award: null,
      runtime: "5:12",
      createdAt: new Date("2026-04-17").toISOString(),
      visibility: "public",
      description: "A surprising discovery in the last place anyone looked.",
      aiTools: [],
      tags: [],
      seriesName: video.seriesName,
      episodeNumber: 4,
      uploadedBy: video.uploadedBy,
      viewCount: 132,
    },
    {
      id: "mock-ep-5",
      title: "Closer to the Truth",
      thumbnailUrl: "https://picsum.photos/seed/ep5dog/400/225",
      vimeoId: "",
      genre: "series",
      subGenre: null,
      purpose: "personal",
      creatorId: null,
      isOriginal: false,
      isFinalist: false,
      award: null,
      runtime: "8:33",
      createdAt: new Date("2026-04-18").toISOString(),
      visibility: "public",
      description: "The pieces slide into place; the truth is almost within reach.",
      aiTools: [],
      tags: [],
      seriesName: video.seriesName,
      episodeNumber: 5,
      uploadedBy: video.uploadedBy,
      viewCount: 90,
    },
    {
      id: "mock-ep-6",
      title: "The Big Reveal",
      thumbnailUrl: "https://picsum.photos/seed/ep6dog/400/225",
      vimeoId: "",
      genre: "series",
      subGenre: null,
      purpose: "personal",
      creatorId: null,
      isOriginal: false,
      isFinalist: false,
      award: null,
      runtime: "6:01",
      createdAt: new Date("2026-04-19").toISOString(),
      visibility: "public",
      description: "At last, everything comes to light.",
      aiTools: [],
      tags: [],
      seriesName: video.seriesName,
      episodeNumber: 6,
      uploadedBy: video.uploadedBy,
      viewCount: 0,
    },
  ];

  const mockSeason2: typeof seriesNav.episodes = [
    {
      id: "mock-s2-ep-1",
      title: "A New Journey",
      thumbnailUrl: "https://picsum.photos/seed/s2ep1/400/225",
      vimeoId: "",
      genre: "series",
      subGenre: null,
      purpose: "personal",
      creatorId: null,
      isOriginal: false,
      isFinalist: false,
      award: null,
      runtime: "9:14",
      createdAt: new Date("2026-05-01").toISOString(),
      visibility: "public",
      description: "A new season — and a brand-new story with our hero.",
      aiTools: [],
      tags: [],
      seriesName: video.seriesName,
      episodeNumber: 1,
      uploadedBy: video.uploadedBy,
      viewCount: 512,
    },
    {
      id: "mock-s2-ep-2",
      title: "Strange City",
      thumbnailUrl: "https://picsum.photos/seed/s2ep2/400/225",
      vimeoId: "",
      genre: "series",
      subGenre: null,
      purpose: "personal",
      creatorId: null,
      isOriginal: false,
      isFinalist: false,
      award: null,
      runtime: "7:58",
      createdAt: new Date("2026-05-08").toISOString(),
      visibility: "public",
      description: "Amid the noise of the city, a new friend appears.",
      aiTools: [],
      tags: [],
      seriesName: video.seriesName,
      episodeNumber: 2,
      uploadedBy: video.uploadedBy,
      viewCount: 389,
    },
    {
      id: "mock-s2-ep-3",
      title: "The Secret Park",
      thumbnailUrl: "https://picsum.photos/seed/s2ep3/400/225",
      vimeoId: "",
      genre: "series",
      subGenre: null,
      purpose: "personal",
      creatorId: null,
      isOriginal: false,
      isFinalist: false,
      award: null,
      runtime: "6:44",
      createdAt: new Date("2026-05-15").toISOString(),
      visibility: "public",
      description: "Secrets long buried in the old park begin to surface.",
      aiTools: [],
      tags: [],
      seriesName: video.seriesName,
      episodeNumber: 3,
      uploadedBy: video.uploadedBy,
      viewCount: 278,
    },
    {
      id: "mock-s2-ep-4",
      title: "The Calm Before the Storm",
      thumbnailUrl: "https://picsum.photos/seed/s2ep4/400/225",
      vimeoId: "",
      genre: "series",
      subGenre: null,
      purpose: "personal",
      creatorId: null,
      isOriginal: false,
      isFinalist: false,
      award: null,
      runtime: "8:02",
      createdAt: new Date("2026-05-22").toISOString(),
      visibility: "public",
      description: "On the eve of change, an uneasy quiet settles in.",
      aiTools: [],
      tags: [],
      seriesName: video.seriesName,
      episodeNumber: 4,
      uploadedBy: video.uploadedBy,
      viewCount: 201,
    },
  ];

  const mockSeasons = [
    { season: 1, episodes: mockSeason1 },
    { season: 2, episodes: mockSeason2 },
  ];

  const displaySeriesNav = {
    ...seriesNav,
    episodes: seriesNav.episodes.length > 1 ? seriesNav.episodes : mockSeason1,
    seasons: mockSeasons,
  };

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
  const displayTags = video.tags.length > 0 ? video.tags :
    ["AIFilm", "GenerativeAI", "AIcinema", "ShortFilm", "FutureCinema"];
  const displayAiTools = video.aiTools.length > 0 ? video.aiTools :
    ["Midjourney", "Runway", "ElevenLabs"];

  const displayComments = comments.length > 0 ? comments : [
    {
      id: "mock-1",
      videoId: video.id,
      userId: "mock-user-1",
      displayName: "Sarah Kim",
      avatarUrl: "https://i.pravatar.cc/32?img=1",
      content: "Amazing cinematography! The way you used AI to create those fluid transitions is breathtaking.",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      likeCount: 12,
      likedByMe: false,
      parentId: null,
      replies: [],
    },
    {
      id: "mock-2",
      videoId: video.id,
      userId: "mock-user-2",
      displayName: "Alex Chen",
      avatarUrl: "https://i.pravatar.cc/32?img=2",
      content: "The storytelling is so unique. What AI tools did you use for the visuals?",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      likeCount: 8,
      likedByMe: false,
      parentId: null,
      replies: [],
    },
    {
      id: "mock-3",
      videoId: video.id,
      userId: "mock-user-3",
      displayName: "Maya Lee",
      avatarUrl: "https://i.pravatar.cc/32?img=3",
      content: "Short but impactful message. Works like this show AI filmmaking has real artistic potential 🎬",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      likeCount: 7,
      likedByMe: false,
      parentId: null,
      replies: [],
    },
    {
      id: "mock-4",
      videoId: video.id,
      userId: "mock-user-4",
      displayName: "Ryan Ko",
      avatarUrl: "https://i.pravatar.cc/32?img=4",
      content: "The music and narrative work together so well. Would love to see a longer version!",
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      likeCount: 5,
      likedByMe: false,
      parentId: null,
      replies: [],
    },
    {
      id: "mock-5",
      videoId: video.id,
      userId: "mock-user-5",
      displayName: "Minji Park",
      avatarUrl: "https://i.pravatar.cc/32?img=5",
      content: "The direction is really refined. Seeing new possibilities in Korean AI animation!",
      createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      likeCount: 4,
      likedByMe: false,
      parentId: null,
      replies: [],
    },
  ] as typeof comments;

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
                  viewCount={video.viewCount}
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
