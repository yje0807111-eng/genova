"use client";

import { useEffect, type ReactNode } from "react";
import { WatchMetaSidebar } from "@/components/video/watch-meta-sidebar";
import type { Video, VideoComment } from "@/lib/types";

/** Server page wraps description + sidebar in one client boundary. */
export function WatchDesktopFlexRow({
  playerSlot,
  belowPlayerSlot,
  descriptionInner,
  leftAfterDescription,
  upNextSlot,
  videoId,
  commentCount,
  initialComments,
  currentUserId,
  isVideoOwner,
  video,
  creatorId,
  creatorName,
  creatorAvatarUrl,
  creatorHref,
  creatorVideoCount,
  creatorFollowerCount,
  isFollowingCreator,
}: {
  playerSlot: ReactNode;
  belowPlayerSlot?: ReactNode;
  descriptionInner: ReactNode;
  leftAfterDescription: ReactNode;
  // Pre-rendered "Up next" rail — server component (B.2-5) composed by the
  // watch page and passed through as ReactNode so this client boundary
  // doesn't have to re-render the rail on every state change.
  upNextSlot: ReactNode;
  videoId: string;
  commentCount: number;
  initialComments: VideoComment[];
  currentUserId: string | null;
  onAutoplayChange?: (on: boolean) => void;
  isVideoOwner?: boolean;
  video: Video;
  creatorId: string;
  creatorName: string;
  creatorAvatarUrl: string | null;
  creatorHref: string | null;
  creatorVideoCount: number;
  creatorFollowerCount: number;
  isFollowingCreator: boolean;
}) {
  useEffect(() => {
    void fetch("/api/watch-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
  }, [videoId]);

  return (
    <div className="space-y-6">
      {/* Row 1: player + sidebar + mini queue */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px_84px]">
        <div className="min-w-0">
          {playerSlot}
        </div>

        <aside className="relative">
          <div className="flex flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.01] lg:absolute lg:inset-0">
            <WatchMetaSidebar
              videoId={videoId}
              video={video}
              creatorId={creatorId}
              creatorName={creatorName}
              creatorAvatarUrl={creatorAvatarUrl}
              creatorHref={creatorHref}
              creatorVideoCount={creatorVideoCount}
              creatorFollowerCount={creatorFollowerCount}
              isFollowingCreator={isFollowingCreator}
              currentUserId={currentUserId}
              descriptionInner={descriptionInner}
              commentCount={commentCount}
              initialComments={initialComments}
              isVideoOwner={isVideoOwner}
              playerActions={belowPlayerSlot}
            />
          </div>
        </aside>

        <aside className="relative">
          <div className="flex flex-col gap-1.5 overflow-x-hidden lg:absolute lg:inset-0 lg:overflow-y-auto">
            {upNextSlot}
          </div>
        </aside>
      </div>

      {/* Row 2: series slider — left column width only */}
      {leftAfterDescription && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px_84px]">
          <div className="min-w-0">
            {leftAfterDescription}
          </div>
        </div>
      )}
    </div>
  );
}
