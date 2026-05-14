import { mapCompetition, mapCreator, mapVideo } from "@/lib/mappers";
import type { Competition, Creator, Video } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function mergeVideoRows(
  baseRows: Parameters<typeof mapVideo>[0][],
): Promise<Parameters<typeof mapVideo>[0][]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return baseRows;
  const rows = [...baseRows];

  const creatorIds = [...new Set(rows.map((r) => r.creator_id).filter(Boolean))] as string[];
  if (creatorIds.length > 0) {
    const { data: creators, error: creatorsErr } = await supabase.from("creators").select("*").in("id", creatorIds);
    if (creatorsErr) {
      console.error("[mergeVideoRows] creators fetch failed", { message: creatorsErr.message, code: creatorsErr.code });
    } else {
      const creatorMap = new Map((creators ?? []).map((c) => [c.id as string, c]));
      for (let i = 0; i < rows.length; i += 1) {
        const cid = rows[i].creator_id;
        if (!cid) continue;
        const c = creatorMap.get(cid);
        if (c) rows[i] = { ...rows[i], creators: c };
      }
    }
  }

  const uploaderIds = [...new Set(rows.map((r) => r.uploaded_by).filter(Boolean))] as string[];
  if (uploaderIds.length > 0) {
    const { data: profiles, error: profilesErr } = await supabase
      .from("public_profiles")
      .select("id, display_name, avatar_url")
      .in("id", uploaderIds);
    if (profilesErr) {
      console.error("[mergeVideoRows] public_profiles fetch failed", { message: profilesErr.message, code: profilesErr.code });
    } else {
      const profileMap = new Map(
        (profiles ?? []).map((p) => {
          const row = p as { id: string; display_name: string | null; avatar_url?: string | null };
          return [row.id, { display_name: row.display_name, avatar_url: row.avatar_url ?? null }] as const;
        }),
      );
      for (let i = 0; i < rows.length; i += 1) {
        const uid = rows[i].uploaded_by;
        if (!uid) continue;
        const p = profileMap.get(uid);
        if (p) rows[i] = { ...rows[i], profiles: p };
      }
    }
  }
  return rows;
}

async function fetchPublicVideosBase(
  { limit, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<Parameters<typeof mapVideo>[0][]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  let query = supabase
    .from("videos")
    .select("*")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });
  if (typeof limit === "number") {
    query = query.range(offset, offset + limit - 1);
  }
  const { data, error } = await query;
  if (error || !data) {
    console.error("[fetchPublicVideosBase] videos fetch failed", { message: error?.message, code: error?.code });
    return [];
  }
  return data as Parameters<typeof mapVideo>[0][];
}

export interface FetchVideosOptions {
  limit?: number;
  offset?: number;
}

export async function fetchVideosWithCreators(options: FetchVideosOptions = {}): Promise<Video[]> {
  const { limit, offset } = options;
  const rows = await fetchPublicVideosBase({ limit, offset });
  const mergedRows = await mergeVideoRows(rows);
  console.info("[fetchVideosWithCreators] rows", {
    total: mergedRows.length,
    uploadedVideos: mergedRows.filter((r) => Boolean(r.uploaded_by)).length,
    publicVideos: mergedRows.filter((r) => r.visibility === "public").length,
  });
  return mergedRows.map((row) => mapVideo(row));
}

export async function fetchOriginalVideos(): Promise<Video[]> {
  const rows = await fetchPublicVideosBase();
  const originals = rows.filter((r) => r.is_original === true);
  const mergedRows = await mergeVideoRows(originals);
  console.info("[fetchOriginalVideos] rows", {
    totalPublic: rows.length,
    originals: mergedRows.length,
    uploadedOriginals: mergedRows.filter((r) => Boolean(r.uploaded_by)).length,
  });
  return mergedRows.map((row) => mapVideo(row));
}

export async function fetchCreators(): Promise<Creator[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("creators").select("*").order("name", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => mapCreator(row));
}

