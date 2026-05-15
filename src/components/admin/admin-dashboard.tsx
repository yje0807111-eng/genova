"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Film,
  Trophy,
  Flag,
  Ticket,
  Briefcase,
  Settings as SettingsIcon,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { type VideoReportItem } from "@/app/actions/reports";
import type { BusinessInquiryItem } from "@/app/actions/business-inquiries";
import { AdminHero } from "@/components/admin/sections/admin-hero";
import { SiteSettings } from "@/components/admin/sections/site-settings";
import { ReportManagement } from "@/components/admin/sections/report-management";
import { TrophyManagement } from "@/components/admin/sections/trophy-management";
import { CompetitionCreate } from "@/components/admin/sections/competition-create";
import { CompetitionManage } from "@/components/admin/sections/competition-manage";
import { BusinessInquiryManagement } from "./sections/business-inquiry-management";
import { LotteryManagement } from "@/components/admin/sections/lottery-management";
import { VideoManage } from "@/components/admin/sections/video-manage";
import { adminTokens } from "@/lib/admin-styles";
import type {
  LotteryAuditRow,
  LotteryCompetitionSummary,
  LotteryWinnerWorkRow,
} from "@/lib/queries/lottery-admin-queries";
import type { Competition, Video } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { useI18n } from "@/components/genova/language-provider";

/**
 * 관리자 대시보드 — 대시보드 홈 + 드릴다운 구조 (개편).
 *
 * 이전엔 가로 탭 5개에 여러 관리 섹션이 한 탭 안에 세로로 섞여
 * 쌓이고 화면 전체 폭을 써서 운영자 피로도가 컸음.  개편 후:
 *   - home: 통계 + 관리 영역 카드 그리드.  각 카드 클릭 → 드릴다운.
 *   - 드릴다운: 한 화면에 한 관리 영역만.  max-w 컨테이너로 가로폭
 *     제한.  상단에 "← 대시보드" 복귀.
 * 기존 ?tab=content / competition 등 레거시 URL 은 매핑해 호환.
 */

// 트로피는 공모전 부속 작업이라 독립 view 가 아니라 공모전 드릴다운
// 하위 섹션으로 흡수 (정보 위계 정리).
type AdminView =
  | "home"
  | "videos"
  | "competitions"
  | "reports"
  | "lottery"
  | "business"
  | "settings";

const VALID_VIEWS: AdminView[] = [
  "home",
  "videos",
  "competitions",
  "reports",
  "lottery",
  "business",
  "settings",
];

// 레거시 ?tab= 값 → 새 view.  content 탭은 신고+영상이 섞여 있었으나
// 가장 빈도 높은 영상 관리로, trophies 는 공모전으로 흡수.
const LEGACY_TAB_MAP: Record<string, AdminView> = {
  content: "videos",
  competition: "competitions",
  trophies: "competitions",
  lottery: "lottery",
  business: "business",
  settings: "settings",
};

function resolveView(raw: string | null): AdminView {
  if (!raw) return "home";
  if (VALID_VIEWS.includes(raw as AdminView)) return raw as AdminView;
  if (raw in LEGACY_TAB_MAP) return LEGACY_TAB_MAP[raw];
  return "home";
}

// view → i18n 키.  렌더는 컴포넌트 내부에서 t() 로.
const VIEW_LABEL_KEY: Record<
  Exclude<AdminView, "home">,
  { key: string; en: string }
> = {
  videos: { key: "adminDash.videos", en: "Video Management" },
  competitions: { key: "adminDash.competitions", en: "Competition Management" },
  reports: { key: "adminDash.reports", en: "Report Management" },
  lottery: { key: "adminDash.lottery", en: "Entry Tickets" },
  business: { key: "adminDash.business", en: "Business Inquiries" },
  settings: { key: "adminDash.settings", en: "Site Settings" },
};

function AdminMessageBar({
  message,
  kind,
}: {
  message: string | null;
  kind?: "success" | "error";
}) {
  if (!message) return null;
  const isError =
    kind === "error" ||
    (!kind &&
      /실패|오류|error|fail|失敗|エラー/i.test(message));
  return (
    <div
      className={cn(
        "mb-5 rounded-md border px-3 py-2 text-[12px] font-medium",
        isError
          ? "border-red-500/20 bg-red-500/[0.05] text-red-400"
          : "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-400",
      )}
    >
      {message}
    </div>
  );
}

