import { redirect } from "next/navigation";
import { fetchBusinessInquiries } from "@/app/actions/business-inquiries";
import type { VideoReportItem } from "@/app/actions/reports";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { isAdminEmail } from "@/lib/auth/admin";
import { fetchVideosWithCreators } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  if (!isAdminEmail(user.email)) redirect("/");

  // Admin-only reads (video_reports, plus private video titles for the
  // reports dashboard) must bypass RLS — see docs/rls-audit.md §5.2.
  const service = createServiceSupabaseClient();

  const [videos, competitionsRes, reportsRes] = await Promise.all([
    fetchVideosWithCreators(),
    supabase.from("competitions").select("*").order("deadline", { ascending: false }),
    service
      ? service.from("video_reports").select("*").order("created_at", { ascending: false }).limit(200)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
  ]);
  const competitions = (competitionsRes.data ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    genre: r.genre as string,
    status: r.status as string,
    deadline: r.deadline as string,
    voteEnd: r.vote_end as string,
    prizeInfo: r.prize_info as string,
    sponsor: r.sponsor as string,
    isFeatured: Boolean((r as { is_featured?: boolean | null }).is_featured),
  }));

  const reportRows = (reportsRes.data ?? []) as {
    id: string;
    created_at: string;
    video_id: string;
    reporter_user_id: string;
    scope: VideoReportItem["scope"];
    reason: VideoReportItem["reason"];
    detail: string | null;
    timestamp_sec: number | null;
    status: VideoReportItem["status"];
  }[];

  const reportVideoIds = [...new Set(reportRows.map((r) => r.video_id))];
  const reporterIds = [...new Set(reportRows.map((r) => r.reporter_user_id))];

  const [reportVideosRes, reportersRes] = await Promise.all([
    reportVideoIds.length > 0
      ? (service ?? supabase).from("videos").select("id, title").in("id", reportVideoIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[], error: null }),
    reporterIds.length > 0
      ? supabase.from("profiles").select("id, display_name").in("id", reporterIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string | null }[], error: null }),
  ]);

  const videoTitleMap = new Map((reportVideosRes.data ?? []).map((v) => [v.id as string, (v.title as string) ?? "Untitled"]));
  const reporterNameMap = new Map((reportersRes.data ?? []).map((p) => [p.id as string, (p.display_name as string | null) ?? "User"]));

  const reports: VideoReportItem[] = reportRows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    videoId: r.video_id,
    videoTitle: videoTitleMap.get(r.video_id) ?? "Unknown video",
    reporterUserId: r.reporter_user_id,
    reporterName: reporterNameMap.get(r.reporter_user_id) ?? "User",
    scope: r.scope,
    reason: r.reason,
    detail: r.detail,
    timestampSec: r.timestamp_sec,
    status: r.status,
  }));
  const inquiries = await fetchBusinessInquiries();

  return (
    <div className="px-4 py-6 text-[#EEEDFE] sm:px-6">
      <AdminDashboard competitions={competitions} videos={videos} reports={reports} inquiries={inquiries} />
    </div>
  );
}