export async function fetchCurrentCompetition(): Promise<Competition | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  // site_settings에서 선택된 공모전 ID 가져오기
  const { data: settings } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "home_featured_competition_id")
    .maybeSingle();

  const featuredId = settings?.value as string | null;

  if (featuredId) {
    // 선택된 공모전 반환
    const { data } = await supabase
      .from("competitions")
      .select("*")
      .eq("id", featuredId)
      .maybeSingle();
    if (data) return mapCompetition(data);
  }

  // 선택된 공모전 없으면 현재 진행중인 공모전 중 첫 번째 반환
  const { data } = await supabase
    .from("competitions")
    .select("*")
    .in("status", ["Open", "접수중", "In Review", "Voting"])
    .order("deadline", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data ? mapCompetition(data) : null;
}

export async function fetchActiveCompetitions(limit = 2): Promise<Competition[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  // site_settings의 featured 우선
  const { data: settings } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "home_featured_competition_id")
    .maybeSingle();
  const featuredId = settings?.value as string | null;

  const { data } = await supabase
    .from("competitions")
    .select("*")
    .in("status", ["Open", "접수중", "In Review", "Voting"])
    .order("deadline", { ascending: true })
    .limit(limit);

  if (!data || data.length === 0) return [];

  const mapped = data.map((row) => mapCompetition(row));

  // featured를 맨 앞으로
  if (featuredId) {
    const idx = mapped.findIndex((c) => c.id === featuredId);
    if (idx > 0) {
      const [featured] = mapped.splice(idx, 1);
      mapped.unshift(featured);
    }
  }

  return mapped.slice(0, limit);
}

export async function fetchVideoById(id: string): Promise<Video | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("videos").select("*, creators(*)").eq("id", id).maybeSingle();
  if (error || !data) return null;

  let merged = data as Parameters<typeof mapVideo>[0];
  const uid = merged.uploaded_by;
  if (uid) {
    const { data: prof } = await supabase
      .from("public_profiles")
      .select("display_name")
      .eq("id", uid)
      .maybeSingle();
    if (prof) {
      merged = { ...merged, profiles: prof };
    }
  }
  return mapVideo(merged);
}

export async function fetchCompetitionsForUpload(): Promise<{ id: string; title: string }[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("competitions").select("id, title").order("deadline", { ascending: true });
  if (error || !data) return [];
  return data;
}

export async function fetchAllCompetitions() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("competitions")
    .select("*")
    .order("deadline", { ascending: false });
  return data ?? [];
}

export async function fetchCompetitionById(id: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as {
    id: string;
    title: string;
    genre: string;
    status: string;
    deadline: string;
    vote_end: string;
    prize_info: string;
    sponsor: string | null;
    description: string | null;
    rules: string | null;
    thumbnail_url: string | null;
    banner_url: string | null;
    concept: string | null;
    eligibility: string | null;
  };
}

