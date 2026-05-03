"use client";

import { VideoLikeButton } from "@/components/video/video-like-button";
import { VideoSaveButton } from "@/components/video/video-save-button";

export function VideoEngagementBar(props: {
  videoId: string;
  likeCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  /** 저장 수 (없으면 0) */
  saveCount?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 ${props.className ?? ""}`}>
      <VideoLikeButton
        videoId={props.videoId}
        initialCount={props.likeCount}
        initialLiked={props.likedByMe}
        compact={false}
        className="transition-opacity hover:opacity-80 active:opacity-60"
      />
      <VideoSaveButton
        videoId={props.videoId}
        initialSaved={props.savedByMe}
        initialCount={props.saveCount ?? 0}
        compact={false}
        className="transition-opacity hover:opacity-80 active:opacity-60"
      />
    </div>
  );
}
