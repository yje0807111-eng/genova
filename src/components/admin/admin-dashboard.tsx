"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type VideoReportItem } from "@/app/actions/reports";
import type { BusinessInquiryItem } from "@/app/actions/business-inquiries";
import { AdminHero } from "@/components/admin/sections/admin-hero";
import { SiteSettings } from "@/components/admin/sections/site-settings";
import { ReportManagement } from "@/components/admin/sections/report-management";
import { TrophyManagement } from "@/components/admin/sections/trophy-management";
import { CompetitionCreate } from "@/components/admin/sections/competition-create";
import { CompetitionManage } from "@/components/admin/sections/competition-manage";
import { BusinessInquiryManagement } from "./sections/business-inquiry-management";
import { VideoManage } from "@/components/admin/sections/video-manage";
import { adminTokens } from "@/lib/admin-styles";
import type { Competition, Video } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type AdminTab = "content" | "competition" | "business" | "settings";

const VALID_TABS: AdminTab[] = ["content", "competition", "business", "settings"];

function isAdminTab(value: string | null): value is AdminTab {
  return value !== null && VALID_TABS.includes(value as AdminTab);
}

function AdminDashboardInner({
  competitions,
  videos,
  reports,
  inquiries,
}: {
  competitions: Competition[];
  videos: Video[];
  reports: VideoReportItem[];
  inquiries: BusinessInquiryItem[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [message, setMessage] = useState<string | null>(null);
  const [localCompetitions, setLocalCompetitions] = useState(competitions);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [videoFilter, setVideoFilter] = useState("all");

  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<AdminTab>(() => (isAdminTab(tabFromUrl) ? tabFromUrl : "content"));

  useEffect(() => {
    setLocalCompetitions(competitions);
  }, [competitions]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (isAdminTab(t)) setActiveTab(t);
    else setActiveTab("content");
  }, [searchParams]);

  const localReports = reports;
  const openReportCount = localReports.filter((r) => r.status === "open").length;
  const newInquiryCount = inquiries.filter((i) => i.status === "new").length;

  const tabs = [
    { key: "content" as const, label: "콘텐츠", badge: openReportCount },
    { key: "competition" as const, label: "공모전" },
  { key: "business" as const, label: "비즈니스", badge: newInquiryCount },
    { key: "settings" as const, label: "사이트 설정" },
  ] as const;

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full pb-8">
      <AdminHero
        totalVideos={videos.length}
        totalCompetitions={localCompetitions.length}
        activeCompetitions={localCompetitions.filter((c) => c.status === "Open").length}
        message={message}
      />

      <div
        className="sticky top-0 z-30 -mx-4 mb-6 border-b border-white/[0.06] bg-[#0a0a0a]/95 px-4 backdrop-blur-md sm:-mx-6 sm:px-6"
      >
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                "-mb-px flex items-center gap-2 border-b-2 px-5 py-3 text-[13px] font-medium transition-all",
                activeTab === tab.key
                  ? "border-white text-white"
                  : "border-transparent text-white/35 hover:text-white/70",
              )}
            >
              {tab.label}
              {"badge" in tab && typeof tab.badge === "number" && tab.badge > 0 ? (
                <span className={cn(adminTokens.badge, adminTokens.badgeDanger)}>{tab.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === "content" ? (
          <>
            <ReportManagement reports={reports} onMessage={setMessage} />
            <VideoManage
              videos={videos}
              selectedCompetition={selectedCompetition}
              setSelectedCompetition={setSelectedCompetition}
              videoFilter={videoFilter}
              setVideoFilter={setVideoFilter}
              onMessage={setMessage}
            />
          </>
        ) : null}

        {activeTab === "competition" ? (
          <>
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
            <TrophyManagement competitions={localCompetitions} onMessage={setMessage} />
          </>
        ) : null}

      {activeTab === "business" ? (
        <BusinessInquiryManagement inquiries={inquiries} onMessage={setMessage} />
      ) : null}
        {activeTab === "settings" ? (
          <SiteSettings competitions={localCompetitions} onMessage={setMessage} />
        ) : null}
      </div>
    </div>
  );
}

function AdminDashboardFallback() {
  return (
    <div className="w-full animate-pulse pb-8">
      <div className="mb-6 h-28 rounded-xl bg-white/[0.04]" />
      <div className="mb-6 h-12 rounded-lg bg-white/[0.03]" />
      <div className="h-64 rounded-xl bg-white/[0.03]" />
    </div>
  );
}

export function AdminDashboard(props: {
  competitions: Competition[];
  videos: Video[];
  reports: VideoReportItem[];
  inquiries: BusinessInquiryItem[];
}) {
  return (
    <Suspense fallback={<AdminDashboardFallback />}>
      <AdminDashboardInner {...props} />
    </Suspense>
  );
}
