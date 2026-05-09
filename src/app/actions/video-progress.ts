"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function saveVideoProgress(input: {
  videoId: string;
  progressSeconds: number;
  durationSeconds: number;
}): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const progressSeconds = Number.isFinite(input.progressSeconds)
    ? Math.max(0, input.progressSeconds)
    : 0;
  const durationSeconds = Number.isFinite(input.durationSeconds)
    ? Math.max(0, input.durationSeconds)
    : 0;
  const completed = durationSeconds > 0 && progressSeconds / durationSeconds >= 0.9;

  await supabase.from("video_progress").upsert(
    {
      user_id: user.id,
      video_id: input.videoId,
      progress_seconds: progressSeconds,
      duration_seconds: durationSeconds,
      completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,video_id" },
  );
}

export async function getVideoProgress(videoId: string): Promise<{
  progressSeconds: number;
  durationSeconds: number;
  completed: boolean;
  updatedAt: string;
} | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("video_progress")
    .select("progress_seconds, duration_seconds, completed, updated_at")
    .eq("user_id", user.id)
    .eq("video_id", videoId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    progressSeconds: Number(data.progress_seconds ?? 0),
    durationSeconds: Number(data.duration_seconds ?? 0),
    completed: Boolean(data.completed),
    updatedAt: String(data.updated_at ?? ""),
  };
}

export async function getRecentProgress(limit = 10): Promise<Array<{
  progressSeconds: number;
  durationSeconds: number;
  completed: boolean;
  updatedAt: string;
  video: unknown;
}>> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const safeLimit = Math.max(1, Math.min(50, Math.trunc(limit)));
  const { data, error } = await supabase
    .from("video_progress")
    .select("progress_seconds, duration_seconds, completed, updated_at, videos(*)")
    .eq("user_id", user.id)
    .eq("completed", false)
    .order("updated_at", { ascending: false })
    .limit(safeLimit);

  if (error || !data) return [];

  return data.map((row) => ({
    progressSeconds: Number(row.progress_seconds ?? 0),
    durationSeconds: Number(row.duration_seconds ?? 0),
    completed: Boolean(row.completed),
    updatedAt: String(row.updated_at ?? ""),
    video: (row as { videos?: unknown }).videos ?? null,
  }));
}

