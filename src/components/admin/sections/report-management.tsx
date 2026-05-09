"use client";

import { ExternalLink, Trash2, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAllVideoReportsAction,
  deleteVideoReportAction,
  updateVideoReportStatusAction,
  type VideoReportItem,
  type VideoReportStatus,
} from "@/app/actions/reports";
import { adminTokens } from "@/lib/admin-styles";
import { cn } from "@/lib/utils/cn";

function formatRelativeTime(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "방금";
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(date).toLocaleDateString("ko-KR");
}

function reportScopeLabel(scope: VideoReportItem["scope"]) {
  if (scope === "video") return "Video";
  if (scope === "audio") return "Audio";
  if (scope === "thumbnail") return "Thumbnail";
  if (scope === "caption") return "Caption";
  return "Comment";
}

function reportReasonLabel(reason: VideoReportItem["reason"]) {
  if (reason === "spam") return "Spam";
  if (reason === "copyright") return "Copyright";
  if (reason === "harassment") return "Harassment";
  if (reason === "sexual") return "Sexual";
  if (reason === "violence") return "Violence";
  if (reason === "hate") return "Hate";
  if (reason === "misinfo") return "Misinformation";
  return "Other";
}

export function ReportManagement({
  reports,
  onMessage,
}: {
  reports: VideoReportItem[];
  onMessage: (message: string) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [localReports, setLocalReports] = useState<VideoReportItem[]>(reports);
  const [reportStatusFilter, setReportStatusFilter] = useState<"all" | VideoReportStatus>("all");
  const [reportReasonFilter, setReportReasonFilter] = useState<"all" | VideoReportItem["reason"]>("all");
  const [reportSort, setReportSort] = useState<"open_first" | "latest">("open_first");

  useEffect(() => setLocalReports(reports), [reports]);

  const filteredReports = useMemo(() => {
    let result = [...localReports];
    if (reportStatusFilter !== "all") result = result.filter((r) => r.status === reportStatusFilter);
    if (reportReasonFilter !== "all") result = result.filter((r) => r.reason === reportReasonFilter);
    result.sort((a, b) => {
      if (reportSort === "open_first") {
        if (a.status === "open" && b.status !== "open") return -1;
        if (a.status !== "open" && b.status === "open") return 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return result;
  }, [localReports, reportStatusFilter, reportReasonFilter, reportSort]);

  const openCount = useMemo(() => localReports.filter((r) => r.status === "open").length, [localReports]);

  const filterSelectSm = cn(adminTokens.input, "min-w-[100px] cursor-pointer text-[12px]");
  const filterSelectSort = cn(adminTokens.input, "min-w-[110px] cursor-pointer text-[12px]");

  const callWithOptimistic = async (
    fn: () => Promise<{ ok: boolean; message?: string }>,
    optimisticUpdate?: () => void,
  ) => {
    setLoading(true);
    if (optimisticUpdate) optimisticUpdate();
    try {
      const res = await fn();
      onMessage(res.ok ? "저장되었습니다." : res.message ?? "실패했습니다.");
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (reportId: string, status: VideoReportStatus) => {
    void callWithOptimistic(
      () => updateVideoReportStatusAction(reportId, status),
      () =>
        setLocalReports((prev) => prev.map((item) => (item.id === reportId ? { ...item, status } : item))),
    );
  };

  const handleDelete = (reportId: string) => {
    if (!confirm("이 신고를 삭제하시겠습니까?")) return;
    void callWithOptimistic(
      () => deleteVideoReportAction(reportId),
      () => setLocalReports((prev) => prev.filter((item) => item.id !== reportId)),
    );
  };

  const handleDeleteAll = () => {
    if (!confirm("신고 내역 전체를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    void callWithOptimistic(
      () => deleteAllVideoReportsAction(),
      () => setLocalReports([]),
    );
  };

  return (
    <div className={cn(adminTokens.card, "mt-4")}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className={cn(adminTokens.sectionHeader, "!mb-0")}>신고 관리</h2>
          <span className="text-[11px] font-mono text-white/30">{localReports.length}</span>
          {openCount > 0 ? (
            <span className={cn(adminTokens.badge, adminTokens.badgeDanger, "ml-0 sm:ml-1")}>
              Open {openCount}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={reportStatusFilter}
            onChange={(e) => setReportStatusFilter(e.target.value as "all" | VideoReportStatus)}
            className={filterSelectSm}
          >
            <option value="all">상태: 전체</option>
            <option value="open">Open</option>
            <option value="reviewing">Reviewing</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={reportReasonFilter}
            onChange={(e) => setReportReasonFilter(e.target.value as "all" | VideoReportItem["reason"])}
            className={filterSelectSm}
          >
            <option value="all">사유: 전체</option>
            <option value="spam">Spam</option>
            <option value="copyright">Copyright</option>
            <option value="harassment">Harassment</option>
            <option value="sexual">Sexual</option>
            <option value="violence">Violence</option>
            <option value="hate">Hate</option>
            <option value="misinfo">Misinformation</option>
            <option value="other">Other</option>
          </select>
          <select value={reportSort} onChange={(e) => setReportSort(e.target.value as "open_first" | "latest")} className={filterSelectSort}>
            <option value="open_first">정렬: Open 우선</option>
            <option value="latest">정렬: 최신순</option>
          </select>
          {localReports.length > 0 ? (
            <button type="button" disabled={loading} onClick={handleDeleteAll} className={adminTokens.buttonDanger}>
              전체 삭제
            </button>
          ) : null}
        </div>
      </div>

      <div className="max-h-[520px] min-h-0 space-y-1 overflow-y-auto pr-0.5">
        {filteredReports.length === 0 ? (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] py-12 text-center">
            <p className="text-[12px] text-white/40">
              {localReports.length === 0 ? "신고 내역이 없습니다" : "필터 조건에 맞는 신고가 없습니다"}
            </p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="group rounded-lg border border-white/[0.04] bg-white/[0.01] px-3 py-2.5 transition hover:border-white/[0.08] hover:bg-white/[0.03]"
            >
              <div className="flex items-start gap-3">
                <div className="flex w-[80px] shrink-0 flex-col gap-1">
                  {report.status === "open" ? (
                    <span className={cn(adminTokens.badge, adminTokens.badgeDanger)}>Open</span>
                  ) : null}
                  {report.status === "reviewing" ? (
                    <span className={cn(adminTokens.badge, adminTokens.badgeWarning)}>Reviewing</span>
                  ) : null}
                  {report.status === "resolved" ? (
                    <span className={cn(adminTokens.badge, adminTokens.badgeSuccess)}>Resolved</span>
                  ) : null}
                  {report.status === "rejected" ? (
                    <span className={cn(adminTokens.badge, adminTokens.badgeNeutral)}>Rejected</span>
                  ) : null}
                  <span className="text-[10px] uppercase tracking-wider text-white/40">{reportReasonLabel(report.reason)}</span>
                  <span className="text-[9px] uppercase tracking-wider text-white/25">{reportScopeLabel(report.scope)}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="truncate text-[13px] font-medium text-white">
                      {report.videoTitle?.trim() ? report.videoTitle : "삭제된 영상"}
                    </p>
                    <span className="hidden text-white/20 sm:inline">·</span>
                    <span className="truncate text-[11px] text-white/50">{report.reporterName?.trim() || "익명"}</span>
                    {typeof report.timestampSec === "number" ? (
                      <>
                        <span className="text-white/20">·</span>
                        <span className="text-[10px] tabular-nums text-white/35">{report.timestampSec}s</span>
                      </>
                    ) : null}
                  </div>
                  {report.detail ? (
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-white/40">{report.detail}</p>
                  ) : null}
                </div>

                <span className="hidden shrink-0 text-[10px] font-mono text-white/30 sm:inline-block">{formatRelativeTime(report.createdAt)}</span>

                <div
                  className={cn(
                    "ml-auto flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:ml-0 sm:opacity-0 sm:group-hover:opacity-100",
                  )}
                >
                  <button
                    type="button"
                    className={adminTokens.iconButton}
                    title="영상 보기"
                    onClick={() => window.open(`/watch/${report.videoId}`, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink size={13} />
                  </button>
                  <button
                    type="button"
                    className={adminTokens.iconButton}
                    title="신고자 프로필"
                    onClick={() => window.open(`/profile/${report.reporterUserId}`, "_blank", "noopener,noreferrer")}
                  >
                    <User size={13} />
                  </button>

                  <div className="ml-1 flex flex-wrap items-center gap-0.5 border-l border-white/[0.06] pl-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => updateStatus(report.id, "open")}
                      className={cn(adminTokens.buttonGhost, "h-8 px-2", report.status === "open" ? "text-red-400" : "")}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => updateStatus(report.id, "reviewing")}
                      className={cn(adminTokens.buttonGhost, "h-8 px-2", report.status === "reviewing" ? "text-amber-400" : "")}
                    >
                      검토
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => updateStatus(report.id, "resolved")}
                      className={cn(adminTokens.buttonGhost, "h-8 px-2", report.status === "resolved" ? "text-emerald-400" : "")}
                    >
                      해결
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => updateStatus(report.id, "rejected")}
                      className={cn(adminTokens.buttonGhost, "h-8 px-2", report.status === "rejected" ? "text-white/60" : "")}
                    >
                      기각
                    </button>
                  </div>

                  <button type="button" disabled={loading} onClick={() => handleDelete(report.id)} className={adminTokens.iconButton} title="삭제">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="mt-1 text-[10px] font-mono text-white/25 sm:hidden">{formatRelativeTime(report.createdAt)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
