import { mapVideo } from "@/lib/mappers";
import {
  LEGACY_GENRE_MAP,
  MAIN_GENRE_KEYS,
  MAIN_GENRE_LABELS,
  normalizeMainGenreKey,
  type MainGenreKey,
} from "@/lib/constants/genres";
import {
  MOCK_SEARCH_PROFILES,
  MOCK_VIDEOS,
  MOCK_VIDEO_LIKE_BY_ID,
  filterMockProfilesBySearch,
  filterMockVideosByGenreAndSub,
  filterMockVideosBySearch,
} from "@/lib/mock-data";
import { mergeVideoRows } from "@/lib/queries";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Video } from "@/lib/types";

export type SearchProfile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string;
  followerCount: number;
};

export type SearchGenreMatch = { slug: MainGenreKey; label: string };

export type FullSearchResult = {
  videos: Video[];
  profiles: SearchProfile[];
  matchingTags: string[];
  genreMatch: SearchGenreMatch | null;
};

export type SearchSortMode = "relevance" | "latest" | "likes";

function normalizeSearchTerm(input: string): string {
  return input.trim().replace(/^#+/, "").trim();
}

function toLike(term: string): string {
  return `%${term.trim().replaceAll(",", " ")}%`;
}

function applyMockLikeFallback(videos: Video[]): Video[] {
  return videos.map((v) => {
    const fb = MOCK_VIDEO_LIKE_BY_ID[v.id];
    if (fb != null && (v.likeCount ?? 0) === 0) return { ...v, likeCount: fb };
    return v;
  });
}

async function isVideosTableEmpty(): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return true;
  const { count, error } = await supabase.from("videos").select("id", { count: "exact", head: true });
  if (error) return true;
  return (count ?? 0) === 0;
}

async function isProfilesTableEmpty(): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return true;
  const { count, error } = await supabase
    .from("public_profiles")
    .select("id", { count: "exact", head: true });
  if (error) return true;
  return (count ?? 0) === 0;
}

function mockProfilesToSearchProfiles(): SearchProfile[] {
  return MOCK_SEARCH_PROFILES.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl,
    bio: p.bio,
    followerCount: p.followerCount,
  }));
}

function pickMockProfilesForSearch(term: string, limit: number): SearchProfile[] {
  return filterMockProfilesBySearch(term).slice(0, limit).map((p) => ({
    id: p.id,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl,
    bio: p.bio,
    followerCount: p.followerCount,
  }));
}

function dedupeVideos(rows: Parameters<typeof mapVideo>[0][]): Video[] {
  const seen = new Set<string>();
  const out: Video[] = [];
  for (const row of rows) {
    const v = mapVideo(row);
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    out.push(v);
  }
  return out;
}

function scoreVideo(v: Video, q: string): number {
  const s = q.trim().toLowerCase();
  if (!s) return 0;
  let score = 0;
  const title = (v.title ?? "").toLowerCase();
  const genre = (v.genre ?? "").toLowerCase();
  const slug = normalizeMainGenreKey(v.genre);
  if (slug && (MAIN_GENRE_LABELS[slug].toLowerCase() === s || slug === s)) {
    score += 120;
  }
  if (genre === s) score += 100;
  if (title === s) score += 90;
  if (title.startsWith(s)) score += 55;
  if (title.includes(s)) score += 40;
  if (v.tags.some((t) => t.toLowerCase().includes(s))) score += 35;
  if (genre.includes(s)) score += 25;
  return score;
}

