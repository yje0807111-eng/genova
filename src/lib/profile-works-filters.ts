import type { Video } from "@/lib/types";

export type ProfileSortKey = "recent" | "views" | "likes";

export function sortProfileVideos(videos: Video[], sort: ProfileSortKey): Video[] {
  const copy = [...videos];
  if (sort === "recent") {
    copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sort === "views") {
    copy.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
  } else {
    copy.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
  }
  return copy;
}

export function filterAwardVideos(videos: Video[]): Video[] {
  return videos.filter((v) => Boolean(v.award?.trim()));
}

export function filterCompetitionVideos(videos: Video[]): Video[] {
  return videos.filter((v) => v.purpose === "competition");
}

export type SeriesGroup = { name: string; videos: Video[] };

/** 시리즈 이름별 그룹; 에피소드는 회차순. 그룹 순서는 sort 기준 */
export function buildSeriesGroups(videos: Video[], sort: ProfileSortKey): SeriesGroup[] {
  const map = new Map<string, Video[]>();
  for (const v of videos) {
    const name = v.seriesName?.trim();
    if (!name) continue;
    const list = map.get(name) ?? [];
    list.push(v);
    map.set(name, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => (a.episodeNumber ?? 9999) - (b.episodeNumber ?? 9999));
  }
  const groups: SeriesGroup[] = [...map.entries()].map(([name, vids]) => ({ name, videos: vids }));

  const groupScore = (g: SeriesGroup): number => {
    if (sort === "recent") {
      return Math.max(0, ...g.videos.map((v) => new Date(v.createdAt).getTime()));
    }
    if (sort === "views") {
      return g.videos.reduce((s, v) => s + (v.viewCount ?? 0), 0);
    }
    return g.videos.reduce((s, v) => s + (v.likeCount ?? 0), 0);
  };
  groups.sort((a, b) => groupScore(b) - groupScore(a));
  return groups;
}
