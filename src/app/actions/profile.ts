"use server";

import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isValidHandle, normalizeHandleInput } from "@/lib/profile-handle";
export type ActionResult = { ok: true } | { ok: false; message: string };

export async function updateProfileAction(updates: {
  displayName?: string;
  handle?: string | null;
  bio?: string;
  tools?: string[];
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  websiteUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  vimeoUrl?: string | null;
  country?: string | null;
  mainGenre?: string | null;
  tagline?: string | null;
  pronouns?: string | null;
  availableForCollab?: boolean;
  pinnedVideoId?: string | null;
  notifyLikes?: boolean;
  notifyComments?: boolean;
  notifyFollows?: boolean;
}): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Please check your Supabase configuration." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.displayName !== undefined) payload.display_name = updates.displayName;
  if (updates.bio !== undefined) payload.bio = updates.bio;
  if (updates.tools !== undefined) payload.tools = updates.tools;
  if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
  if (updates.bannerUrl !== undefined) payload.banner_url = updates.bannerUrl;
  if (updates.websiteUrl !== undefined) payload.website_url = updates.websiteUrl;
  if (updates.twitterUrl !== undefined) payload.twitter_url = updates.twitterUrl;
  if (updates.instagramUrl !== undefined) payload.instagram_url = updates.instagramUrl;
  if (updates.youtubeUrl !== undefined) payload.youtube_url = updates.youtubeUrl;
  if (updates.tiktokUrl !== undefined) payload.tiktok_url = updates.tiktokUrl;
  if (updates.vimeoUrl !== undefined) payload.vimeo_url = updates.vimeoUrl;
  if (updates.country !== undefined) payload.country = updates.country;
  if (updates.mainGenre !== undefined) payload.main_genre = updates.mainGenre;
  if (updates.tagline !== undefined) payload.tagline = updates.tagline;
  if (updates.pronouns !== undefined) payload.pronouns = updates.pronouns;
  if (updates.availableForCollab !== undefined) payload.available_for_collab = updates.availableForCollab;
  if (updates.pinnedVideoId !== undefined) payload.pinned_video_id = updates.pinnedVideoId;
  if (updates.notifyLikes !== undefined) payload.notify_likes = updates.notifyLikes;
  if (updates.notifyComments !== undefined) payload.notify_comments = updates.notifyComments;
  if (updates.notifyFollows !== undefined) payload.notify_follows = updates.notifyFollows;

  if (updates.handle !== undefined) {
    const raw = updates.handle?.trim() ?? "";
    if (raw === "") {
      // 빈 값 → 자동 파생(닉네임 기반)으로 되돌림.
      payload.handle = null;
    } else {
      const normalized = normalizeHandleInput(raw);
      if (!isValidHandle(normalized)) {
        return {
          ok: false,
          message:
            "아이디는 영소문자·숫자·언더스코어(_) 3~20자만 가능합니다.",
        };
      }
      // 최종 아이디는 (이름부분 + 고정 태그)라 같은 태그를 가진
      // 사용자 중 동일 이름부분만 충돌. 태그가 달라 사실상 거의 없음.
      const { data: me } = await supabase
        .from("profiles")
        .select("handle_tag")
        .eq("id", user.id)
        .maybeSingle();
      const myTag = (me as { handle_tag?: number | null } | null)?.handle_tag;
      if (myTag != null) {
        const { data: taken } = await supabase
          .from("profiles")
          .select("id")
          .ilike("handle", normalized)
          .eq("handle_tag", myTag)
          .neq("id", user.id)
          .maybeSingle();
        if (taken) {
          return {
            ok: false,
            message: "이 이름은 같은 번호로 이미 사용 중입니다. 다른 이름을 선택해주세요.",
          };
        }
      }
      payload.handle = normalized;
    }
  }

  const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  revalidatePath(`/profile/${user.id}`);
  return { ok: true };
}

export type FollowActionResult = ActionResult | { ok: true; alreadyFollowing: true };

export async function followUserAction(targetUserId: string): Promise<FollowActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Please check your Supabase configuration." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };
  if (user.id === targetUserId) return { ok: false, message: "You cannot follow yourself." };

  const { error } = await supabase.from("follows").insert({
    follower_id: user.id,
    following_id: targetUserId,
  });
  if (error) {
    if (error.code === "23505") return { ok: true, alreadyFollowing: true };
    return { ok: false, message: error.message };
  }
  // E1: look up the actor's display name so the notification body can
  // render locale-aware "{name}님이 팔로우했습니다" via meta.actor_name.
  // Best-effort — if the lookup fails we just omit the field and fall
  // through to the generic "프로필을 확인하세요" body.
  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const actorName =
    (actorProfile?.display_name as string | null | undefined)?.trim() || null;
  await createNotification({
    userId: targetUserId,
    actorId: user.id,
    type: "follow",
    title: "New follower",
    body: "Check your profile.",
    href: `/profile/${user.id}`,
    entityType: "profile",
    entityId: user.id,
    metadata: actorName ? { actor_name: actorName } : null,
  });
  revalidatePath(`/profile/${targetUserId}`);
  revalidatePath("/profile");
  return { ok: true };
}

export async function unfollowUserAction(targetUserId: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Please check your Supabase configuration." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/profile/${targetUserId}`);
  revalidatePath("/profile");
  return { ok: true };
}

export async function changePasswordAction(newPassword: string): Promise<ActionResult> {
  if (newPassword.length < 6) return { ok: false, message: "Password must be at least 6 characters." };
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Please check your Supabase configuration." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function changeEmailAction(newEmail: string): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Please check your Supabase configuration." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };
  const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/profile");
  return { ok: true };
}

export async function updateAiToolPrefsAction(input: {
  customTools?: string[];
  hiddenTools?: string[];
}): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const payload: Record<string, unknown> = {};
  if (input.customTools !== undefined) payload.custom_ai_tools = input.customTools;
  if (input.hiddenTools !== undefined) payload.hidden_ai_tools = input.hiddenTools;

  const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function updateSavedHashtagsAction(hashtags: string[]): Promise<ActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };
  const { error } = await supabase
    .from("profiles")
    .update({ saved_hashtags: hashtags })
    .eq("id", user.id);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

/**
 * Persist the user's UI language preference (B.2-7) so it follows
 * them across devices.  Fired-and-forgotten from
 * `language-provider.tsx#setLocale` when the user toggles the
 * language switcher.  Silent no-op for signed-out users — the cookie
 * + localStorage flow continues to drive their locale on this device
 * alone.
 *
 * Validation is intentionally narrow (the three known locale codes)
 * and matches the DB CHECK constraint; passing anything else returns
 * `ok:false` without writing.
 */
export async function updateProfileLocaleAction(
  locale: "en" | "ko" | "ja",
): Promise<ActionResult> {
  if (locale !== "en" && locale !== "ko" && locale !== "ja") {
    return { ok: false, message: "Invalid locale." };
  }
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Signed-out: treat as success-noop.  The cookie has already been
  // updated client-side; the DB column is meaningless without a user
  // row to attach it to.
  if (!user) return { ok: true };
  const { error } = await supabase
    .from("profiles")
    .update({ locale })
    .eq("id", user.id);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
