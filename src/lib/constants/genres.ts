// Five primary genre buckets (film hub, animation, music, daily life, art/experimental)
export const MAIN_GENRE_KEYS = [
  "film",
  "animation",
  "music",
  "daily",
  "art",
] as const;

export type MainGenreKey = (typeof MAIN_GENRE_KEYS)[number];

export const MAIN_GENRE_LABELS: Record<MainGenreKey, string> = {
  film: "Film",
  animation: "Animation",
  music: "Music",
  daily: "Daily",
  art: "Art",
};

// 각 메인 장르에 속하는 서브 장르 매핑
export const GENRE_CATEGORY_MAP: Record<MainGenreKey, string[]> = {
  film: [
    "short_film", "feature", "series", "documentary",
    "feed_drama", "feed_horror", "feed_sci_fi", "feed_action",
    "feed_romance", "feed_comedy", "feed_thriller", "feed_cinematic_emotional",
  ],
  animation: ["animation"],
  music: ["mv", "feed_soundscape"],
  daily: [
    "feed_daily_life", "feed_travel", "feed_food",
    "feed_pets_animals", "feed_sports", "feed_tutorial",
    "feed_landscape_nature", "feed_city_architecture",
    "feed_shocking_viral", "feed_dynamic_speed",
    "feed_funny_meme", "feed_gaming", "feed_fashion_beauty",
  ],
  art: [
    "experimental_art", "feed_cyberpunk", "feed_fantasy",
    "feed_asmr_healing", "feed_twist", "commercial_brand",
  ],
};

import type { Locale } from "@/lib/i18n/translations";
import { translate } from "@/lib/i18n/translations";

// Legacy slug → primary bucket
export const LEGACY_GENRE_MAP: Record<string, MainGenreKey> = {
  short_film: "film",
  feature: "film",
  series: "film",
  documentary: "film",
  feed_drama: "film",
  feed_horror: "film",
  feed_sci_fi: "film",
  feed_action: "film",
  feed_romance: "film",
  feed_comedy: "film",
  feed_cinematic_emotional: "film",
  animation: "animation",
  mv: "music",
  feed_soundscape: "music",
  feed_daily_life: "daily",
  feed_travel: "daily",
  feed_food: "daily",
  feed_pets_animals: "daily",
  feed_sports: "daily",
  feed_tutorial: "daily",
  feed_landscape_nature: "daily",
  feed_city_architecture: "daily",
  feed_shocking_viral: "daily",
  feed_dynamic_speed: "daily",
  feed_funny_meme: "daily",
  feed_gaming: "daily",
  feed_fashion_beauty: "daily",
  experimental_art: "art",
  feed_cyberpunk: "art",
  feed_fantasy: "art",
  feed_asmr_healing: "art",
  feed_twist: "art",
  commercial_brand: "art",
  meme_humor: "daily",
  other: "film",
};

export function normalizeToMainGenre(raw: string | null | undefined): MainGenreKey | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if ((MAIN_GENRE_KEYS as readonly string[]).includes(trimmed)) return trimmed as MainGenreKey;
  return LEGACY_GENRE_MAP[trimmed] ?? null;
}

const BUCKET_TO_I18N: Record<MainGenreKey, string> = {
  film: "genre.bucketFilm",
  animation: "genre.animation",
  music: "genre.bucketMusic",
  daily: "genre.bucketDaily",
  art: "genre.bucketArt",
};

/** Primary bucket label; uses i18n when locale is not English. */
export function mainGenreLabel(key: string | null | undefined, locale?: Locale): string {
  const normalized = normalizeToMainGenre(key);
  if (normalized) {
    const i18nKey = BUCKET_TO_I18N[normalized];
    if (locale && locale !== "en") return translate(locale, i18nKey, MAIN_GENRE_LABELS[normalized]);
    return MAIN_GENRE_LABELS[normalized];
  }
  const trimmed = key?.trim();
  if (!trimmed) return "—";
  const slugKey = `genre.${trimmed}`;
  return translate(locale ?? "en", slugKey, trimmed);
}

// Upload form: primary buckets only
export const UPLOAD_GENRE_OPTIONS = MAIN_GENRE_KEYS.map((k) => ({
  value: k,
  label: MAIN_GENRE_LABELS[k],
}));

// Aliases for older import paths
export const FEED_GENRE_KEYS = MAIN_GENRE_KEYS;
export const FEED_GENRE_LABELS = MAIN_GENRE_LABELS;
export const FILMS_GENRE_KEYS = MAIN_GENRE_KEYS;
export const FILMS_GENRE_LABELS = MAIN_GENRE_LABELS;
export type FeedGenreKey = MainGenreKey;
export type FilmsGenreKey = MainGenreKey;

// compatibility exports for existing consumers
export function normalizeMainGenreKey(raw: string | null | undefined): MainGenreKey | null {
  return normalizeToMainGenre(raw);
}

export const SUB_GENRE_KEYS = [
  "romance",
  "sf",
  "action",
  "comedy",
  "thriller",
  "horror",
  "drama",
  "fantasy",
  "mystery",
  "other",
] as const;

export type SubGenreKey = (typeof SUB_GENRE_KEYS)[number];

export const SUB_GENRE_LABELS: Record<SubGenreKey, string> = {
  romance: "Romance",
  sf: "Sci-Fi",
  action: "Action",
  comedy: "Comedy",
  thriller: "Thriller",
  horror: "Horror",
  drama: "Drama",
  fantasy: "Fantasy",
  mystery: "Mystery",
  other: "Other",
};

export const MAIN_GENRES_WITH_SUB: ReadonlySet<MainGenreKey> = new Set(["film", "animation"]);

export function subGenreLabel(key: string | null | undefined, locale?: Locale): string {
  if (!key) return "";
  if ((SUB_GENRE_KEYS as readonly string[]).includes(key)) {
    const sk = key as SubGenreKey;
    const i18nKey = `genre.sub.${sk}`;
    if (locale && locale !== "en") return translate(locale, i18nKey, SUB_GENRE_LABELS[sk]);
    return SUB_GENRE_LABELS[sk];
  }
  return key;
}

export function formatGenreDisplay(
  mainKey: string | null | undefined,
  subKey: string | null | undefined,
  locale?: Locale,
): string {
  const main = mainGenreLabel(mainKey, locale);
  const sub = subKey ? subGenreLabel(subKey, locale) : "";
  return sub ? `${main} · ${sub}` : main;
}

export function needsSubGenre(mainKey: string | null | undefined): boolean {
  const normalized = normalizeToMainGenre(mainKey);
  return normalized ? MAIN_GENRES_WITH_SUB.has(normalized) : false;
}

export const PURPOSE_OPTIONS = [
  { value: "personal" as const, label: "Personal Work", description: "Upload to your portfolio outside competitions." },
  { value: "competition" as const, label: "Competition Entry", description: "Submit to an active competition." },
];
