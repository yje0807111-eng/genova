import { mapCompetition, mapCreator, mapVideo } from "@/lib/mappers";
import type { Competition, Creator, Video } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function mergeVideoRows(
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
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", uploaderIds);
    if (profilesErr) {
      console.error("[mergeVideoRows] profiles fetch failed", { message: profilesErr.message, code: profilesErr.code });
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

async function fetchPublicVideosBase(): Promise<Parameters<typeof mapVideo>[0][]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("videos").select("*").eq("visibility", "public").order("created_at", { ascending: false });
  if (error || !data) {
    console.error("[fetchPublicVideosBase] videos fetch failed", { message: error?.message, code: error?.code });
    return [];
  }
  return data as Parameters<typeof mapVideo>[0][];
}

export async function fetchVideosWithCreators(): Promise<Video[]> {
  const rows = await fetchPublicVideosBase();
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

/** Prefer active statuses first, then nearest deadline. */
export async function fetchCurrentCompetition(): Promise<Competition | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data: active } = await supabase
    .from("competitions")
    .select("*")
    .in("status", ["Open", "In Review", "Voting", "접수중", "결선 진행중"])
    .order("deadline", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (active) return mapCompetition(active);
  const { data: fallback } = await supabase
    .from("competitions")
    .select("*")
    .order("deadline", { ascending: true })
    .limit(1)
    .maybeSingle();
  return fallback ? mapCompetition(fallback) : null;
}

export async function fetchVideoById(id: string): Promise<Video | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("videos").select("*, creators(*)").eq("id", id).maybeSingle();
  if (error || !data) return null;

  let merged = data as Parameters<typeof mapVideo>[0];
  const uid = merged.uploaded_by;
  if (uid) {
    const { data: prof } = await supabase.from("profiles").select("display_name").eq("id", uid).maybeSingle();
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

export async function fetchRelatedVideos(excludeId: string, limit = 3): Promise<Video[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .neq("id", excludeId)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) {
    console.error("[fetchRelatedVideos] videos fetch failed", { message: error?.message, code: error?.code });
    return [];
  }
  const merged = await mergeVideoRows(data as Parameters<typeof mapVideo>[0][]);
  return merged.map((row) => mapVideo(row));
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
export async function fetchSeriesEpisodesForVideo(video: Video): Promise<{
  seriesTitle: string;
  episodes: Video[];
  prevId: string | null;
  nextId: string | null;
}> {
  const name = video.seriesName?.trim();
  if (video.genre !== "series" || !name || !video.uploadedBy) {
    return { seriesTitle: "", episodes: [], prevId: null, nextId: null };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { seriesTitle: name, episodes: [], prevId: null, nextId: null };

  const { data, error } = await supabase
    .from("videos")
    .select("*, creators(*)")
    .eq("uploaded_by", video.uploadedBy)
    .eq("genre", "series")
    .eq("series_name", name)
    .not("episode_number", "is", null)
    .order("episode_number", { ascending: true });

  if (error || !data?.length) {
    return { seriesTitle: name, episodes: [], prevId: null, nextId: null };
  }

  const episodes = data.map((row) => mapVideo(row));
  const idx = episodes.findIndex((e) => e.id === video.id);
  const prevId = idx > 0 ? episodes[idx - 1].id : null;
  const nextId = idx >= 0 && idx < episodes.length - 1 ? episodes[idx + 1].id : null;

  return { seriesTitle: name, episodes, prevId, nextId };
}
