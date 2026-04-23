import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoCommentsSection } from "@/components/comments/video-comments-section";
import { AnimateIn } from "@/components/animate-in";
import { FollowButton } from "@/components/profile/follow-button";
import { ProfileTextLink } from "@/components/links/profile-text-link";
import { VideoEngagementBar } from "@/components/video/video-engagement-bar";
import { formatGenreDisplay } from "@/lib/constants/genres";
import { hrefForVideoCreator } from "@/lib/creator-links";
import { fetchCommentsForVideo } from "@/lib/queries/comments-queries";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import { incrementVideoViewCount } from "@/lib/queries/video-views";
import { fetchCreatorById, fetchRelatedVideos, fetchSeriesEpisodesForVideo, fetchVideoById } from "@/lib/queries";
import { fetchIsFollowing, fetchProfileById } from "@/lib/queries/profile-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatViewCountShort } from "@/lib/view-count";

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

  const [creator, related, seriesNav, comments, uploaderProfile, isFollowing] = await Promise.all([
    video.creatorId ? fetchCreatorById(video.creatorId) : Promise.resolve(null),
    fetchRelatedVideos(video.id, 8),
    fetchSeriesEpisodesForVideo(video),
    fetchCommentsForVideo(video.id),
    video.uploadedBy ? fetchProfileById(video.uploadedBy) : Promise.resolve(null),
    video.uploadedBy ? fetchIsFollowing(user?.id, video.uploadedBy) : Promise.resolve(false),
  ]);

  const showSeries = seriesNav.episodes.length > 0;
  const creatorHref = hrefForVideoCreator(video);

  const showFollow = Boolean(video.uploadedBy && user?.id && user.id !== video.uploadedBy);

  const hasCatalogCreator = Boolean(video.creatorId && creator);
  const displayName = hasCatalogCreator
    ? creator!.name
    : (video.uploaderDisplayName ?? uploaderProfile?.displayName ?? "Creator");
  const avatarUrl = hasCatalogCreator ? creator!.avatarUrl : uploaderProfile?.avatarUrl ?? null;
  const bioOneLine = hasCatalogCreator ? creator!.bio : uploaderProfile?.bio ?? "";

  const metaParts = [
    formatGenreDisplay(video.genre, video.subGenre),
    video.runtime,
    video.genre === "series" && video.seriesName && video.episodeNumber
      ? `${video.seriesName} · EP.${video.episodeNumber}`
      : null,
    video.purpose === "competition" ? "Competition Entry" : null,
  ].filter(Boolean) as string[];
  const metaLine = metaParts.join(" · ");

  return (
    <div className="mx-auto max-w-[1720px] px-4 py-5 text-[#EEEDFE] sm:px-6 sm:py-8 lg:px-10">
      <AnimateIn delay={0} className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
              <iframe
                src={`https://player.vimeo.com/video/${video.vimeoId}`}
                className="h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={video.title}
              />
      </AnimateIn>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)] lg:items-start">
          <div className="min-w-0 space-y-4">
            <AnimateIn delay={0.1} className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2 pr-2">
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#EEEDFE] sm:text-3xl">{video.title}</h1>
                <p className="text-sm text-[#AFA9EC]">{metaLine}</p>
                <p className="text-xs text-[#AFA9EC]">{formatViewCountShort(video.viewCount)} views</p>
                {video.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {video.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-[#534AB7]/30 px-2 py-0.5 text-[11px] font-medium text-[#E8E4FF]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="shrink-0 pt-0.5">
                <VideoEngagementBar
                  videoId={video.id}
                  likeCount={video.likeCount ?? 0}
                  likedByMe={video.likedByMe ?? false}
                  savedByMe={video.savedByMe ?? false}
                />
              </div>
            </AnimateIn>

            <div className="border-t border-white/10" />

            <AnimateIn delay={0.2} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0F0D1E] p-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#26215C]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#AFA9EC]">
                      {displayName.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {creatorHref ? (
                    <ProfileTextLink
                      href={creatorHref}
                      className="block truncate text-sm font-semibold text-[#EEEDFE] hover:underline sm:text-base"
                    >
                      {displayName}
                    </ProfileTextLink>
                  ) : (
                    <p className="truncate text-sm font-semibold sm:text-base">{displayName}</p>
                  )}
                  {bioOneLine ? (
                    <p className="line-clamp-2 text-xs leading-snug text-[#AFA9EC] sm:text-sm">{bioOneLine}</p>
                  ) : null}
                </div>
              </div>
              {showFollow ? (
                <div className="shrink-0">
                  <FollowButton targetUserId={video.uploadedBy!} initialFollowing={isFollowing} />
                </div>
              ) : null}
            </AnimateIn>

            <div className="border-t border-white/10" />

            {video.description ? (
              <div className="text-sm leading-relaxed text-[#D8D4F5]">
                <p className="whitespace-pre-wrap">{video.description}</p>
              </div>
            ) : null}
            {video.aiTools.length > 0 ? (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-[#EEEDFE]">AI Tools Used</h2>
                <div className="flex flex-wrap gap-1.5">
                  {video.aiTools.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-full border border-[#534AB7] bg-[#1A1535] px-2.5 py-1 text-xs text-[#AFA9EC]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <AnimateIn delay={0.3}>
              <VideoCommentsSection
              videoId={video.id}
              initialComments={comments}
              currentUserId={user?.id ?? null}
              className="rounded-lg border border-white/10 bg-[#1A1535]/70 p-4"
              />
            </AnimateIn>
          </div>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
            {showSeries ? (
              <section className="rounded-lg border border-white/10 bg-[#1A1535]/70 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AFA9EC]">Series</p>
                <p className="mt-1 truncate text-sm font-semibold text-[#EEEDFE]">{seriesNav.seriesTitle}</p>
                {(seriesNav.prevId || seriesNav.nextId) && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {seriesNav.prevId ? (
                      <Link
                        href={`/watch/${seriesNav.prevId}`}
                        className="rounded-full border border-white/15 bg-[#0A0A18]/80 px-2.5 py-1 text-[#C5C1F1] transition hover:border-[#7F77DD]/50 hover:text-[#EEEDFE]"
                      >
                        ← Prev
                      </Link>
                    ) : null}
                    {seriesNav.nextId ? (
                      <Link
                        href={`/watch/${seriesNav.nextId}`}
                        className="rounded-full border border-white/15 bg-[#0A0A18]/80 px-2.5 py-1 text-[#C5C1F1] transition hover:border-[#7F77DD]/50 hover:text-[#EEEDFE]"
                      >
                        Next →
                      </Link>
                    ) : null}
                  </div>
                )}
                <ul className="mt-3 max-h-[min(52vh,28rem)] space-y-2 overflow-y-auto pr-0.5">
                  {seriesNav.episodes.map((ep) => (
                    <li key={ep.id}>
                      <Link
                        href={`/watch/${ep.id}`}
                        className={`flex gap-2 rounded-md border p-1.5 transition ${
                          ep.id === video.id
                            ? "border-[#7F77DD] bg-[#534AB7]/20 ring-1 ring-[#7F77DD]/35"
                            : "border-white/10 bg-[#0A0A18]/50 hover:border-[#7F77DD]/40"
                        }`}
                      >
                        <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded bg-black/40">
                          <img src={ep.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1 py-0.5">
                          <p className="text-[11px] font-semibold text-[#7F77DD]">EP.{ep.episodeNumber}</p>
                          <p className="line-clamp-2 text-xs leading-snug text-[#EEEDFE]">{ep.title}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#AFA9EC]">Related Films</h2>
              <ul className="space-y-2">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/watch/${item.id}`}
                      className="group flex gap-2 overflow-hidden rounded-md border border-white/10 bg-[#1A1535]/70 p-1.5 transition hover:border-[#7F77DD]/45 hover:bg-[#221B46]"
                    >
                      <div className="relative h-[4.5rem] w-[5.25rem] shrink-0 overflow-hidden rounded bg-[#0A0A18]">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt=""
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-[#AFA9EC]">
                            None
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="line-clamp-2 text-xs font-semibold leading-snug text-[#EEEDFE]">{item.title}</p>
                        <p className="mt-0.5 truncate text-[11px] text-[#C5C1F1]">
                          {item.creatorName ?? item.uploaderDisplayName ?? "Creator"}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#AFA9EC]">{item.runtime}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {related.length === 0 ? (
                <p className="text-xs text-[#AFA9EC]">No recommendations yet.</p>
              ) : null}
            </section>
          </aside>
        </div>
    </div>
  );
}
