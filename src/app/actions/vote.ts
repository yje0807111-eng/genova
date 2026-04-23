"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type VoteActionResult =
  | { ok: true }
  | { ok: false; code: "not_configured" | "login_required" | "duplicate" | "unknown"; message?: string };

export async function submitVote(videoId: string, competitionId: string): Promise<VoteActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { ok: false, code: "not_configured", message: "Please check Supabase environment variables." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, code: "login_required" };
  }

  const { error } = await supabase.from("votes").insert({
    user_id: user.id,
    video_id: videoId,
    competition_id: competitionId,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, code: "duplicate" };
    }
    return { ok: false, code: "unknown", message: error.message };
  }

  revalidatePath("/competition");
  return { ok: true };
}
