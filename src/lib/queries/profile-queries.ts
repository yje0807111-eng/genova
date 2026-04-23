import { mapVideo } from "@/lib/mappers";
import type { Video } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string;
  tools: string[];
  subscriptionTier: "free" | "basic" | "pro";
  isGenovaPartner: boolean;
  totalAwards: number;
  /** In-app credits balance (Supabase `profiles.credits`) */
  credits: number;
  /** Reward points balance (Supabase `profiles.points`) */
  points: number;
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
  bio: string | null;
  tools: string[] | null;
  subscription_tier: string;
  is_genova_partner: boolean;
  total_awards: number;
  credits?: number | null;
  points?: number | null;
}): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio ?? "",
    tools: row.tools ?? [],
    subscriptionTier: row.subscription_tier as Profile["subscriptionTier"],
    isGenovaPartner: row.is_genova_partner,
    totalAwards: row.total_awards,
    credits: row.credits ?? 0,
    points: row.points ?? 0,
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
