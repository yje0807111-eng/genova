import { MAIN_GENRE_LABELS, normalizeToMainGenre, type MainGenreKey } from "@/lib/constants/genres";
import type { Video } from "@/lib/types";

export type GenreFilter = "All" | MainGenreKey;

export function filterVideosByGenre(videos: Video[], filter: GenreFilter): Video[] {
  if (filter === "All") return videos;
  return videos.filter((v) => normalizeToMainGenre(v.genre) === filter);
}

export function genreFilterLabel(g: GenreFilter): string {
  if (g === "All") return "All";
  return MAIN_GENRE_LABELS[g as MainGenreKey] ?? g;
}