async function attachFollowerCounts(ids: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return map;
  const { data } = await supabase.from("follows").select("following_id").in("following_id", ids);
  for (const row of data ?? []) {
    const id = (row as { following_id: string }).following_id;
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
}

/** 좋아요 순 상위 영상 */
export async function fetchTrendingVideosByLikes(limit = 4): Promise<Video[]> {
  const fallbackTrending = async (): Promise<Video[]> => {
    const sorted = [...MOCK_VIDEOS].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    return applyMockLikeFallback(await attachEngagementToVideos(sorted)).slice(0, limit);
  };

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return fallbackTrending();
  }
  if (await isVideosTableEmpty()) {
    return fallbackTrending();
  }

  const { data, error } = await supabase
    .from("videos")
    .select("*, creators(*)")
    .limit(400);
  if (error || !data?.length) {
    return fallbackTrending();
  }
  // Attach uploader display_name via mergeVideoRows (public_profiles view)
  // instead of the legacy `profiles!videos_uploaded_by_fkey(...)` FK embed.
  const enriched = await mergeVideoRows(data as Parameters<typeof mapVideo>[0][]);
  const mapped = dedupeVideos(enriched);
  const withE = applyMockLikeFallback(await attachEngagementToVideos(mapped));
  return withE.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0)).slice(0, limit);
}

/** 팔로워 많은 프로필 상위 */
export async function fetchTrendingProfilesByFollowers(limit = 4): Promise<SearchProfile[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return mockProfilesToSearchProfiles()
      .sort((a, b) => b.followerCount - a.followerCount)
      .slice(0, limit);
  }
  const { data: followsRows } = await supabase.from("follows").select("following_id");
  if (!followsRows?.length) {
    if (await isProfilesTableEmpty()) {
      return mockProfilesToSearchProfiles()
        .sort((a, b) => b.followerCount - a.followerCount)
        .slice(0, limit);
    }
    return [];
  }
  const counts = new Map<string, number>();
  for (const row of followsRows) {
    const id = (row as { following_id: string }).following_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
  if (topIds.length === 0) return [];
  const { data: profs } = await supabase
    .from("public_profiles")
    .select("id, display_name, avatar_url, bio")
    .in("id", topIds);
  const rows = profs ?? [];
  return topIds
    .map((id) => {
      const p = rows.find((r) => r.id === id);
      if (!p) return null;
      return {
        id: p.id,
        displayName: p.display_name,
        avatarUrl: p.avatar_url,
        bio: p.bio ?? "",
        followerCount: counts.get(id) ?? 0,
      };
    })
    .filter((x): x is SearchProfile => Boolean(x));
}

async function collectVideoCandidates(q: string, cap = 220): Promise<Video[]> {
  const term = q.trim();
  if (!term) return [];
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return filterMockVideosBySearch(term).slice(0, cap);
  }

  const like = toLike(term);

  const [baseRes, creatorsRes, profileRes] = await Promise.all([
    supabase
      .from("videos")
      .select("*, creators(*)")
      .or(`title.ilike.${like},genre.ilike.${like}`)
      .order("created_at", { ascending: false })
      .limit(cap),
    supabase.from("creators").select("id").ilike("name", like).limit(40),
    supabase.from("public_profiles").select("id").ilike("display_name", like).limit(40),
  ]);

  if (baseRes.error) {
    return filterMockVideosBySearch(term).slice(0, cap);
  }

  // tags 별도 검색 (배열 컬럼이라 .or() 안에서 캐스팅 안 됨)
  const tagsRes = await supabase
    .from("videos")
    .select("*, creators(*)")
    .contains("tags", [term.toLowerCase()])
    .order("created_at", { ascending: false })
    .limit(cap);

  const creatorIds = (creatorsRes.data ?? []).map((x: { id: string }) => x.id);
  const profileIds = (profileRes.data ?? []).map((x: { id: string }) => x.id);

  const extras: Parameters<typeof mapVideo>[0][][] = [];
  if (creatorIds.length) {
    const { data } = await supabase
      .from("videos")
      .select("*, creators(*)")
      .in("creator_id", creatorIds)
      .order("created_at", { ascending: false })
      .limit(cap);
    if (data) extras.push(data as Parameters<typeof mapVideo>[0][]);
  }
  if (profileIds.length) {
    const { data } = await supabase
      .from("videos")
      .select("*, creators(*)")
      .in("uploaded_by", profileIds)
      .order("created_at", { ascending: false })
      .limit(cap);
    if (data) extras.push(data as Parameters<typeof mapVideo>[0][]);
  }

  const merged = [
    ...((baseRes.data ?? []) as Parameters<typeof mapVideo>[0][]),
    ...((tagsRes.data ?? []) as Parameters<typeof mapVideo>[0][]),
    ...extras.flat(),
  ];
  // Attach uploader profiles via mergeVideoRows (public_profiles view).
  const enriched = await mergeVideoRows(merged);
  const videos = dedupeVideos(enriched);
  if (videos.length === 0 && (await isVideosTableEmpty())) {
    return filterMockVideosBySearch(term).slice(0, cap);
  }
  return videos.slice(0, cap);
}

