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

// Aliases for older import paths
export const FILMS_GENRE_KEYS = MAIN_GENRE_KEYS;
export type FeedGenreKey = MainGenreKey;
export type FilmsGenreKey = MainGenreKey;

// compatibility exports for existing consumers
export function normalizeMainGenreKey(raw: string | null | undefined): MainGenreKey | null {
  return normalizeToMainGenre(raw);
}

export function formatGenreDisplay(
  mainKey: string | null | undefined,
  locale?: Locale,
): string {
  return mainGenreLabel(mainKey, locale);
}

