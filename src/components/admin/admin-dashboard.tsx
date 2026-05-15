"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Film,
  Trophy,
  Flag,
  Ticket,
  Award,
  Briefcase,
  Settings as SettingsIcon,
  ChevronRight,
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

type AdminView =
  | "home"
  | "videos"
  | "competitions"
  | "reports"
  | "lottery"
  | "trophies"
  | "business"
  | "settings";

const VALID_VIEWS: AdminView[] = [
  "home",
  "videos",
  "competitions",
  "reports",
  "lottery",
  "trophies",
  "business",
  "settings",
];

// 레거시 ?tab= 값 → 새 view.  content 탭은 신고+영상이 섞여 있었으나
// 가장 빈도 높은 영상 관리로 진입시킨다.
const LEGACY_TAB_MAP: Record<string, AdminView> = {
  content: "videos",
  competition: "competitions",
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

const VIEW_LABEL: Record<Exclude<AdminView, "home">, string> = {
  videos: "영상 관리",
  competitions: "공모전 관리",
  reports: "신고 관리",
  lottery: "응모권",
  trophies: "트로피",
  business: "비즈니스 문의",
  settings: "사이트 설정",
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

  useEffect(() => {
    setLocalCompetitions(competitions);
  }, [competitions]);

  useEffect(() => {
    setView(resolveView(searchParams.get("tab")));
  }, [searchParams]);

  const openReportCount = reports.filter((r) => r.status === "open").length;
  const newInquiryCount = inquiries.filter((i) => i.status === "new").length;
  // 미처리 응모권 = submitted(검수 대기) + confirmed(지급 대기)
  const lotteryPendingActionCount = lotteryWinners.filter(
    (w) => w.claimStatus === "submitted" || w.claimStatus === "confirmed",
  ).length;
  const activeCompetitionCount = localCompetitions.filter(
    (c) => c.status === "Open",
  ).length;

  const navigate = (next: AdminView) => {
    setView(next);
    // message 는 화면 전환 시 비워서 다른 영역 결과가 잔류하지 않게.
    setMessage(null);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "home") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

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
      label: "영상 관리",
      icon: <Film className="h-5 w-5" />,
      stat: videos.length,
      statSuffix: "개",
    },
    {
      view: "competitions",
      label: "공모전 관리",
      icon: <Trophy className="h-5 w-5" />,
      stat: localCompetitions.length,
      statSuffix: "개",
      sub: `진행 중 ${activeCompetitionCount}`,
    },
    {
      view: "reports",
      label: "신고 관리",
      icon: <Flag className="h-5 w-5" />,
      stat: openReportCount,
      statSuffix: "건 미처리",
      alert: openReportCount > 0,
    },
    {
      view: "lottery",
      label: "응모권",
      icon: <Ticket className="h-5 w-5" />,
      stat: lotteryPendingActionCount,
      statSuffix: "건 대기",
      alert: lotteryPendingActionCount > 0,
    },
    {
      view: "trophies",
      label: "트로피",
      icon: <Award className="h-5 w-5" />,
    },
    {
      view: "business",
      label: "비즈니스 문의",
      icon: <Briefcase className="h-5 w-5" />,
      stat: newInquiryCount,
      statSuffix: "건 신규",
      alert: newInquiryCount > 0,
    },
    {
      view: "settings",
      label: "사이트 설정",
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
                    <p className="mt-0.5 text-[12px] text-white/35">바로가기</p>
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
              대시보드
            </button>
            <h1 className="text-[18px] font-bold tracking-tight text-white">
              {VIEW_LABEL[view]}
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
              <ReportManagement reports={reports} onMessage={setMessage} />
            ) : null}

            {view === "competitions" ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <CompetitionManage
                  competitions={localCompetitions}
                  videos={videos}
                  selectedCompetition={selectedCompetition}
                  setSelectedCompetition={setSelectedCompetition}
                  setVideoFilter={setVideoFilter}
                  onCompetitionsChange={setLocalCompetitions}
                  onMessage={setMessage}
                />
                <CompetitionCreate onMessage={setMessage} />
              </div>
            ) : null}

            {view === "trophies" ? (
              <TrophyManagement
                competitions={localCompetitions}
                onMessage={setMessage}
              />
            ) : null}

            {view === "business" ? (
              <BusinessInquiryManagement
                inquiries={inquiries}
                onMessage={setMessage}
              />
            ) : null}

            {view === "lottery" ? (
              <LotteryManagement
                competitions={lotteryCompetitions}
                winners={lotteryWinners}
                auditLog={lotteryAudit}
                onMessage={setMessage}
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
