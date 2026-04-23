"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function markAllNotificationsReadAction(): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/notifications");
  return { ok: true };
}
