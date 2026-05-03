import { MAIN_GENRE_KEYS, MAIN_GENRE_LABELS, type MainGenreKey } from "@/lib/constants/genres";

/** 탐색 그리드 — 주 장르 버킷과 동일 */
export const EXPLORE_GENRE_KEYS = MAIN_GENRE_KEYS;

const DEFAULT_GENRE_GRADIENT = "from-[#534AB7] via-[#3C3489] to-[#1A1535]";

/** 버킷별 그라데이션 (레거시 서브슬러그는 버킷으로 통합됨) */
export const GENRE_CARD_GRADIENT: Partial<Record<MainGenreKey, string>> = {
  film: "from-[#4B3FB5] via-[#362A7A] to-[#1A1535]",
  animation: "from-[#6354C9] via-[#453A85] to-[#131028]",
  music: "from-[#3F51B5] via-[#2D3A7D] to-[#0A0A18]",
  daily: "from-[#534AB7] via-[#3C3489] to-[#1A1535]",
  art: "from-[#6B5AD6] via-[#4A3F90] to-[#131028]",
};

export function genreCardGradient(key: MainGenreKey): string {
  return GENRE_CARD_GRADIENT[key] ?? DEFAULT_GENRE_GRADIENT;
}
