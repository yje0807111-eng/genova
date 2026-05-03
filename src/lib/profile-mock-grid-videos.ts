import type { Video } from "@/lib/types";

/** 빈 그리드 대체용 6개 (Supabase 결과 없을 때) */
export function createProfileMockGridVideos(seed: string): Video[] {
  const now = new Date().toISOString();
  return Array.from({ length: 6 }, (_, i) => {
    const idx = i + 1;
    return {
      id: `mock-profile-grid-${seed}-${idx}`,
      title: `Preview ${idx}`,
      thumbnailUrl: `https://picsum.photos/seed/${seed}-${idx}/640/640`,
      vimeoId: "",
      genre: "short_film",
      subGenre: null,
      purpose: "personal",
      creatorId: null,
      isOriginal: true,
      isFinalist: seed === "competition",
      award: null,
      runtime: "1:00",
      createdAt: now,
      visibility: "public",
      description: "",
      aiTools: [],
      tags: [],
      seriesName: null,
      episodeNumber: null,
      uploadedBy: null,
      viewCount: 800 + idx * 211,
    } satisfies Video;
  });
}