export async function fetchRelatedVideos(excludeId: string, limit = 8): Promise<Video[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  let watchedIds: string[] = [];

  if (user) {
    const { data: history } = await supabase
      .from("watch_history")
      .select("video_id")
      .eq("user_id", user.id)
      .order("watched_at", { ascending: false })
      .limit(50);
    watchedIds = [...new Set((history ?? []).map((h) => h.video_id as string).filter(Boolean))];
  }

  // Profile data is attached below via mergeVideoRows (sourced from
  // the public_profiles view), so the embed is dropped here.
  const selectRelated = "*";

  let q1 = supabase
    .from("videos")
    .select(selectRelated)
    .eq("visibility", "public")
    .neq("id", excludeId);

  if (watchedIds.length > 0) {
    const inList = watchedIds.map((id) => `"${id}"`).join(",");
    q1 = q1.not("id", "in", `(${inList})`);
  }

  const { data: unwatched, error: err1 } = await q1.order("created_at", { ascending: false }).limit(limit);

  if (err1) {
    console.error("[fetchRelatedVideos] unwatched phase", err1.message);
  }

  let rows = (unwatched ?? []) as Parameters<typeof mapVideo>[0][];
  let fallbackCount = 0;

  if (rows.length < limit) {
    const needed = limit - rows.length;
    const existingIds = new Set<string>([excludeId, ...rows.map((v) => v.id as string)]);

    let q2 = supabase
      .from("videos")
      .select(selectRelated)
      .eq("visibility", "public")
      .neq("id", excludeId);

    const excludeList = [...existingIds];
    if (excludeList.length > 0) {
      const inList = excludeList.map((id) => `"${id}"`).join(",");
      q2 = q2.not("id", "in", `(${inList})`);
    }

    const { data: fallback, error: err2 } = await q2.order("view_count", { ascending: false }).limit(needed);

    if (err2) {
      console.error("[fetchRelatedVideos] fallback phase", err2.message);
    }

    const fb = (fallback ?? []) as Parameters<typeof mapVideo>[0][];
    fallbackCount = fb.length;
    rows = [...rows, ...fb];
  }

  console.log("[RELATED_DEBUG]", {
    watchedIds: watchedIds.length,
    unwatched: unwatched?.length ?? 0,
    fallback: fallbackCount,
    total: rows.length,
  });

  const merged = await mergeVideoRows(rows);
  return merged.map((row) => mapVideo(row));
}

/** Same genre as current video, public, excluding id; ordered by view_count desc (watch page “For You”). */
export async function fetchForYouSameGenreVideos(excludeId: string, genre: string, limit = 8): Promise<Video[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("videos")
    .select("*, creators(*)")
    .eq("visibility", "public")
    .eq("genre", genre)
    .neq("id", excludeId)
    .order("view_count", { ascending: false })
    .limit(limit);
  if (error || !data) {
    console.error("[fetchForYouSameGenreVideos] fetch failed", { message: error?.message, code: error?.code });
    return [];
  }
  const merged = await mergeVideoRows(data as Parameters<typeof mapVideo>[0][]);
  return merged.map((row) => mapVideo(row));
}

/** 팔로우한 크리에이터의 공개 영상 (최신순). */
export async function fetchFollowingVideos(userId: string | null, limit = 8): Promise<Video[]> {
  if (!userId) return [];
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (!follows || follows.length === 0) return [];
  const followingIds = follows.map((f) => f.following_id);

  const { data, error } = await supabase
    .from("videos")
    .select("*, creators(*)")
    .eq("visibility", "public")
    .in("uploaded_by", followingIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  const merged = await mergeVideoRows(data as Parameters<typeof mapVideo>[0][]);
  return merged.map((row) => mapVideo(row));
}

/**
 * 최근 본 영상과 시청 패턴이 비슷한 사용자들이 본 다른 공개 영상 (협업 필터링).
 */
export async function fetchBecauseYouWatched(userId: string | null, limit = 8): Promise<Video[]> {
  if (!userId) return [];
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data: myHistory } = await supabase
    .from("watch_history")
    .select("video_id")
    .eq("user_id", userId)
    .order("watched_at", { ascending: false })
    .limit(3);

  if (!myHistory || myHistory.length === 0) return [];
  const myVideoIds = myHistory.map((h) => h.video_id);
  const myVideoIdSet = new Set(myVideoIds);

  const { data: sameWatchers } = await supabase
    .from("watch_history")
    .select("user_id")
    .in("video_id", myVideoIds)
    .neq("user_id", userId)
    .limit(50);

  if (!sameWatchers || sameWatchers.length === 0) return [];
  const otherUserIds = [...new Set(sameWatchers.map((w) => w.user_id))];

  const { data: recommendedRaw } = await supabase
    .from("watch_history")
    .select("video_id")
    .in("user_id", otherUserIds)
    .limit(limit * 30);

  const recommended = (recommendedRaw ?? []).filter((r) => !myVideoIdSet.has(r.video_id));
  if (recommended.length === 0) return [];

  const countMap = new Map<string, number>();
  for (const r of recommended) {
    countMap.set(r.video_id, (countMap.get(r.video_id) ?? 0) + 1);
  }
  const topVideoIds = [...countMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (topVideoIds.length === 0) return [];

  const { data, error } = await supabase
    .from("videos")
    .select("*, creators(*)")
    .eq("visibility", "public")
    .in("id", topVideoIds);

  if (error || !data) return [];
  const merged = await mergeVideoRows(data as Parameters<typeof mapVideo>[0][]);
  const byId = new Map(merged.map((row) => [row.id as string, mapVideo(row)]));
  return topVideoIds.map((id) => byId.get(id)).filter((v): v is Video => v != null);
}

export async function fetchCreatorById(id: string): Promise<Creator | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("creators").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapCreator(data);
}