/** 검색어와 유사한 장르 슬러그(정확 라벨 일치 우선) */
export function resolveGenreMatchFromQuery(q: string): SearchGenreMatch | null {
  const t = q.trim();
  if (!t) return null;
  for (const key of MAIN_GENRE_KEYS) {
    if (MAIN_GENRE_LABELS[key].toLowerCase() === t.toLowerCase() || key.toLowerCase() === t.toLowerCase()) {
      return { slug: key, label: MAIN_GENRE_LABELS[key] };
    }
  }
  const legacy = LEGACY_GENRE_MAP[t];
  if (legacy) return { slug: legacy, label: MAIN_GENRE_LABELS[legacy] };
  return null;
}

function extractMatchingTags(videos: Video[], q: string, limit = 12): string[] {
  const s = q.trim().toLowerCase();
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of videos) {
    for (const tag of v.tags ?? []) {
      const tt = (tag ?? "").trim();
      if (!tt || seen.has(tt.toLowerCase())) continue;
      if (s && tt.toLowerCase().includes(s)) {
        seen.add(tt.toLowerCase());
        out.push(tt);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

export async function searchVideosFull(
  q: string,
  limit = 48,
  sort: SearchSortMode = "relevance",
): Promise<Video[]> {
  const term = normalizeSearchTerm(q);
  if (!term) return [];
  let videos = await collectVideoCandidates(term, 280);
  videos = applyMockLikeFallback(await attachEngagementToVideos(videos));

  if (sort === "relevance") {
    videos.sort((a, b) => {
      const ds = scoreVideo(b, term) - scoreVideo(a, term);
      if (ds !== 0) return ds;
      const lc = (b.likeCount ?? 0) - (a.likeCount ?? 0);
      if (lc !== 0) return lc;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else if (sort === "latest") {
    videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    videos.sort((a, b) => {
      const lc = (b.likeCount ?? 0) - (a.likeCount ?? 0);
      if (lc !== 0) return lc;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  return videos.slice(0, limit);
}

export async function searchProfilesFull(q: string, limit = 24): Promise<SearchProfile[]> {
  const term = normalizeSearchTerm(q);
  if (!term) return [];
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return pickMockProfilesForSearch(term, limit);
  }
  const like = toLike(term);
  const { data, error } = await supabase
    .from("public_profiles")
    .select("id, display_name, avatar_url, bio")
    .ilike("display_name", like)
    .order("display_name", { ascending: true })
    .limit(limit);
  if (error) {
    return pickMockProfilesForSearch(term, limit);
  }
  if (!data?.length) {
    if (await isProfilesTableEmpty()) {
      return pickMockProfilesForSearch(term, limit);
    }
    return [];
  }
  const profiles: SearchProfile[] = data.map((row) => ({
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio ?? "",
    followerCount: 0,
  }));
  const fc = await attachFollowerCounts(profiles.map((p) => p.id));
  return profiles.map((p) => ({ ...p, followerCount: fc.get(p.id) ?? 0 }));
}

/** 자동완성 전용(제한 개수) */
export async function suggestSearchAutocomplete(q: string) {
  const term = normalizeSearchTerm(q);
  if (!term) {
    return {
      videos: [] as Video[],
      profiles: [] as SearchProfile[],
      tags: [] as string[],
      genre: null as SearchGenreMatch | null,
    };
  }
  const [videos, profiles, genreMatch] = await Promise.all([
    searchVideosFull(term, 12, "relevance"),
    searchProfilesFull(term, 12),
    Promise.resolve(resolveGenreMatchFromQuery(term)),
  ]);
  const tagPool = extractMatchingTags(videos, term, 20);
  return {
    videos: videos.slice(0, 3),
    profiles: profiles.slice(0, 3),
    tags: tagPool.slice(0, 3),
    genre: genreMatch,
  };
}

export type GenrePageSort = "latest" | "popular" | "award";

export async function fetchVideosByGenre(
  genreSlug: string,
  sort: GenrePageSort,
): Promise<Video[]> {
  const key = normalizeMainGenreKey(genreSlug);
  if (!key) return [];
  const supabase = await createServerSupabaseClient();

  const sortList = (list: Video[]) => {
    if (sort === "latest") {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === "popular") {
      list.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    } else {
      list.sort((a, b) => {
        const aA = Boolean(a.award?.trim() || a.isFinalist) ? 1 : 0;
        const bA = Boolean(b.award?.trim() || b.isFinalist) ? 1 : 0;
        if (bA !== aA) return bA - aA;
        return (b.likeCount ?? 0) - (a.likeCount ?? 0);
      });
    }
    return list;
  };

  const buildFromMock = async (): Promise<Video[]> => {
    const raw = filterMockVideosByGenreAndSub(key);
    return applyMockLikeFallback(await attachEngagementToVideos(raw));
  };

  if (!supabase) {
    return sortList(await buildFromMock());
  }

  const query = supabase
    .from("videos")
    .select("*")
    .eq("visibility", "public")
    .or(`genre.eq.${key},additional_genres.cs.{${key}}`);
  const { data, error } = await query.limit(500);

  if (error) {
    console.error("[fetchVideosByGenre] videos fetch failed", { message: error.message, code: error.code });
    return sortList(await buildFromMock());
  }

  const rows = (data ?? []) as Parameters<typeof mapVideo>[0][];
  const creatorIds = [...new Set(rows.map((r) => r.creator_id).filter(Boolean))] as string[];
  const uploaderIds = [...new Set(rows.map((r) => r.uploaded_by).filter(Boolean))] as string[];
  const mergedRows = [...rows];
  if (creatorIds.length > 0) {
    const { data: creators, error: cErr } = await supabase.from("creators").select("*").in("id", creatorIds);
    if (cErr) {
      console.error("[fetchVideosByGenre] creators fetch failed", { message: cErr.message, code: cErr.code });
    } else {
      const creatorMap = new Map((creators ?? []).map((c) => [c.id as string, c]));
      for (let i = 0; i < mergedRows.length; i += 1) {
        const cid = mergedRows[i].creator_id;
        if (!cid) continue;
        const c = creatorMap.get(cid);
        if (c) mergedRows[i] = { ...mergedRows[i], creators: c };
      }
    }
  }
  if (uploaderIds.length > 0) {
    const { data: profiles, error: pErr } = await supabase
      .from("public_profiles")
      .select("id, display_name")
      .in("id", uploaderIds);
    if (pErr) {
      console.error("[fetchVideosByGenre] public_profiles fetch failed", { message: pErr.message, code: pErr.code });
    } else {
      const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, { display_name: p.display_name as string | null }]));
      for (let i = 0; i < mergedRows.length; i += 1) {
        const uid = mergedRows[i].uploaded_by;
        if (!uid) continue;
        const p = profileMap.get(uid);
        if (p) mergedRows[i] = { ...mergedRows[i], profiles: p };
      }
    }
  }

  let list = dedupeVideos(mergedRows);
  if (list.length === 0 && (await isVideosTableEmpty())) {
    return sortList(await buildFromMock());
  }
  list = applyMockLikeFallback(await attachEngagementToVideos(list));
  return sortList(list);
}
