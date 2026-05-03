import { mapVideo } from "@/lib/mappers";
import type { Video } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  vimeoUrl: string | null;
  country: string | null;
  mainGenre: string | null;
  notifyLikes: boolean;
  notifyComments: boolean;
  notifyFollows: boolean;
  /** Optional wide banner on profile (`profiles.banner_url`) */
  bannerUrl: string | null;
  bio: string;
  tools: string[];
  subscriptionTier: "free" | "basic" | "pro";
  isGenovaPartner: boolean;
  totalAwards: number;
  /** In-app credits balance (Supabase `profiles.credits`) */
  credits: number;
  /** Reward points balance (Supabase `profiles.points`) */
  points: number;
  /** `profiles.created_at` for “Joined …” */
  joinedAt: string | null;
};

export type UserAward = {
  id: string;
  competitionTitle: string | null;
  awardTitle: string;
  awardedAt: string | null;
};

function mapProfile(row: {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  website_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
  vimeo_url?: string | null;
  country?: string | null;
  main_genre?: string | null;
  notify_likes?: boolean | null;
  notify_comments?: boolean | null;
  notify_follows?: boolean | null;
  banner_url?: string | null;
  bio: string | null;
  tools: string[] | null;
  subscription_tier: string;
  is_genova_partner: boolean;
  total_awards: number;
  credits?: number | null;
  points?: number | null;
  created_at?: string | null;
}): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    websiteUrl: row.website_url?.trim() ? row.website_url : null,
    twitterUrl: row.twitter_url?.trim() ? row.twitter_url : null,
    instagramUrl: row.instagram_url?.trim() ? row.instagram_url : null,
    youtubeUrl: row.youtube_url?.trim() ? row.youtube_url : null,
    tiktokUrl: row.tiktok_url?.trim() ? row.tiktok_url : null,
    vimeoUrl: row.vimeo_url?.trim() ? row.vimeo_url : null,
    country: row.country?.trim() ? row.country : null,
    mainGenre: row.main_genre?.trim() ? row.main_genre : null,
    notifyLikes: row.notify_likes ?? true,
    notifyComments: row.notify_comments ?? true,
    notifyFollows: row.notify_follows ?? true,
    bannerUrl: row.banner_url?.trim() ? row.banner_url : null,
    bio: row.bio ?? "",
    tools: row.tools ?? [],
    subscriptionTier: row.subscription_tier as Profile["subscriptionTier"],
    isGenovaPartner: row.is_genova_partner,
    totalAwards: row.total_awards,
    credits: row.credits ?? 0,
    points: row.points ?? 0,
    joinedAt: row.created_at ?? null,
  };
}

function mapAward(row: {
  id: string;
  competition_title: string | null;
  award_title: string;
  awarded_at: string | null;
}): UserAward {
  return {
    id: row.id,
    competitionTitle: row.competition_title,
    awardTitle: row.award_title,
    awardedAt: row.awarded_at,
  };
}

/** Create profile row if missing. */
export async function ensureProfile(userId: string, emailHint?: string | null): Promise<boolean | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data: existing } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (existing) return true;
  const displayName = emailHint?.split("@")[0] ?? "User";
  const { error } = await supabase.from("profiles").insert({
    id: userId,
    display_name: displayName,
  });
  if (!error) return true;
  // Already created by trigger or race condition
  if (error.code === "23505") return true;
  return false;
}

export async function fetchProfileById(userId: string): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error || !data) return null;
  return mapProfile(data);
}

export async function fetchFollowCounts(userId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { followers: 0, following: 0 };
  const [a, b] = await Promise.all([
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  return {
    followers: a.count ?? 0,
    following: b.count ?? 0,
  };
}

export async function fetchIsFollowing(viewerId: string | undefined, targetId: string) {
  if (!viewerId) return false;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", viewerId)
    .eq("following_id", targetId)
    .maybeSingle();
  return Boolean(data);
}

export async function fetchUploadedVideos(userId: string): Promise<Video[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("videos")
    .select("*, creators(*)")
    .eq("uploaded_by", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => mapVideo(row));
}

/** 업로더 기준 파이널리스트(대회) 영상 */
export async function fetchFinalistVideosByUploader(userId: string): Promise<Video[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("videos")
    .select("*, creators(*)")
    .eq("uploaded_by", userId)
    .eq("is_finalist", true)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => mapVideo(row));
}

export type FollowingPreviewUser = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
};

/** Users this profile follows (for Following sidebar). */
export async function fetchFollowingPreviewUsers(userId: string, limit = 24): Promise<FollowingPreviewUser[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data: follows, error: e1 } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (e1 || !follows?.length) return [];
  const ids = follows.map((r) => r.following_id as string);
  const { data: profs, error: e2 } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", ids);
  if (e2 || !profs?.length) return [];
  const order = new Map(ids.map((id, i) => [id, i]));
  return profs
    .map((p) => ({
      id: p.id as string,
      displayName: (p.display_name as string | null) ?? null,
      avatarUrl: (p.avatar_url as string | null) ?? null,
    }))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function fetchSavedVideos(userId: string): Promise<Video[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("saved_videos")
    .select("video_id, videos(*, creators(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const out: Video[] = [];
  for (const row of data) {
    const raw = row.videos as Parameters<typeof mapVideo>[0] | Parameters<typeof mapVideo>[0][] | null;
    const v = Array.isArray(raw) ? raw[0] : raw;
    if (v) out.push(mapVideo(v));
  }
  return out;
}

export async function fetchUserAwards(userId: string): Promise<UserAward[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("user_awards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapAward);
}

export type ProfileAwardBadge = {
  id: string;
  awardType: "weekly" | "competition";
  awardTier: "gold" | "silver" | "bronze" | "1" | "2" | "3" | "4-10" | "11-20";
  createdAt: string;
};

/** Compact awards for profile header badges from `user_awards`. */
export async function fetchProfileAwardBadges(userId: string): Promise<ProfileAwardBadge[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("user_awards")
    .select("id, award_type, award_tier, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const out: ProfileAwardBadge[] = [];
  for (const row of data as Array<Record<string, unknown>>) {
    const t = String(row.award_type ?? "");
    const tier = String(row.award_tier ?? "");
    const awardType = t === "weekly" || t === "competition" ? t : null;
    const awardTier = (
      ["gold", "silver", "bronze", "1", "2", "3", "4-10", "11-20"] as const
    ).includes(tier as ProfileAwardBadge["awardTier"])
      ? (tier as ProfileAwardBadge["awardTier"])
      : null;
    if (!awardType || !awardTier) continue;
    out.push({
      id: String(row.id ?? `${awardType}-${awardTier}-${String(row.created_at ?? "")}`),
      awardType,
      awardTier,
      createdAt: String(row.created_at ?? new Date().toISOString()),
    });
  }
  return out;
}
