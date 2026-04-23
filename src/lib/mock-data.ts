import { mainGenreLabel, type MainGenreKey } from "@/lib/constants/genres";
import type { Video } from "@/lib/types";

/** Shared IDs for seed/local-search fallbacks (sync with supabase/seed-videos.sql) */
export const MOCK_VIDEO_LIKE_BY_ID: Record<string, number> = {
  v1: 128,
  v2: 96,
  v3: 64,
  v4: 210,
  v5: 42,
  v6: 55,
  v7: 88,
  v8: 33,
};

/**
 * Demo list used when Supabase has no videos or search API fails.
 * If seeded with the same IDs, this like count is used as fallback.
 */
export const MOCK_VIDEOS: Video[] = [
  {
    id: "v1",
    title: "Neon Waves",
    thumbnailUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1000&q=80",
    vimeoId: "76979871",
    genre: "short_film",
    subGenre: "sf",
    purpose: "personal",
    creatorId: "c1",
    isOriginal: true,
    isFinalist: true,
    award: "Grand Prize",
    runtime: "12 min",
    createdAt: new Date().toISOString(),
    visibility: "public",
    description: "An emotional sci-fi short made with generative AI.",
    aiTools: [],
    tags: ["Sci-Fi", "Emotional", "ShortFilm", "Neon"],
    seriesName: null,
    episodeNumber: null,
    uploadedBy: null,
    creatorName: "Seoha Lee",
    likeCount: MOCK_VIDEO_LIKE_BY_ID.v1,
  },
  {
    id: "v2",
    title: "Aurora City Chapter 1",
    thumbnailUrl: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=1000&q=80",
    vimeoId: "22439234",
    genre: "series",
    subGenre: "drama",
    purpose: "personal",
    creatorId: "c3",
    isOriginal: true,
    isFinalist: true,
    award: null,
    runtime: "18 min",
    createdAt: new Date().toISOString(),
    visibility: "public",
    description: "Episode 1 of a short-form universe.",
    aiTools: [],
    tags: ["Series", "Aurora", "Drama"],
    seriesName: "Aurora City",
    episodeNumber: 1,
    uploadedBy: null,
    creatorName: "Harin Jung",
    likeCount: MOCK_VIDEO_LIKE_BY_ID.v2,
  },
  {
    id: "v3",
    title: "Commercial: Beyond Taste",
    thumbnailUrl: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1000&q=80",
    vimeoId: "146022717",
    genre: "commercial_brand",
    subGenre: "comedy",
    purpose: "competition",
    creatorId: "c2",
    isOriginal: false,
    isFinalist: false,
    award: null,
    runtime: "2 min",
    createdAt: new Date().toISOString(),
    visibility: "public",
    description: "A brand film commercial.",
    aiTools: [],
    tags: ["Commercial", "Comedy", "Brand"],
    seriesName: null,
    episodeNumber: null,
    uploadedBy: null,
    creatorName: "Doyoon Park",
    likeCount: MOCK_VIDEO_LIKE_BY_ID.v3,
  },
  {
    id: "v4",
    title: "Polaris MV",
    thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1000&q=80",
    vimeoId: "357274789",
    genre: "mv",
    subGenre: null,
    purpose: "competition",
    creatorId: "c2",
    isOriginal: false,
    isFinalist: true,
    award: "Audience Award",
    runtime: "4 min",
    createdAt: new Date().toISOString(),
    visibility: "public",
    description: "Music video.",
    aiTools: [],
    tags: ["MV", "MusicVideo", "Polaris"],
    seriesName: null,
    episodeNumber: null,
    uploadedBy: null,
    creatorName: "Doyoon Park",
    likeCount: MOCK_VIDEO_LIKE_BY_ID.v4,
  },
  {
    id: "v5",
    title: "Han River Documentary: Night Fishing",
    thumbnailUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1000&q=80",
    vimeoId: "100000001",
    genre: "documentary",
    subGenre: "drama",
    purpose: "personal",
    creatorId: "c1",
    isOriginal: true,
    isFinalist: false,
    award: null,
    runtime: "25 min",
    createdAt: new Date().toISOString(),
    visibility: "public",
    description: "A documentary about the city and its people.",
    aiTools: [],
    tags: ["Documentary", "HanRiver", "Night"],
    seriesName: null,
    episodeNumber: null,
    uploadedBy: null,
    creatorName: "Seoha Lee",
    likeCount: MOCK_VIDEO_LIKE_BY_ID.v5,
  },
  {
    id: "v6",
    title: "Paper Star Animation",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&q=80",
    vimeoId: "100000002",
    genre: "animation",
    subGenre: "fantasy",
    purpose: "personal",
    creatorId: "c3",
    isOriginal: true,
    isFinalist: false,
    award: null,
    runtime: "7 min",
    createdAt: new Date().toISOString(),
    visibility: "public",
    description: "A stop-motion animation.",
    aiTools: [],
    tags: ["Animation", "StopMotion", "Fantasy"],
    seriesName: null,
    episodeNumber: null,
    uploadedBy: null,
    creatorName: "Harin Jung",
    likeCount: MOCK_VIDEO_LIKE_BY_ID.v6,
  },
  {
    id: "v7",
    title: "Experimental Film: Room of Noise",
    thumbnailUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1000&q=80",
    vimeoId: "100000003",
    genre: "experimental_art",
    subGenre: null,
    purpose: "personal",
    creatorId: "c2",
    isOriginal: true,
    isFinalist: false,
    award: null,
    runtime: "5 min",
    createdAt: new Date().toISOString(),
    visibility: "public",
    description: "An experimental art film.",
    aiTools: [],
    tags: ["Experimental", "Art", "Noise"],
    seriesName: null,
    episodeNumber: null,
    uploadedBy: null,
    creatorName: "Doyoon Park",
    likeCount: MOCK_VIDEO_LIKE_BY_ID.v7,
  },
  {
    id: "v8",
    title: "Meme Collection: Survive Monday",
    thumbnailUrl: "https://images.unsplash.com/photo-1514533212735-160cac8046cb?w=1000&q=80",
    vimeoId: "100000004",
    genre: "meme_humor",
    subGenre: "comedy",
    purpose: "personal",
    creatorId: "c1",
    isOriginal: false,
    isFinalist: false,
    award: null,
    runtime: "1 min",
    createdAt: new Date().toISOString(),
    visibility: "public",
    description: "A short comedy clip.",
    aiTools: [],
    tags: ["Meme", "Comedy", "Humor"],
    seriesName: null,
    episodeNumber: null,
    uploadedBy: null,
    creatorName: "Seoha Lee",
    likeCount: MOCK_VIDEO_LIKE_BY_ID.v8,
  },
];

