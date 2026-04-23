import { MAIN_GENRE_KEYS, MAIN_GENRE_LABELS, type MainGenreKey } from "@/lib/constants/genres";

/** 탐색 그리드(‘기타’ 제외) */
export const EXPLORE_GENRE_KEYS = MAIN_GENRE_KEYS.filter((k) => k !== "other") as MainGenreKey[];

const DEFAULT_GENRE_GRADIENT = "from-[#534AB7] via-[#3C3489] to-[#1A1535]";

/** Explicit gradients where defined; newer feed slugs fall back to default */
export const GENRE_CARD_GRADIENT: Partial<Record<MainGenreKey, string>> = {
  short_film: "from-[#4B3FB5] via-[#362A7A] to-[#1A1535]",
  series: "from-[#5A4FD6] via-[#3D3680] to-[#131028]",
  feature: "from-[#4438B0] via-[#2E2668] to-[#0A0A18]",
  documentary: "from-[#4D42A8] via-[#2F2862] to-[#1A1535]",
  animation: "from-[#6354C9] via-[#453A85] to-[#131028]",
  mv: "from-[#3F51B5] via-[#2D3A7D] to-[#0A0A18]",
  commercial_brand: "from-[#4A3FA3] via-[#332B72] to-[#1A1535]",
  experimental_art: "from-[#6B5AD6] via-[#4A3F90] to-[#131028]",
  meme_humor: "from-[#534AB7] via-[#3C3489] to-[#1A1535]",
  other: "from-[#3A3470] to-[#1A1535]",
};

export function genreCardGradient(key: MainGenreKey): string {
  return GENRE_CARD_GRADIENT[key] ?? DEFAULT_GENRE_GRADIENT;
}
