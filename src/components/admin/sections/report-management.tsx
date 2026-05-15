"use client";

import { EyeOff, ExternalLink, ShieldOff, Trash2, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAllVideoReportsAction,
  deleteVideoReportAction,
  updateVideoReportStatusAction,
  type VideoReportItem,
  type VideoReportStatus,
} from "@/app/actions/reports";
import { bulkPrivateUploaderVideosAction } from "@/app/actions/admin";
import { revokeEntryTicketByVideoAction } from "@/app/actions/lottery-admin";
import { adminTokens } from "@/lib/admin-styles";
import { cn } from "@/lib/utils/cn";
import { useI18n } from "@/components/genova/language-provider";

function formatRelativeTime(date: string | Date, t: (key: string, fallback: string) => string) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return t("adminReport.timeJustNow", "Just now");
  if (hours < 24)
    return t("adminReport.timeHoursAgo", "{hours}h ago").replace("{hours}", String(hours));
  const days = Math.floor(hours / 24);
  if (days < 7)
    return t("adminReport.timeDaysAgo", "{days}d ago").replace("{days}", String(days));
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
  initialStatusFilter,
}: {
  reports: VideoReportItem[];
  onMessage: (message: string) => void;
  /** 대시보드 액션 칩 진입 시 초기 상태 필터(open 등). */
  initialStatusFilter?: string | null;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [localReports, setLocalReports] = useState<VideoReportItem[]>(reports);
  const [reportStatusFilter, setReportStatusFilter] = useState<"all" | VideoReportStatus>(
    initialStatusFilter &&
      ["open", "reviewing", "resolved", "rejected"].includes(initialStatusFilter)
      ? (initialStatusFilter as VideoReportStatus)
      : "all",
  );
  const [reportReasonFilter, setReportReasonFilter] = useState<"all" | VideoReportItem["reason"]>("all");
  const [reportSort, setReportSort] = useState<"open_first" | "latest">("open_first");
  // G5: free-text search across videoTitle / reporterName / detail /
  // videoId / reporter id.  Matches the work-queue scan operators do
  // when looking up a specific report from a Slack ping.
  const [reportSearch, setReportSearch] = useState("");
  // H2-A.8: collapse multiple reports on the same video into one row
  // so a 10x-reported video isn't 10 rows.  Default off (per-row view
  // is still useful for status transitions and detail diff).
  const [groupByVideo, setGroupByVideo] = useState(false);
  // H4-D.3: when there are no open / reviewing reports the panel is
  // pure historical noise — collapse it so the operator scrolls past
  // quickly.  Toggle re-expand for review.
  const [bodyCollapsed, setBodyCollapsed] = useState(false);

  useEffect(() => setLocalReports(reports), [reports]);

  const filteredReports = useMemo(() => {
    let result = [...localReports];
    if (reportStatusFilter !== "all") result = result.filter((r) => r.status === reportStatusFilter);
    if (reportReasonFilter !== "all") result = result.filter((r) => r.reason === reportReasonFilter);
    const q = reportSearch.trim().toLowerCase();
    if (q) {
      result = result.filter((r) =>
        [r.videoTitle, r.reporterName, r.detail, r.videoId, r.reporterUserId]
          .filter((v): v is string => Boolean(v))
          .some((v) => v.toLowerCase().includes(q)),
      );
    }
    result.sort((a, b) => {
      if (reportSort === "open_first") {
        if (a.status === "open" && b.status !== "open") return -1;
        if (a.status !== "open" && b.status === "open") return 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    if (groupByVideo) {
      // H2-A.8: collapse rows sharing the same videoId.  The first
      // matching report keeps its place; an extra `duplicateCount` is
      // stamped onto it so the row can render "+N more" inline.
      const seen = new Map<string, VideoReportItem & { duplicateCount?: number }>();
      for (const r of result) {
        const existing = seen.get(r.videoId);
        if (!existing) {
          seen.set(r.videoId, { ...r, duplicateCount: 0 });
        } else {
          existing.duplicateCount = (existing.duplicateCount ?? 0) + 1;
        }
      }
      return Array.from(seen.values());
    }
    return result;
  }, [localReports, reportStatusFilter, reportReasonFilter, reportSort, reportSearch, groupByVideo]);

  const openCount = useMemo(() => localReports.filter((r) => r.status === "open").length, [localReports]);
  const reviewingCount = useMemo(
    () => localReports.filter((r) => r.status === "reviewing").length,
    [localReports],
  );
  const actionablePresent = openCount > 0 || reviewingCount > 0;

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
      onMessage(
        res.ok
          ? t("adminReport.saved", "Saved.")
          : res.message ?? t("adminReport.failed", "Failed."),
      );
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

  /**
   * Phase 6-D: revoke the lottery ticket attached to the reported
   * video.  Wraps revokeEntryTicketByVideoAction with a confirm
   * dialog + surfaces the "no_ticket" / "already_revoked" paths
   * as friendly toast messages instead of error noise.
   */
  const revokeTicket = async (videoId: string, videoTitle: string) => {
    if (
      !confirm(
        `Revoke the lottery ticket attached to "${videoTitle}"? This excludes the video from all current + future draws.`,
      )
    )
      return;
    setLoading(true);
    try {
      const res = await revokeEntryTicketByVideoAction({
        videoId,
        reason: "report_violation",
      });
      if (res.ok) {
        onMessage(`Ticket revoked for "${videoTitle}"`);
      } else if (res.message === "no_ticket") {
        onMessage("No lottery ticket was issued for this video.");
      } else if (res.message === "already_revoked") {
        onMessage("Ticket was already revoked.");
      } else {
        onMessage(`Revoke failed: ${res.message}`);
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  /**
   * H6-A.6: hide every public video by the offending uploader.
   * Two-step confirm — this is a broad moderation hammer.
   */
  const bulkPrivateUploader = async (videoId: string, videoTitle: string) => {
    if (
      !confirm(
        t(
          "adminReport.bulkPrivateConfirm",
          'Set all public videos by the uploader of "{title}" to private.\n(You can revert this via the per-video visibility toggle.)\n\nDo you want to continue?',
        ).replace("{title}", videoTitle),
      )
    )
      return;
    setLoading(true);
    try {
      const res = await bulkPrivateUploaderVideosAction(videoId);
      if (res.ok) {
        onMessage(
          t("adminReport.bulkPrivateDone", "Set {count} uploader video(s) to private.").replace(
            "{count}",
            String(res.affected ?? 0),
          ),
        );
      } else {
        onMessage(
          t("adminReport.bulkPrivateFailed", "Bulk private failed: {message}").replace(
            "{message}",
            String(res.message),
          ),
        );
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (reportId: string) => {
    if (!confirm(t("adminReport.deleteConfirm", "Delete this report?"))) return;
    void callWithOptimistic(
      () => deleteVideoReportAction(reportId),
      () => setLocalReports((prev) => prev.filter((item) => item.id !== reportId)),
    );
  };

  const handleDeleteAll = () => {
    // G4: bulk-clear now ONLY removes resolved / rejected rows.  Open
    // / reviewing reports are protected server-side, so this can't
    // accidentally nuke unread moderation work.  Still two-step
    // confirm — the action is irreversible.
    const closedCount = localReports.filter(
      (r) => r.status === "resolved" || r.status === "rejected",
    ).length;
    if (closedCount === 0) {
      onMessage(
        t("adminReport.noClosedReports", "There are no closed (resolved/rejected) reports."),
      );
      return;
    }
    if (
      !confirm(
        t(
          "adminReport.deleteAllConfirm",
          "Delete {count} closed report(s).\n(open / reviewing reports are protected and will not be deleted.)\n\nDo you want to continue?",
        ).replace("{count}", String(closedCount)),
      )
    )
      return;
    if (
      !confirm(
        t(
          "adminReport.deleteAllConfirm2",
          "Permanently delete {count} report(s)? This cannot be undone.",
        ).replace("{count}", String(closedCount)),
      )
    )
      return;
    void callWithOptimistic(
      () => deleteAllVideoReportsAction(),
      () =>
        setLocalReports((prev) =>
          prev.filter((r) => r.status !== "resolved" && r.status !== "rejected"),
        ),
    );
  };

  return (
    <div className={cn(adminTokens.card, "mt-4")}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className={cn(adminTokens.sectionHeader, "!mb-0")}>
            {t("adminReport.title", "Report Management")}
          </h2>
          <span className="text-[11px] font-mono text-white/30">{localReports.length}</span>
          {openCount > 0 ? (
            <span className={cn(adminTokens.badge, adminTokens.badgeDanger, "ml-0 sm:ml-1")}>
              Open {openCount}
            </span>
          ) : null}
          {/* H4-D.3: collapse toggle.  Only useful when there's
              nothing actionable — auto-show the toggle only then. */}
          {!actionablePresent && localReports.length > 0 ? (
            <button
              type="button"
              onClick={() => setBodyCollapsed((v) => !v)}
              className={cn(adminTokens.buttonGhost, "text-[11px]")}
            >
              {bodyCollapsed
                ? t("adminReport.showAll", "Show all")
                : t("adminReport.collapse", "Collapse")}
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* G5: free-text search */}
          <input
            type="search"
            value={reportSearch}
            onChange={(e) => setReportSearch(e.target.value)}
            placeholder={t("adminReport.searchPlaceholder", "Search (title/reporter/reason/ID)")}
            className={cn(adminTokens.input, "min-w-[180px] text-[12px]")}
          />
          <select
            value={reportStatusFilter}
            onChange={(e) => setReportStatusFilter(e.target.value as "all" | VideoReportStatus)}
            className={filterSelectSm}
          >
            <option value="all">{t("adminReport.statusAll", "Status: All")}</option>
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
            <option value="all">{t("adminReport.reasonAll", "Reason: All")}</option>
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
            <option value="open_first">{t("adminReport.sortOpenFirst", "Sort: Open first")}</option>
            <option value="latest">{t("adminReport.sortLatest", "Sort: Latest")}</option>
          </select>
          {/* H2-A.8: collapse-by-video toggle */}
          <button
            type="button"
            onClick={() => setGroupByVideo((v) => !v)}
            className={cn(
              adminTokens.buttonSecondary,
              groupByVideo && "border-[#7F77DD]/30 bg-[#7F77DD]/[0.1] text-[#AFA9EC]",
            )}
            title={t("adminReport.groupByVideoTitle", "Group multiple reports for the same video into one row")}
          >
            {groupByVideo
              ? t("adminReport.groupByVideoOn", "✓ By video")
              : t("adminReport.groupByVideoOff", "Group by video")}
          </button>
          {localReports.length > 0 ? (
            <button type="button" disabled={loading} onClick={handleDeleteAll} className={adminTokens.buttonDanger}>
              {t("adminReport.deleteAll", "Delete all")}
            </button>
          ) : null}
        </div>
      </div>

      {bodyCollapsed && !actionablePresent ? (
        <p className="rounded-md border border-white/[0.06] bg-white/[0.01] px-3 py-3 text-[11px] text-white/35">
          {t("adminReport.noActionable", "No reports to handle. ({count} archived)").replace(
            "{count}",
            String(localReports.length),
          )}
        </p>
      ) : (
      <div className="max-h-[520px] min-h-0 space-y-1 overflow-y-auto pr-0.5">
        {filteredReports.length === 0 ? (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] py-12 text-center">
            <p className="text-[12px] text-white/35">
              {localReports.length === 0
                ? t("adminReport.emptyNoReports", "No reports")
                : t("adminReport.emptyNoMatch", "No reports match the filter")}
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
                  <span className="text-[10px] uppercase tracking-wider text-white/35">{reportReasonLabel(report.reason)}</span>
                  <span className="text-[9px] uppercase tracking-wider text-white/25">{reportScopeLabel(report.scope)}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="truncate text-[13px] font-medium text-white">
                      {report.videoTitle?.trim()
                        ? report.videoTitle
                        : t("adminReport.deletedVideo", "Deleted video")}
                    </p>
                    {/* H2-A.8: extra-report count when grouping */}
                    {(report as VideoReportItem & { duplicateCount?: number }).duplicateCount ? (
                      <span className={cn(adminTokens.badge, adminTokens.badgeDanger)}>
                        +{(report as VideoReportItem & { duplicateCount?: number }).duplicateCount} more
                      </span>
                    ) : null}
                    <span className="hidden text-white/20 sm:inline">·</span>
                    <span className="truncate text-[11px] text-white/50">{report.reporterName?.trim() || t("adminReport.anonymous", "Anonymous")}</span>
                    {typeof report.timestampSec === "number" ? (
                      <>
                        <span className="text-white/20">·</span>
                        <span className="text-[10px] tabular-nums text-white/35">{report.timestampSec}s</span>
                      </>
                    ) : null}
                  </div>
                  {report.detail ? (
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-white/35">{report.detail}</p>
                  ) : null}
                </div>

                <span className="hidden shrink-0 text-[10px] font-mono text-white/30 sm:inline-block">{formatRelativeTime(report.createdAt, t)}</span>

                <div
                  className={cn(
                    "ml-auto flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:ml-0 [@media(hover:hover)]:sm:opacity-0 [@media(hover:hover)]:sm:group-hover:opacity-100",
                  )}
                >
                  <button
                    type="button"
                    className={adminTokens.iconButton}
                    title={t("adminReport.viewVideo", "View video")}
                    onClick={() => window.open(`/watch/${report.videoId}`, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink size={13} />
                  </button>
                  <button
                    type="button"
                    className={adminTokens.iconButton}
                    title={t("adminReport.reporterProfile", "Reporter profile")}
                    onClick={() => window.open(`/profile/${report.reporterUserId}`, "_blank", "noopener,noreferrer")}
                  >
                    <User size={13} />
                  </button>
                  {/* Phase 6-D: lottery ticket revocation.  Visible only
                      when the report is in a state where admin would
                      typically act on it (reviewing or resolved). */}
                  {report.status === "reviewing" || report.status === "resolved" ? (
                    <>
                      <button
                        type="button"
                        disabled={loading}
                        className={cn(
                          adminTokens.iconButton,
                          "text-amber-400/80 hover:text-amber-300",
                        )}
                        title={t("adminReport.revokeTicketTitle", "Revoke lottery ticket")}
                        onClick={() => revokeTicket(report.videoId, report.videoTitle)}
                      >
                        <ShieldOff size={13} />
                      </button>
                      {/* H6-A.6: bulk-private the uploader's catalog */}
                      <button
                        type="button"
                        disabled={loading}
                        className={cn(
                          adminTokens.iconButton,
                          "text-red-400/80 hover:text-red-300",
                        )}
                        title={t("adminReport.bulkPrivateTitle", "Set all videos by this uploader to private")}
                        onClick={() => bulkPrivateUploader(report.videoId, report.videoTitle)}
                      >
                        <EyeOff size={13} />
                      </button>
                    </>
                  ) : null}

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
                      {t("adminReport.actionReview", "Review")}
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => updateStatus(report.id, "resolved")}
                      className={cn(adminTokens.buttonGhost, "h-8 px-2", report.status === "resolved" ? "text-emerald-400" : "")}
                    >
                      {t("adminReport.actionResolve", "Resolve")}
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => updateStatus(report.id, "rejected")}
                      className={cn(adminTokens.buttonGhost, "h-8 px-2", report.status === "rejected" ? "text-white/55" : "")}
                    >
                      {t("adminReport.actionReject", "Reject")}
                    </button>
                  </div>

                  <button type="button" disabled={loading} onClick={() => handleDelete(report.id)} className={adminTokens.iconButton} title={t("adminReport.delete", "Delete")}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="mt-1 text-[10px] font-mono text-white/25 sm:hidden">{formatRelativeTime(report.createdAt, t)}</div>
            </div>
          ))
        )}
      </div>
      )}
    </div>
  );
}
