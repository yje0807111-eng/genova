import type { Video } from "@/lib/types";

export function hrefForVideoCreator(video: Video): string | null {
  if (video.uploadedBy) return `/profile/${video.uploadedBy}`;
  if (video.creatorId) return `/creator/${video.creatorId}`;
  return null;
}
