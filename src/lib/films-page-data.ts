import {
  FILMS_GENRE_KEYS,
  FILMS_GENRE_LABELS,
  normalizeMainGenreKey,
  type FilmsGenreKey,
} from "@/lib/constants/genres";
import type { Video } from "@/lib/types";

export type GenreSpotlightRow = {
  genreKey: FilmsGenreKey;
  label: string;
  picks: Video[];
};

function sortByRecent(a: Video, b: Video): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function buildFilmsPageData(videos: Video[]) {
  const originals = videos.filter((v) => v.isOriginal).sort(sortByRecent);
  const awardWinners = videos
    .filter((v) => v.award != null && String(v.award).trim() !== "")
    .sort(sortByRecent);
  const editorsPicks = videos.filter((v) => v.isFinalist).sort(sortByRecent);

  const byGenre = new Map<FilmsGenreKey, Video[]>();
  for (const k of FILMS_GENRE_KEYS) {
    byGenre.set(k, []);
  }
  for (const v of videos) {
    const k = normalizeMainGenreKey(v.genre);
    if (!k || !(FILMS_GENRE_KEYS as readonly string[]).includes(k)) continue;
    const fk = k as FilmsGenreKey;
    byGenre.get(fk)?.push(v);
  }

  const genreSpotlight: GenreSpotlightRow[] = FILMS_GENRE_KEYS.map((genreKey) => {
    const realVideos = (byGenre.get(genreKey) ?? []).slice().sort(sortByRecent);
    return {
      genreKey,
      label: FILMS_GENRE_LABELS[genreKey],
      picks: realVideos.slice(0, 12),
    };
  });

  return { originals, awardWinners, editorsPicks, genreSpotlight };
}