export async function fetchVideosByCreator(creatorId: string): Promise<Video[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("videos")
    .select("*, creators(*)")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => mapVideo(row));
}

export async function fetchFinalistVideos(): Promise<Video[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("is_finalist", true)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });
  if (error || !data) {
    console.error("[fetchFinalistVideos] videos fetch failed", { message: error?.message, code: error?.code });
    return [];
  }
  const merged = await mergeVideoRows(data as Parameters<typeof mapVideo>[0][]);
  return merged.map((row) => mapVideo(row));
}

export async function fetchAwardedVideos(): Promise<Video[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .not("award", "is", null)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });
  if (error || !data) {
    console.error("[fetchAwardedVideos] videos fetch failed", { message: error?.message, code: error?.code });
    return [];
  }
  const merged = await mergeVideoRows(data as Parameters<typeof mapVideo>[0][]);
  return merged.map((row) => mapVideo(row));
}

/** 로그인 사용자가 해당 공모전에서 이미 투표한 video_id 집합 */
export async function fetchCurrentUserVoteVideoIds(competitionId: string): Promise<Set<string>> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return new Set();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data, error } = await supabase
    .from("votes")
    .select("video_id")
    .eq("competition_id", competitionId)
    .eq("user_id", user.id);
  if (error || !data) return new Set();
  return new Set(data.map((x) => x.video_id));
}

/** 같은 업로더·같은 시리즈명·`genre=series`인 에피소드 목록 및 이전/다음 ID */
export type SeriesEpisodesNav = {
  seriesTitle: string;
  episodes: Video[];
  prevId: string | null;
  nextId: string | null;
  seasons: { season: number; episodes: Video[] }[];
};

export async function fetchSeriesEpisodesForVideo(video: Video): Promise<SeriesEpisodesNav> {
  const name = video.seriesName?.trim();
  if (video.genre !== "series" || !name || !video.uploadedBy) {
    return { seriesTitle: "", episodes: [], prevId: null, nextId: null, seasons: [] };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { seriesTitle: name, episodes: [], prevId: null, nextId: null, seasons: [] };

  const { data, error } = await supabase
    .from("videos")
    // `*` includes `view_count` and `runtime` (watch page series episode cards).
    .select("*, creators(*)")
    .eq("uploaded_by", video.uploadedBy)
    .eq("genre", "series")
    .eq("series_name", name)
    .not("episode_number", "is", null)
    .order("episode_number", { ascending: true });

  if (error || !data?.length) {
    return { seriesTitle: name, episodes: [], prevId: null, nextId: null, seasons: [] };
  }

  const episodes = data.map((row) => mapVideo(row));
  const idx = episodes.findIndex((e) => e.id === video.id);
  const prevId = idx > 0 ? episodes[idx - 1].id : null;
  const nextId = idx >= 0 && idx < episodes.length - 1 ? episodes[idx + 1].id : null;

  return { seriesTitle: name, episodes, prevId, nextId, seasons: [] };
}

