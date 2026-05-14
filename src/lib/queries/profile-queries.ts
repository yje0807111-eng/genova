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
  tagline: string | null;
  pronouns: string | null;
  availableForCollab: boolean;
  pinnedVideoId: string | null;
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
  /**
   * User's UI language preference (B.2-7).  `null` means "no explicit
   * preference yet" — server falls through to the request cookie.
   * Constrained at the DB level via a CHECK (en/ko/ja).  The wider
   * `string` type here keeps the mapper simple; callers should narrow
   * with the helper `narrowLocale()` in `src/lib/i18n/translations.ts`
   * when they hand it back to client code.
   */
  locale: "en" | "ko" | "ja" | null;
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
  tagline?: string | null;
  pronouns?: string | null;
  available_for_collab?: boolean | null;
  pinned_video_id?: string | null;
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
  locale?: string | null;
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
    tagline: row.tagline?.trim() ? row.tagline : null,
    pronouns: row.pronouns?.trim() ? row.pronouns : null,
    availableForCollab: row.available_for_collab ?? false,
    pinnedVideoId: row.pinned_video_id ?? null,
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
    // `public_profiles` view doesn't currently expose locale; reads
    // through that path return null until the view is widened.  Direct
    // reads (`fetchOwnProfile`) go to `profiles.*` so they get the
    // column.  The B.2-7 server-locale fallback intentionally uses
    // `fetchOwnProfile`-grade access via the auth.getUser() id.
    locale:
      row.locale === "en" || row.locale === "ko" || row.locale === "ja"
        ? row.locale
        : null,
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

/**
 * Read the caller's OWN profile (full row including financial,
 * preferences, and internal columns).  Use only when you have
 * verified userId === caller's auth.uid().  For arbitrary profile
 * reads (e.g. public profile pages, video uploader sidebar) use
 * `fetchPublicProfileById` instead.
 */
export async function fetchOwnProfile(userId: string): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error || !data) return null;
  return mapProfile(data);
}

/**
 * Read any profile through the `public_profiles` view (safe-public
 * column subset only).  Credits, points, notify_*, custom_ai_tools,
 * hidden_ai_tools, saved_hashtags, country, and updated_at columns
 * are returned as their mapper defaults (0 / true / null) since the
 * view does not expose them.  Survives phase 7c when the underlying
 * `profiles.SELECT` is tightened to own-only.
 */
export async function fetchPublicProfileById(userId: string): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("public_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
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

