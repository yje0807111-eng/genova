import { Suspense } from "react";
import type { Metadata } from "next";
import { after } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WatchMoreMenu } from "@/components/video/watch-more-menu";
import { ShareButton } from "@/components/video/share-modal";
import { WatchDescriptionInner } from "@/components/video/watch-detail-client";
import { WatchRecommendations } from "@/components/video/watch-recommendations";
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

  // 조회수 증가는 렌더를 막지 않게 응답 후로 지연(after).  내부에
  // 여러 RLS 우회 라운드트립이 있어 TTFB 를 크게 늘리던 원인.
  after(() => {
    void incrementVideoViewCount(id, { uploaderId: video?.uploadedBy ?? null });
  });

  // Parallelize the post-resolve I/O block.  All six are independent
  // (they share no state beyond the resolved `video` and `id`) so
  // running them concurrently shaves multiple round-trips off TTFB on
  // the highest-traffic dynamic page.  Each helper creates its own
  // request-cached server supabase client internally — no shared
  // handle needed.
  // 단일 병렬 배치 — 2차 의존(시리즈/댓글/추천 등)은 user 가 아닌
  // 이미 resolve 된 video 만 필요하므로 1차와 합쳐 직렬 라운드트립
  // 한 단계를 제거.  user 가 필요한 isFollowing 만 userPromise 에
  // 체이닝해 같은 배치 안에서 동시 실행.
  const supabase = await createServerSupabaseClient();
  const uploaderId = video.uploadedBy;
  const userPromise = supabase
    ? supabase.auth.getUser()
    : Promise.resolve({ data: { user: null } });
  const [
    userResult,
    engagementResult,
    progress,
    cookieStore,
    rawRelated,
    creatorResult,
    seriesNavRaw,
    comments,
    uploaderProfile,
    isFollowing,
  ] = await Promise.all([
    userPromise,
    attachEngagementToVideos([video]),
    getVideoProgress(video.id),
    cookies(),
    fetchRelatedVideos(video.id, 20),
    video.creatorId ? fetchCreatorById(video.creatorId) : Promise.resolve(null),
    fetchSeriesEpisodesForVideo(video),
    fetchCommentsForVideo(video.id),
    uploaderId ? fetchPublicProfileById(uploaderId) : Promise.resolve(null),
    uploaderId
      ? userPromise.then((r) =>
          fetchIsFollowing(r.data?.user?.id, uploaderId),
        )
      : Promise.resolve(false),
  ]);

  const user = userResult.data?.user ?? null;
  video = engagementResult[0];

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

  const creator = creatorResult;
  const seriesNav: SeriesEpisodesNav = seriesNavRaw;
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

  const displayComments = comments;

  return (
    <div className="mx-auto max-w-[2200px] py-6 pl-5 pr-3 text-white md:pl-10 md:pr-5 2xl:pl-12 2xl:pr-6">
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
          <ShareButton title={video.title} videoId={video.id} thumbnailUrl={video.thumbnailUrl} />
        }
        moreSlot={<WatchMoreMenu videoId={video.id} />}
        descriptionInner={
          <WatchDescriptionInner description={rawDescription} tags={displayTags} />
        }
        leftAfterDescription={null}
        seriesEpisodes={showSeries ? displaySeriesNav.episodes : undefined}
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

      {/* 모바일에선 숨김 — 시청 페이지 과밀 완화.  Suspense 로
          스트리밍: 추천 fetch/merge 가 플레이어 렌더를 막지 않음. */}
      <div className="hidden md:block">
        <Suspense fallback={null}>
          <WatchRecommendations
            videoId={video.id}
            genre={video.genre}
            currentSeriesName={showSeries ? (video.seriesName ?? null) : null}
          />
        </Suspense>
      </div>
    </div>
  );
}
