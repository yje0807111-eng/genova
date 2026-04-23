import type { Video } from "@/lib/types";

/** 업로더 UUID 우선, 없으면 creators.id(c1 등)도 /profile/[id]로 통일 */
export function hrefForVideoCreator(video: Video): string | null {
  if (video.uploadedBy) return `/profile/${video.uploadedBy}`;
  if (video.creatorId) return `/profile/${video.creatorId}`;
  return null;
}

/** 홈 스포트라이트도 /profile/[id]로 통일 */
export function hrefForSpotlightCreator(id: string): string {
  return `/profile/${id}`;
}
