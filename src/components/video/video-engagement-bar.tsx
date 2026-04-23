"use client";

import { VideoLikeButton } from "@/components/video/video-like-button";
import { VideoSaveButton } from "@/components/video/video-save-button";

export function VideoEngagementBar(props: {
  videoId: string;
  likeCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${props.className ?? ""}`}>
      <VideoLikeButton
        videoId={props.videoId}
        initialCount={props.likeCount}
        initialLiked={props.likedByMe}
      />
      <VideoSaveButton videoId={props.videoId} initialSaved={props.savedByMe} />
    </div>
  );
}