export type MockSearchProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  followerCount: number;
};

/** Demo creator profiles for search fallback */
export const MOCK_SEARCH_PROFILES: MockSearchProfile[] = [
  {
    id: "00000000-0000-4000-8000-000000000c01",
    displayName: "Seoha Lee",
    avatarUrl: "https://i.pravatar.cc/200?img=32",
    bio: "Director creating emotional sci-fi with generative AI",
    followerCount: 1200,
  },
  {
    id: "00000000-0000-4000-8000-000000000c02",
    displayName: "Doyoon Park",
    avatarUrl: "https://i.pravatar.cc/200?img=12",
    bio: "Visual maker working across commercials and music videos",
    followerCount: 980,
  },
  {
    id: "00000000-0000-4000-8000-000000000c03",
    displayName: "Harin Jung",
    avatarUrl: "https://i.pravatar.cc/200?img=45",
    bio: "Creator specializing in short-form cinematic universes",
    followerCount: 1540,
  },
];

export function filterMockVideosBySearch(q: string): Video[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return MOCK_VIDEOS.filter((v) => {
    if (v.title.toLowerCase().includes(s)) return true;
    if (v.tags.some((t) => t.toLowerCase().includes(s))) return true;
    if (v.genre.toLowerCase().includes(s) || (v.subGenre && v.subGenre.toLowerCase().includes(s))) return true;
    if (mainGenreLabel(v.genre).toLowerCase().includes(s)) return true;
    if (v.creatorName?.toLowerCase().includes(s)) return true;
    return false;
  });
}

export function filterMockProfilesBySearch(q: string): MockSearchProfile[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return MOCK_SEARCH_PROFILES.filter(
    (p) =>
      p.displayName.toLowerCase().includes(s) ||
      p.bio.toLowerCase().includes(s),
  );
}

export function filterMockVideosByGenre(genreKey: MainGenreKey): Video[] {
  return MOCK_VIDEOS.filter((v) => v.genre === genreKey);
}

export function filterMockVideosByGenreAndSub(genreKey: MainGenreKey, subGenre: string | null): Video[] {
  let list = filterMockVideosByGenre(genreKey);
  if (subGenre) list = list.filter((v) => v.subGenre === subGenre);
  return list;
}
