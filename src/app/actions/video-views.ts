"use server";

import { incrementVideoViewCount } from "@/lib/queries/video-views";

/** Called when a Shorts slide becomes active (client). */
export async function recordShortsViewAction(videoId: string): Promise<void> {
  await incrementVideoViewCount(videoId);
}
