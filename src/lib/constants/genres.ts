/** Professional / cinematic — Films page, curated spotlight, “Films Genres” on upload */
export const FILMS_GENRE_KEYS = [
  "short_film",
  "feature",
  "series",
  "documentary",
  "animation",
  "mv",
  "commercial_brand",
  "experimental_art",
] as const;

export type FilmsGenreKey = (typeof FILMS_GENRE_KEYS)[number];

export const FILMS_GENRE_LABELS: Record<FilmsGenreKey, string> = {
  short_film: "Short Film",
  feature: "Feature Film",
  series: "Series",
  documentary: "Documentary",
  animation: "Animation",
  mv: "Music Video",
  commercial_brand: "Commercial",
  experimental_art: "Experimental",
};

/** Community / daily — Feed sidebar, “Feed Genres” on upload */
export const FEED_GENRE_KEYS = [
  "feed_landscape_nature",
  "feed_city_architecture",
  "feed_drama",
  "feed_comedy",
  "feed_romance",
  "feed_sci_fi",
  "feed_action",
  "feed_horror",
  "feed_cyberpunk",
  "feed_fantasy",
  "feed_cinematic_emotional",
  "feed_soundscape",
  "feed_shocking_viral",
  "feed_dynamic_speed",
  "feed_funny_meme",
  "feed_twist",
  "feed_asmr_healing",
  "feed_tutorial",
  "feed_daily_life",
  "feed_travel",
  "feed_food",
  "feed_pets_animals",
  "feed_sports",
  "feed_gaming",
  "feed_fashion_beauty",
] as const;

export type FeedGenreKey = (typeof FEED_GENRE_KEYS)[number];

export const FEED_GENRE_LABELS: Record<FeedGenreKey, string> = {
  feed_landscape_nature: "Landscape/Nature",
  feed_city_architecture: "City/Architecture",
  feed_drama: "Drama",
  feed_comedy: "Comedy",
  feed_romance: "Romance",
  feed_sci_fi: "Sci-Fi",
  feed_action: "Action",
  feed_horror: "Horror",
  feed_cyberpunk: "Cyberpunk",
  feed_fantasy: "Fantasy",
  feed_cinematic_emotional: "Cinematic/Emotional",
  feed_soundscape: "Soundscape",
  feed_shocking_viral: "Shocking/Viral",
  feed_dynamic_speed: "Dynamic/Speed",
  feed_funny_meme: "Funny/Meme",
  feed_twist: "Twist",
  feed_asmr_healing: "ASMR/Healing",
  feed_tutorial: "Tutorial",
  feed_daily_life: "Daily Life",
  feed_travel: "Travel",
  feed_food: "Food",
  feed_pets_animals: "Pets/Animals",
  feed_sports: "Sports",
  feed_gaming: "Gaming",
  feed_fashion_beauty: "Fashion/Beauty",
};

/** Legacy slugs still valid in DB */
export const LEGACY_MISC_GENRE_KEYS = ["meme_humor", "other"] as const;

/** All values allowed in `videos.genre` (Supabase text + app validation) */
export const MAIN_GENRE_KEYS = [...FILMS_GENRE_KEYS, ...FEED_GENRE_KEYS, ...LEGACY_MISC_GENRE_KEYS] as const;

export type MainGenreKey = (typeof MAIN_GENRE_KEYS)[number];

export const MAIN_GENRE_LABELS = {
  ...FILMS_GENRE_LABELS,
  ...FEED_GENRE_LABELS,
  meme_humor: "Meme / Comedy",
  other: "Other",
} as const satisfies Record<MainGenreKey, string>;

/** 서브 장르 선택이 필요한 메인 장르 (Films professional genres only) */
export const MAIN_GENRES_WITH_SUB: ReadonlySet<FilmsGenreKey> = new Set([
  "short_film",
  "series",
  "feature",
  "documentary",
  "animation",
]);

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

/** 예전 한글/짧은 값 → slug (기존 DB 호환) */
export const LEGACY_GENRE_MAP: Record<string, MainGenreKey> = {
  숏필름: "short_film",
  단편시리즈: "series",
  "단편 시리즈": "series",
  장편: "feature",
  다큐멘터리: "documentary",
  애니메이션: "animation",
  MV: "mv",
  뮤직비디오: "mv",
  "뮤직비디오 (MV)": "mv",
  광고: "commercial_brand",
  "광고 / 브랜드 필름": "commercial_brand",
  "실험 / 아트 필름": "experimental_art",
  "밈 / 유머": "meme_humor",
  기타: "other",
};

export function isFilmsGenreKey(raw: string | null | undefined): raw is FilmsGenreKey {
  return Boolean(raw && (FILMS_GENRE_KEYS as readonly string[]).includes(raw));
}

export function isFeedGenreKey(raw: string | null | undefined): raw is FeedGenreKey {
  return Boolean(raw && (FEED_GENRE_KEYS as readonly string[]).includes(raw));
}

export function normalizeMainGenreKey(raw: string | null | undefined): MainGenreKey | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if ((MAIN_GENRE_KEYS as readonly string[]).includes(trimmed)) return trimmed as MainGenreKey;
  const legacy = LEGACY_GENRE_MAP[trimmed];
  if (legacy) return legacy;
  return null;
}

export function mainGenreLabel(key: string | null | undefined): string {
  const k = normalizeMainGenreKey(key);
  if (k) return MAIN_GENRE_LABELS[k];
  return key?.trim() || "—";
}

export function subGenreLabel(key: string | null | undefined): string {
  if (!key) return "";
  if (SUB_GENRE_KEYS.includes(key as SubGenreKey)) return SUB_GENRE_LABELS[key as SubGenreKey];
  return key;
}

/** 카드·피드용 한 줄 장르 문구 */
export function formatGenreDisplay(mainKey: string | null | undefined, subKey: string | null | undefined): string {
  const main = mainGenreLabel(mainKey);
  const sub = subKey ? subGenreLabel(subKey) : "";
  if (sub) return `${main} · ${sub}`;
  return main;
}

export function needsSubGenre(mainKey: string | null | undefined): boolean {
  const k = normalizeMainGenreKey(mainKey);
  return k ? MAIN_GENRES_WITH_SUB.has(k as FilmsGenreKey) : false;
}

export const PURPOSE_OPTIONS = [
  { value: "personal" as const, label: "Personal Work", description: "Upload to your portfolio outside competitions." },
  { value: "competition" as const, label: "Competition Entry", description: "Submit to an active competition." },
];
