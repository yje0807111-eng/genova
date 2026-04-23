"use client";

import Link from "next/link";
import { formatGenreDisplay } from "@/lib/constants/genres";
import { hrefForVideoCreator } from "@/lib/creator-links";
import type { Video } from "@/lib/types";
import { formatViewCountShort } from "@/lib/view-count";
import { VideoLikeButton } from "@/components/video/video-like-button";
import { VideoSaveButton } from "@/components/video/video-save-button";

export function VideoCard({ video }: { video: Video }) {
  const creatorLabel = video.creatorName ?? video.uploaderDisplayName ?? "Creator";
  const genreLine = formatGenreDisplay(video.genre, video.subGenre);
  const creatorHref = hrefForVideoCreator(video);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0F0D1E] transition duration-300 hover:scale-[1.03] hover:border-[#7F77DD]">
      <Link href={`/watch/${video.id}`} className="block aspect-video">
        <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />
      </Link>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 translate-y-2 p-4 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="line-clamp-2 text-base font-semibold text-[#EEEDFE]">{video.title}</p>
        {creatorHref ? (
          <p className="mt-1 text-xs text-[#CFCBF4]">{creatorLabel}</p>
        ) : (
          <p className="mt-1 text-xs text-[#CFCBF4]">{creatorLabel}</p>
        )}
        <div className="mt-2 flex items-center gap-2 text-[11px] text-[#AFA9EC]">
          <span className="rounded-full bg-black/45 px-2 py-0.5">{genreLine}</span>
          <span>{video.runtime}</span>
          <span>{formatViewCountShort(video.viewCount)} views</span>
        </div>
      </div>
      <div className="absolute right-2 top-2 z-20 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <VideoLikeButton
          videoId={video.id}
          initialCount={video.likeCount ?? 0}
          initialLiked={video.likedByMe ?? false}
          compact
        />
        <VideoSaveButton videoId={video.id} initialSaved={video.savedByMe ?? false} compact />
      </div>
    </div>
  );
}
