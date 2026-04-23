"use server";

import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export type ActionResult = { ok: true } | { ok: false; message: string };

export async function updateProfileAction(updates: {
  displayName?: string;
  bio?: string;
  tools?: string[];
  avatarUrl?: string | null;
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

  const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/profile");
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
  await createNotification(supabase, {
    userId: targetUserId,
    actorId: user.id,
    type: "follow",
    title: "New follower",
    body: "Check your profile.",
    href: `/profile/${user.id}`,
    entityType: "profile",
    entityId: user.id,
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
