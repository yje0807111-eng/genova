"use server";

import { revalidatePath } from "next/cache";
import { requireAdminWithService } from "@/lib/auth/admin-actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ReportActionResult = { ok: true } | { ok: false; needAuth?: boolean; message: string };
export type VideoReportStatus = "open" | "reviewing" | "resolved" | "rejected";

export type VideoReportItem = {
  id: string;
  createdAt: string;
  videoId: string;
  videoTitle: string;
  reporterUserId: string;
  reporterName: string;
  scope: "video" | "audio" | "thumbnail" | "caption" | "comment";
  reason: "spam" | "copyright" | "harassment" | "sexual" | "violence" | "hate" | "misinfo" | "other";
  detail: string | null;
  timestampSec: number | null;
  status: VideoReportStatus;
};

export async function createVideoReportAction({
  videoId,
  scope,
  reason,
  detail,
  timestampSec,
}: {
  videoId: string;
  scope: "video" | "audio" | "thumbnail" | "caption" | "comment";
  reason: "spam" | "copyright" | "harassment" | "sexual" | "violence" | "hate" | "misinfo" | "other";
  detail?: string;
  timestampSec?: number | null;
}): Promise<ReportActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, needAuth: true, message: "Please sign in." };

  const { data: video } = await supabase.from("videos").select("id").eq("id", videoId).maybeSingle();
  if (!video) return { ok: false, message: "Invalid video." };

  // 같은 사용자 중복 신고 제한: 같은 영상 + 같은 사유는 1회만
  const { data: existingSameReason } = await supabase
    .from("video_reports")
    .select("id")
    .eq("video_id", videoId)
    .eq("reporter_user_id", user.id)
    .eq("reason", reason)
    .maybeSingle();
  if (existingSameReason) {
    return { ok: false, message: "You already reported this video for the same reason." };
  }

  const trimmed = detail?.trim() ?? "";
  const { error } = await supabase.from("video_reports").insert({
    video_id: videoId,
    reporter_user_id: user.id,
    scope,
    reason,
    detail: trimmed.length > 0 ? trimmed.slice(0, 1000) : null,
    timestamp_sec: typeof timestampSec === "number" && timestampSec >= 0 ? Math.floor(timestampSec) : null,
    status: "open",
  });

  if (error && (error as { code?: string }).code === "23505") {
    return { ok: false, message: "You already reported this video for the same reason." };
  }
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/watch/${videoId}`);
  revalidatePath("/admin");
  return { ok: true };
}

type AdminResult = { ok: true } | { ok: false; message: string };

export async function updateVideoReportStatusAction(reportId: string, status: VideoReportStatus): Promise<AdminResult> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error };
  const { service } = auth;
  const { data, error } = await service
    .from("video_reports")
    .update({ status })
    .eq("id", reportId)
    .select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0) return { ok: false, message: "Report update failed (not found or no permission)." };
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteVideoReportAction(reportId: string): Promise<AdminResult> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error };
  const { service } = auth;
  const { data, error } = await service.from("video_reports").delete().eq("id", reportId).select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0) return { ok: false, message: "Delete failed (not found or no permission)." };
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * G4: bulk-delete RESOLVED/REJECTED reports only.
 *
 * Previously this deleted every video_reports row regardless of status,
 * which meant a single confirm click could nuke open + reviewing reports
 * (real moderation work the operator hadn't seen yet).  The action now
 * only removes terminal-state rows so the work queue can never be
 * accidentally cleared.  Truly nuking unresolved reports still requires
 * direct SQL or a per-row delete.
 */
export async function deleteAllVideoReportsAction(): Promise<AdminResult> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error };
  const { service } = auth;
  const { data, error } = await service
    .from("video_reports")
    .delete()
    .in("status", ["resolved", "rejected"])
    .select("id");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0) {
    return {
      ok: false,
      message: "No closed reports to clear (open / reviewing rows are protected).",
    };
  }
  revalidatePath("/admin");
  return { ok: true };
}