function AdminDashboardInner({
  competitions,
  videos,
  reports,
  inquiries,
  lotteryCompetitions,
  lotteryWinners,
  lotteryAudit,
}: {
  competitions: Competition[];
  videos: Video[];
  reports: VideoReportItem[];
  inquiries: BusinessInquiryItem[];
  lotteryCompetitions: LotteryCompetitionSummary[];
  lotteryWinners: LotteryWinnerWorkRow[];
  lotteryAudit: LotteryAuditRow[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [message, setMessageRaw] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<
    "success" | "error" | undefined
  >(undefined);
  const setMessage = (text: string | null, kind?: "success" | "error") => {
    setMessageRaw(text);
    setMessageKind(kind);
  };
  const [localCompetitions, setLocalCompetitions] = useState(competitions);
  const [selectedCompetition, setSelectedCompetition] =
    useState<Competition | null>(null);
  const [videoFilter, setVideoFilter] = useState("all");

  const [view, setView] = useState<AdminView>(() =>
    resolveView(searchParams.get("tab")),
  );
  // 액션 칩 → 해당 영역의 초기 필터.  URL ?focus= 로 관리하고
  // 섹션에 initial filter prop 으로 내려줌 (섹션은 URL 비의존).
  const [focus, setFocus] = useState<string | null>(() =>
    searchParams.get("focus"),
  );

  useEffect(() => {
    setLocalCompetitions(competitions);
  }, [competitions]);

  useEffect(() => {
    setView(resolveView(searchParams.get("tab")));
    setFocus(searchParams.get("focus"));
  }, [searchParams]);

  const openReportCount = reports.filter((r) => r.status === "open").length;
  const newInquiryCount = inquiries.filter((i) => i.status === "new").length;
  // 미처리 응모권 = submitted(검수 대기) + confirmed(지급 대기)
  const verifyQueueCount = lotteryWinners.filter(
    (w) => w.claimStatus === "submitted",
  ).length;
  const payQueueCount = lotteryWinners.filter(
    (w) => w.claimStatus === "confirmed",
  ).length;
  const lotteryPendingActionCount = verifyQueueCount + payQueueCount;
  const activeCompetitionCount = localCompetitions.filter(
    (c) => c.status === "Open",
  ).length;

  // 액션 중심 홈 계산 — "오늘 뭘 해야 하나".
  const now = Date.now();
  const threeDaysMs = 3 * 86_400_000;
  // 마감 임박 응모권: pending + info_deadline 까지 3일 이내(초과 포함).
  const urgentLotteryCount = lotteryWinners.filter((w) => {
    if (w.claimStatus !== "pending") return false;
    const dl = new Date(w.infoDeadline).getTime();
    return Number.isFinite(dl) && dl - now <= threeDaysMs;
  }).length;
  // 방치 미처리 신고: open + 생성 후 3일 경과.
  const staleReportCount = reports.filter((r) => {
    if (r.status !== "open") return false;
    const t = new Date(r.createdAt).getTime();
    return Number.isFinite(t) && now - t >= threeDaysMs;
  }).length;
  // 마감 임박 공모전: status Open + deadline 7일 이내.
  const closingSoonCompCount = localCompetitions.filter((c) => {
    if (c.status !== "Open") return false;
    const dl = new Date(c.deadline).getTime();
    return Number.isFinite(dl) && dl - now <= 7 * 86_400_000 && dl - now >= 0;
  }).length;

  const navigate = (next: AdminView, nextFocus?: string) => {
    setView(next);
    setFocus(nextFocus ?? null);
    // message 는 화면 전환 시 비워서 다른 영역 결과가 잔류하지 않게.
    setMessage(null);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "home") params.delete("tab");
    else params.set("tab", next);
    if (nextFocus) params.set("focus", nextFocus);
    else params.delete("focus");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // 연동 복구: 공모전 관리 → 해당 출품작을 영상 관리에서 필터된 채로.
  const openCompetitionVideos = (competition: Competition) => {
    setSelectedCompetition(competition);
    setVideoFilter(`competition_${competition.id}`);
    navigate("videos");
  };

  // 액션 홈 항목 (0건은 숨김).
  const actionItems = (
    [
      { label: t("adminDash.urgentLottery", "Tickets closing soon"), count: urgentLotteryCount, view: "lottery", focus: "pending" },
      { label: t("adminDash.reviewQueue", "Awaiting review"), count: verifyQueueCount, view: "lottery", focus: "submitted" },
      { label: t("adminDash.payQueue", "Awaiting payout"), count: payQueueCount, view: "lottery", focus: "confirmed" },
      { label: t("adminDash.staleReports", "Reports stale 3+ days"), count: staleReportCount, view: "reports", focus: "open" },
      { label: t("adminDash.newInquiries", "New business inquiries"), count: newInquiryCount, view: "business", focus: "new" },
    ] satisfies {
      label: string;
      count: number;
      view: AdminView;
      focus: string;
    }[]
  ).filter((a) => a.count > 0);

  const cards: {
    view: Exclude<AdminView, "home">;
    label: string;
    icon: ReactNode;
    stat?: number;
    statSuffix?: string;
    sub?: string;
    alert?: boolean;
  }[] = [
    {
      view: "videos",
      label: t("adminDash.videos", "Video Management"),
      icon: <Film className="h-5 w-5" />,
      stat: videos.length,
      statSuffix: t("adminDash.suffixCount", "items"),
    },
    {
      view: "competitions",
      label: t("adminDash.competitions", "Competition Management"),
      icon: <Trophy className="h-5 w-5" />,
      stat: localCompetitions.length,
      statSuffix: t("adminDash.suffixCount", "items"),
      sub:
        closingSoonCompCount > 0
          ? t(
              "adminDash.compSubClosing",
              "{active} active · {closing} closing soon",
            )
              .replace("{active}", String(activeCompetitionCount))
              .replace("{closing}", String(closingSoonCompCount))
          : t("adminDash.compSubActive", "{active} active").replace(
              "{active}",
              String(activeCompetitionCount),
            ),
    },
    {
      view: "reports",
      label: t("adminDash.reports", "Report Management"),
      icon: <Flag className="h-5 w-5" />,
      stat: openReportCount,
      statSuffix: t("adminDash.suffixUnhandled", "unhandled"),
      alert: openReportCount > 0,
    },
    {
      view: "lottery",
      label: t("adminDash.lottery", "Entry Tickets"),
      icon: <Ticket className="h-5 w-5" />,
      stat: lotteryPendingActionCount,
      statSuffix: t("adminDash.suffixPending", "pending"),
      alert: lotteryPendingActionCount > 0,
    },
    {
      view: "business",
      label: t("adminDash.business", "Business Inquiries"),
      icon: <Briefcase className="h-5 w-5" />,
      stat: newInquiryCount,
      statSuffix: t("adminDash.suffixNew", "new"),
      alert: newInquiryCount > 0,
    },
    {
      view: "settings",
      label: t("adminDash.settings", "Site Settings"),
      icon: <SettingsIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1200px] pb-10">
      {view === "home" ? (
        <>
          <AdminHero
            totalVideos={videos.length}
            totalCompetitions={localCompetitions.length}
            activeCompetitions={activeCompetitionCount}
            message={null}
          />
          <AdminMessageBar message={message} kind={messageKind} />

          {/* 오늘의 작업 — 액션 가능한 미처리 요약.  클릭 시 해당
              영역으로 이동(연동 필터는 영역별 후속). */}
          <div className={cn(adminTokens.card, "mb-5")}>
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle
                className={cn(
                  "h-4 w-4",
                  actionItems.length > 0 ? "text-amber-400" : "text-white/30",
                )}
              />
              <h2 className="text-[13px] font-bold text-white">
                {t("adminDash.todaysWork", "Today's tasks")}
              </h2>
            </div>
            {actionItems.length === 0 ? (
              <p className="text-[12px] text-white/40">
                {t("adminDash.noTasks", "No tasks to handle. 👍")}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {actionItems.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => navigate(a.view, a.focus)}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1.5 text-[12px] text-amber-200 transition hover:bg-amber-500/[0.12]"
                  >
                    {a.label}
                    <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[11px] font-bold tabular-nums">
                      {a.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cards.map((c) => (
              <button
                key={c.view}
                type="button"
                onClick={() => navigate(c.view)}
                className={cn(
                  adminTokens.card,
                  "group flex flex-col items-start gap-3 text-left transition hover:border-white/20",
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-white/70 transition group-hover:text-white">
                    {c.icon}
                  </span>
                  {c.alert ? (
                    <span
                      className={cn(adminTokens.badge, adminTokens.badgeDanger)}
                    >
                      {c.stat}
                    </span>
                  ) : (
                    <ChevronRight className="h-4 w-4 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white/45" />
                  )}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-white">{c.label}</p>
                  {typeof c.stat === "number" ? (
                    <p className="mt-0.5 text-[12px] text-white/45">
                      <span className="font-semibold tabular-nums text-white/70">
                        {c.stat.toLocaleString()}
                      </span>
                      {c.statSuffix ? ` ${c.statSuffix}` : ""}
                      {c.sub ? ` · ${c.sub}` : ""}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[12px] text-white/35">
                      {t("adminDash.goTo", "Open")}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* 드릴다운 헤더 — 복귀 + 현재 영역 */}
          <div className="mb-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("home")}
              className={cn(
                adminTokens.buttonSecondary,
                "inline-flex h-9 items-center gap-1.5 px-3",
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              {t("adminDash.backToDashboard", "Dashboard")}
            </button>
            <h1 className="text-[18px] font-bold tracking-tight text-white">
              {t(VIEW_LABEL_KEY[view].key, VIEW_LABEL_KEY[view].en)}
            </h1>
          </div>

          <AdminMessageBar message={message} kind={messageKind} />

          <div className="space-y-6">
            {view === "videos" ? (
              <VideoManage
                videos={videos}
                selectedCompetition={selectedCompetition}
                setSelectedCompetition={setSelectedCompetition}
                videoFilter={videoFilter}
                setVideoFilter={setVideoFilter}
                onMessage={setMessage}
              />
            ) : null}

            {view === "reports" ? (
              <ReportManagement
                key={focus ?? "all"}
                reports={reports}
                onMessage={setMessage}
                initialStatusFilter={focus}
              />
            ) : null}

            {view === "competitions" ? (
              <>
                {/* 공모전 관리는 풀폭 — 출품작 펼침 시 행/award
                    드롭다운이 좁게 접히지 않도록.  공모전 생성은
                    가끔 쓰므로 접이식으로 공간 양보. */}
                <CompetitionManage
                  competitions={localCompetitions}
                  videos={videos}
                  selectedCompetition={selectedCompetition}
                  setSelectedCompetition={setSelectedCompetition}
                  setVideoFilter={setVideoFilter}
                  onCompetitionsChange={setLocalCompetitions}
                  onMessage={setMessage}
                  onViewCompetitionVideos={openCompetitionVideos}
                />
                <details className={cn(adminTokens.card, "group")}>
                  <summary className="flex cursor-pointer list-none items-center justify-between text-[13px] font-bold text-white">
                    <span>
                      {t("adminDash.createCompetition", "Create New Competition")}
                    </span>
                    <ChevronRight className="h-4 w-4 text-white/40 transition group-open:rotate-90" />
                  </summary>
                  <div className="mt-4">
                    <CompetitionCreate onMessage={setMessage} />
                  </div>
                </details>
                {/* 트로피는 공모전 부속 작업 → 같은 드릴다운 하위 섹션 */}
                <TrophyManagement
                  competitions={localCompetitions}
                  onMessage={setMessage}
                />
              </>
            ) : null}

            {view === "business" ? (
              <BusinessInquiryManagement
                key={focus ?? "all"}
                inquiries={inquiries}
                onMessage={setMessage}
                initialStatusFilter={focus}
              />
            ) : null}

            {view === "lottery" ? (
              <LotteryManagement
                key={focus ?? "all"}
                competitions={lotteryCompetitions}
                winners={lotteryWinners}
                auditLog={lotteryAudit}
                onMessage={setMessage}
                initialWinnerFilter={focus}
              />
            ) : null}

            {view === "settings" ? (
              <SiteSettings
                competitions={localCompetitions}
                onMessage={setMessage}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function AdminDashboardFallback() {
  return (
    <div className="mx-auto w-full max-w-[1200px] animate-pulse pb-10">
      <div className="mb-6 h-28 rounded-xl bg-white/[0.04]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-white/[0.03]" />
        ))}
      </div>
    </div>
  );
}

export function AdminDashboard(props: {
  competitions: Competition[];
  videos: Video[];
  reports: VideoReportItem[];
  inquiries: BusinessInquiryItem[];
  lotteryCompetitions: LotteryCompetitionSummary[];
  lotteryWinners: LotteryWinnerWorkRow[];
  lotteryAudit: LotteryAuditRow[];
}) {
  return (
    <Suspense fallback={<AdminDashboardFallback />}>
      <AdminDashboardInner {...props} />
    </Suspense>
  );
}
