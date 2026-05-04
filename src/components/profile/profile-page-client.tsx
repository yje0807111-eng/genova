"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useI18n } from "@/components/genova/language-provider";
import {
  ArrowLeft,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  EyeOff,
  Film,
  Grid,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Star,
  Trophy,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { followUserAction, unfollowUserAction } from "@/app/actions/profile";
import { updateVideoVisibilityAction } from "@/app/actions/video";
import type { FollowingPreviewUser, ProfileAwardBadge } from "@/lib/queries/profile-queries";
import type { Video } from "@/lib/types";
import { addWindowCustomListener } from "@/lib/dom/window-custom-events";
import { formatUploadedRelative } from "@/lib/format-uploaded-relative";
import { formatViewCountShort } from "@/lib/view-count";
import { cn } from "@/lib/utils/cn";

type TabKey = "Videos" | "Competition" | "Series" | "Saved";
const VIDEOS_PER_PAGE = 32;

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  const WINDOW = 9;
  let start = Math.max(1, currentPage - Math.floor(WINDOW / 2));
  let end = start + WINDOW - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - WINDOW + 1);
  }
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

export function GenovaProfileClient({
  profileId,
  displayName,
  handle,
  headerIntro,
  headerToolsLine,
  bioFull,
  avatarUrl,
  bannerUrl,
  joinedLabel,
  followersCount,
  followingCount,
  videoCount,
  works,
  finalistVideos,
  savedVideos,
  isOwner,
  showFollow,
  initialFollowing,
  followingUsers,
  activityVideos,
  awardBadges,
}: {
  profileId: string;
  displayName: string;
  handle: string;
  headerIntro: string;
  headerToolsLine: string;
  bioFull: string;
  avatarUrl: string;
  bannerUrl: string | null;
  joinedLabel: string | null;
  followersCount: number;
  followingCount: number;
  videoCount: number;
  works: Video[];
  finalistVideos: Video[];
  savedVideos: Video[];
  isOwner: boolean;
  showFollow: boolean;
  initialFollowing: boolean;
  followingUsers: FollowingPreviewUser[];
  activityVideos: Video[];
  awardBadges: ProfileAwardBadge[];
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);
  const [activeTab, setActiveTab] = useState<TabKey>("Videos");
  const [sortBy, setSortBy] = useState<"Newest" | "Oldest" | "Most Viewed">("Newest");
  const [editMode, setEditMode] = useState(false);
  const [bulkAction, setBulkAction] = useState<"private" | "public" | null>(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [showBulkHint, setShowBulkHint] = useState(false);
  const [localWorks, setLocalWorks] = useState<Video[]>(works);
  const [localFinalistVideos, setLocalFinalistVideos] = useState<Video[]>(finalistVideos);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeAwardFilter, setActiveAwardFilter] = useState<string | null>(null);
  const [awardsModalOpen, setAwardsModalOpen] = useState(false);
  const [visibleAwardIds, setVisibleAwardIds] = useState<string[]>(() => awardBadges.map((a) => a.id));

  const tabs = useMemo(() => {
    const base: TabKey[] = ["Videos", "Competition", "Series"];
    if (isOwner) base.push("Saved");
    return base;
  }, [isOwner]);

  const listVideos =
    activeTab === "Videos"
      ? localWorks
      : activeTab === "Competition"
        ? localFinalistVideos
        : activeTab === "Series"
          ? localWorks.filter((v) => v.seriesName)
          : savedVideos;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, sortBy, activeAwardFilter]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("profile-owner-status", { detail: isOwner }));
    return () => {
      window.dispatchEvent(new CustomEvent("profile-owner-status", { detail: false }));
    };
  }, [isOwner]);

  useEffect(() => {
    return addWindowCustomListener<string>("profile-tab-change", (tab) => {
      if (tab === "works") setActiveTab("Videos");
      if (tab === "awards") setActiveTab("Competition");
      if (tab === "saved") setActiveTab("Saved");
    });
  }, []);

  useEffect(() => setSelectedVideoIds([]), [bulkAction]);

  const sortedVideos = useMemo(() => {
    const isGenreFilter = Boolean(activeAwardFilter?.startsWith("genre_"));
    const sourceList =
      activeTab === "Videos"
        ? localWorks
        : activeTab === "Competition"
          ? localFinalistVideos
          : activeTab === "Series"
            ? localWorks.filter((v) => v.seriesName)
            : savedVideos;
    const visibilityFiltered =
      bulkAction === "private"
        ? sourceList.filter((v) => v.visibility === "public")
        : bulkAction === "public"
          ? sourceList.filter((v) => v.visibility === "private")
          : !editMode
            ? sourceList.filter((v) => v.visibility !== "private")
            : sourceList;

    let sourceVideos = visibilityFiltered;

    if (activeAwardFilter === "all") {
      sourceVideos = visibilityFiltered.filter((video) => video.award !== null);
    } else if (activeAwardFilter) {
      if (activeTab === "Videos" && isGenreFilter) {
        sourceVideos = visibilityFiltered.filter((video) => video.award === activeAwardFilter);
      } else if (activeTab === "Competition" && !isGenreFilter) {
        sourceVideos = visibilityFiltered.filter((video) => video.award === activeAwardFilter);
      }
    }

    const arr = [...sourceVideos];
    arr.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      if (sortBy === "Most Viewed") {
        return (b.viewCount ?? 0) - (a.viewCount ?? 0);
      }
      return sortBy === "Newest" ? tb - ta : ta - tb;
    });
    return arr;
  }, [activeTab, sortBy, activeAwardFilter, bulkAction, editMode, localWorks, localFinalistVideos, savedVideos]);

  const displayVideos = useMemo(() => {
    const totalPages = Math.ceil(sortedVideos.length / VIDEOS_PER_PAGE);
    const paginated = sortedVideos.slice((currentPage - 1) * VIDEOS_PER_PAGE, currentPage * VIDEOS_PER_PAGE);
    return { videos: paginated, totalPages };
  }, [sortedVideos, currentPage]);

  const totalVideoCount = useMemo(() => localWorks.length, [localWorks]);

  const visibleAwards = useMemo(
    () => awardBadges.filter((a) => visibleAwardIds.includes(a.id)),
    [awardBadges, visibleAwardIds],
  );

  const awardCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const video of localWorks) {
      if (video.award && video.award.startsWith("genre_")) {
        counts[video.award] = (counts[video.award] ?? 0) + 1;
      }
    }

    for (const video of localFinalistVideos) {
      if (video.award && !video.award.startsWith("genre_")) {
        counts[video.award] = (counts[video.award] ?? 0) + 1;
      }
    }

    return counts;
  }, [localWorks, localFinalistVideos]);

  const onFollowToggle = () => {
    startTransition(async () => {
      if (following) {
        const res = await unfollowUserAction(profileId);
        if (res.ok) setFollowing(false);
      } else {
        const res = await followUserAction(profileId);
        if (res.ok) setFollowing(true);
      }
      router.refresh();
    });
  };

  function GenreTrophySvg({ color, rank }: { color: string; rank: "1" | "2" | "3" }) {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" className="h-7 w-7" aria-hidden>
        <path d="M8 4h12v10q0 6-6 8q-6-2-6-8z" fill={color} opacity="0.92" />
        <path d="M8 6q-4 0-4 4q0 4 4 4" fill="none" stroke={color} strokeWidth="1.5" />
        <path d="M20 6q4 0 4 4q0 4-4 4" fill="none" stroke={color} strokeWidth="1.5" />
        <rect x="11" y="22" width="6" height="2" rx="1" fill={color} opacity="0.75" />
        <rect x="9" y="24" width="10" height="1.5" rx="0.75" fill={color} opacity="0.75" />
        <text x="14" y="14" textAnchor="middle" fontSize="8" fontWeight="700" fill="white" opacity="0.95">
          {rank}
        </text>
      </svg>
    );
  }

  function CompetitionTrophySvg({
    cupColor,
    gemColor,
    showStar,
  }: {
    cupColor: string;
    gemColor?: string;
    showStar?: boolean;
  }) {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" className="h-7 w-7" aria-hidden>
        <path d="M8 4h12v10q0 6-6 8q-6-2-6-8z" fill={cupColor} opacity="0.92" />
        <path d="M8 6q-4 0-4 4q0 4 4 4" fill="none" stroke={cupColor} strokeWidth="1.5" />
        <path d="M20 6q4 0 4 4q0 4-4 4" fill="none" stroke={cupColor} strokeWidth="1.5" />
        <rect x="11" y="22" width="6" height="2" rx="1" fill={cupColor} opacity="0.75" />
        <rect x="9" y="24" width="10" height="1.5" rx="0.75" fill={cupColor} opacity="0.75" />
        {gemColor ? <polygon points="14,5 16,8 14,11 12,8" fill={gemColor} opacity="0.95" /> : null}
        {showStar ? (
          <path
            d="M14 6.4l.9 1.8 2 .3-1.45 1.4.35 1.95L14 10.9l-1.8.95.35-1.95L11.1 8.5l2-.3z"
            fill="rgba(255,255,255,0.72)"
          />
        ) : null}
      </svg>
    );
  }

  const renderAwardIcon = (a: ProfileAwardBadge) => {
    if (a.awardType === "weekly") {
      if (a.awardTier === "gold") return <GenreTrophySvg color="#FFD700" rank="1" />;
      if (a.awardTier === "silver") return <GenreTrophySvg color="#C0C0C0" rank="2" />;
      return <GenreTrophySvg color="#CD7F32" rank="3" />;
    }

    if (a.awardTier === "1") {
      return <CompetitionTrophySvg cupColor="#FFD700" gemColor="#6DA9FF" />;
    }
    if (a.awardTier === "2") {
      return <CompetitionTrophySvg cupColor="#C0C0C0" gemColor="#E74C3C" />;
    }
    if (a.awardTier === "3") {
      return <CompetitionTrophySvg cupColor="#CD7F32" gemColor="#2ECC71" />;
    }
    if (a.awardTier === "4-10") {
      return <CompetitionTrophySvg cupColor="#9B59B6" showStar />;
    }
    return <CompetitionTrophySvg cupColor="#808080" />;
  };

  const competitionAwards = [
    { tier: "gold", color: "#FFD700", count: awardCounts["gold"] ?? 0, tooltip: t("profile.tooltipCompetitionGrandPrize", "Competition · Grand Prize") },
    { tier: "silver", color: "#C0C0C0", count: awardCounts["silver"] ?? 0, tooltip: t("profile.tooltipCompetitionRunnerUp", "Competition · Runner-up") },
    { tier: "bronze", color: "#CD7F32", count: awardCounts["bronze"] ?? 0, tooltip: t("profile.tooltipCompetitionThird", "Competition · 3rd place") },
    { tier: "special", color: "#7F77DD", count: awardCounts["special"] ?? 0, tooltip: t("profile.tooltipCompetitionSpecial", "Competition · Special award") },
  ] as const;

  const genreAwards = [
    { place: "1st", color: "#FFD700", count: awardCounts["genre_1st"] ?? 0, tooltip: t("profile.tooltipGenreFirst", "Genre award · 1st") },
    { place: "2nd", color: "#C0C0C0", count: awardCounts["genre_2nd"] ?? 0, tooltip: t("profile.tooltipGenreSecond", "Genre award · 2nd") },
    { place: "3rd", color: "#CD7F32", count: awardCounts["genre_3rd"] ?? 0, tooltip: t("profile.tooltipGenreThird", "Genre award · 3rd") },
  ] as const;

  const awardFilterLabel = (filter: string | null) => {
    if (filter === "all") return "🏆 " + t("profile.allAwards", "All awards");
    if (filter === "gold") return "🏆 " + t("profile.awardGrandPrize", "Grand Prize");
    if (filter === "silver") return "🏆 " + t("profile.awardRunnerUp", "Runner-up");
    if (filter === "bronze") return "🏆 " + t("profile.awardThirdPlace", "3rd place");
    if (filter === "special") return "🏆 " + t("profile.awardSpecial", "Special award");
    if (filter === "genre_1st") return "⭐ " + t("profile.awardGenreFirst", "Genre 1st");
    if (filter === "genre_2nd") return "⭐ " + t("profile.awardGenreSecond", "Genre 2nd");
    if (filter === "genre_3rd") return "⭐ " + t("profile.awardGenreThird", "Genre 3rd");
    return filter ?? "";
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div>
        {/* 커버 배너 — 풀 폭 */}
        <div
          className="relative h-56 w-full overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1a1547 0%, #26215C 40%, #0f0d24 100%)",
          }}
        >
          {bannerUrl ? (
            <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, rgba(83,74,183,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(127,119,221,0.2) 0%, transparent 50%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, transparent 50%, rgba(8,6,24,0.9) 100%)",
            }}
          />
        </div>

        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6">
        {/* 프로필 정보 */}
        <div className="relative z-10 flex items-end gap-6 pb-6" style={{ marginTop: "-64px" }}>
          {/* 아바타 */}
          <div className="shrink-0">
            <div
              className="h-32 w-32 overflow-hidden rounded-full border-4 border-[#080618]"
              style={{
                boxShadow: "0 0 0 3px #534AB7, 0 0 30px rgba(83,74,183,0.6)",
              }}
            >
              <Image
                src={avatarUrl}
                alt={displayName}
                width={128}
                height={128}
                className="h-full w-full object-cover"
                unoptimized={avatarUrl.startsWith("http")}
              />
            </div>
          </div>

          {/* 텍스트 정보 */}
          <div className="min-w-0 flex-1 pb-2">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">{displayName}</h1>
                <p className="mt-0.5 text-sm font-medium text-[#7F77DD]/70">@{handle}</p>
                {headerIntro ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-[#AFA9EC]">{headerIntro}</p>
                ) : null}
                {headerToolsLine ? (
                  <p className="mt-1 text-[11px] tracking-wide text-white/25">{headerToolsLine}</p>
                ) : null}

                {/* 통계 */}
                <div className="mt-3 flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xl font-black tracking-tight text-white">{followersCount}</p>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-white/35">{t("profile.followers", "Followers")}</p>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div className="text-center">
                    <p className="text-xl font-black tracking-tight text-white">{followingCount}</p>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-white/35">
                      {t("profile.followingCountLabel")}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div className="text-center">
                    <p className="text-xl font-black tracking-tight text-white">{totalVideoCount}</p>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-white/35">{t("profile.videos", "Videos")}</p>
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="shrink-0 pb-2">
                {isOwner ? (
                  <Link
                    href="/profile/settings"
                    className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
                  >
                    {t("settings.editProfile", "Edit profile")}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {t("profile.message", "Message")}
                    </button>
                    {showFollow ? (
                      <button
                        type="button"
                        onClick={onFollowToggle}
                        disabled={pending}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60",
                          following
                            ? "border border-white/20 bg-white/5 hover:bg-white/10"
                            : "bg-[#534AB7] text-white hover:bg-[#6B5FD4]",
                        )}
                      >
                        {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                        {following ? t("profile.following", "Following") : t("profile.follow", "Follow")}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-lg border border-white/15 bg-white/5 p-2 transition hover:bg-white/10"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      <div className="border-t border-white/[0.06] py-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/50">
          {t("profile.achievements", "Achievements")}
        </p>
        <div className="flex items-center gap-4">
          {competitionAwards.map((award) => (
            <div
              key={award.tier}
              className={cn(
                "group relative flex-shrink-0",
                award.count === 0 ? "opacity-40" : "cursor-pointer transition-transform duration-200 hover:scale-125",
              )}
              title={award.tooltip}
              onClick={
                award.count > 0
                  ? () => {
                      setActiveTab("Competition");
                      setActiveAwardFilter(award.tier);
                    }
                  : undefined
              }
            >
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {award.tooltip}
              </span>
              <Trophy className="h-6 w-6" style={{ color: award.count === 0 ? "#3a3a3a" : award.color }} aria-hidden />
              <div
                className={cn(
                  "absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background text-[9px] font-bold",
                  award.count > 0 ? "border border-white/20 text-white" : "border border-white/5 text-neutral-600",
                )}
              >
                x{award.count}
              </div>
            </div>
          ))}
          <div className="mx-4 h-8 self-center border-l border-neutral-700" aria-hidden />
          {genreAwards.map((award) => (
            <div
              key={award.place}
              className={cn(
                "group relative flex-shrink-0",
                award.count === 0 ? "opacity-40" : "cursor-pointer transition-transform duration-200 hover:scale-125",
              )}
              title={award.tooltip}
              onClick={
                award.count > 0
                  ? () => {
                      setActiveTab("Videos");
                      setActiveAwardFilter(`genre_${award.place}`);
                    }
                  : undefined
              }
            >
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {award.tooltip}
              </span>
              <Star className="h-6 w-6" style={{ color: award.count === 0 ? "#3a3a3a" : award.color }} aria-hidden />
              <div
                className={cn(
                  "absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background text-[9px] font-bold",
                  award.count > 0 ? "border border-white/20 text-white" : "border border-white/5 text-neutral-600",
                )}
              >
                x{award.count}
              </div>
            </div>
          ))}
          {(() => {
            const totalAwardCount = works.filter((v) => v.award !== null).length;
            return totalAwardCount > 0 ? (
              <div
                className="group relative flex-shrink-0 ml-2 cursor-pointer transition-transform duration-200 hover:scale-110"
                onClick={() => {
                  setActiveTab("Videos");
                  setActiveAwardFilter("all");
                }}
              >
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition",
                    activeAwardFilter === "all"
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-white/20 bg-white/5 text-white/60 hover:text-white hover:border-white/40",
                  )}
                >
                  All
                </span>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Tabs + grid */}
      <div className="border-t border-border pb-12 pt-4">
        <div className="min-w-0 w-full">
            <div className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "-mb-px mr-6 flex items-center gap-2 border-b-2 pb-3 text-sm transition last:mr-0",
                      activeTab === tab
                        ? "border-[#7F77DD] text-[#AFA9EC] font-semibold"
                        : "border-transparent text-white/35 hover:text-white/60",
                    )}
                  >
                    {tab === "Videos" ? <Grid className="h-4 w-4" /> : null}
                    {tab === "Competition" ? <Trophy className="h-4 w-4" /> : null}
                    {tab === "Series" ? <Film className="h-4 w-4" /> : null}
                    {tab === "Saved" ? <Bookmark className="h-4 w-4" /> : null}
                    {tab === "Videos"
                      ? t("profile.tabVideos")
                      : tab === "Competition"
                        ? t("profile.tabCompetition")
                        : tab === "Series"
                          ? t("profile.tabSeries")
                          : t("profile.tabSaved")}
                  </button>
                ))}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {(["Newest", "Oldest", "Most Viewed"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSortBy(opt)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs transition",
                      sortBy === opt
                        ? "border border-[#7F77DD]/30 bg-[#534AB7]/30 font-semibold text-[#AFA9EC]"
                        : "text-white/30 hover:text-white/60",
                    )}
                  >
                    {opt === "Newest" ? t("profile.sortNewest", "Newest") : opt === "Oldest" ? t("profile.sortOldest", "Oldest") : t("profile.sortMostViewed", "Most viewed")}
                  </button>
                ))}
                {isOwner ? (
                  <button
                    type="button"
                    onClick={() => setEditMode((prev) => !prev)}
                    className={cn(
                      "ml-2 rounded-lg border p-1.5 transition-all duration-200",
                      editMode
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border bg-card text-white/40 hover:border-white/30 hover:text-white",
                    )}
                    aria-label={t("profile.toggleEditMode", "Toggle edit mode")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            {isOwner && editMode ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
                <span className="text-xs text-muted-foreground">{t("profile.selectVideosTo", "Select videos, then:")}</span>
                <button
                  type="button"
                  onClick={() => setBulkAction(bulkAction === "private" ? null : "private")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs transition",
                    bulkAction === "private"
                      ? "border-primary bg-primary/20 text-primary"
                      : showBulkHint
                        ? "border-amber-400/50 text-white/70 hover:bg-white/5 hover:text-white ring-1 ring-amber-400/30"
                        : "border-border text-white/70 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <EyeOff className="h-3 w-3" />
                  {t("profile.setPrivate", "Make private")}
                </button>
                <button
                  type="button"
                  onClick={() => setBulkAction(bulkAction === "public" ? null : "public")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs transition",
                    bulkAction === "public"
                      ? "border-primary bg-primary/20 text-primary"
                      : showBulkHint
                        ? "border-amber-400/50 text-white/70 hover:bg-white/5 hover:text-white ring-1 ring-amber-400/30"
                        : "border-border text-white/70 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Eye className="h-3 w-3" />
                  {t("profile.setPublic", "Make public")}
                </button>
                {showBulkHint ? (
                  <span className="flex items-center gap-1.5 animate-pulse text-xs text-amber-400">
                    <ArrowLeft className="h-3 w-3" />
                    {t("profile.selectBulkActionFirst", "Choose a public/private action first")}
                  </span>
                ) : null}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const eligibleIds = displayVideos.videos.map((v) => v.id);
                      const allSelected = eligibleIds.every((id) => selectedVideoIds.includes(id));
                      setSelectedVideoIds(allSelected ? [] : eligibleIds);
                    }}
                    className="text-xs text-muted-foreground transition hover:text-white"
                  >
                    {displayVideos.videos
                      .every((v) => selectedVideoIds.includes(v.id))
                      ? t("profile.deselectAll", "Deselect all")
                      : t("profile.selectAll", "Select all")}
                  </button>
                  <button
                    type="button"
                    disabled={bulkSaving}
                    onClick={async () => {
                      if (!bulkAction || selectedVideoIds.length === 0) {
                        setEditMode(false);
                        setBulkAction(null);
                        setSelectedVideoIds([]);
                        return;
                      }
                      setBulkSaving(true);
                      await Promise.all(
                        selectedVideoIds.map((id) =>
                          updateVideoVisibilityAction(id, bulkAction === "private" ? "private" : "public"),
                        ),
                      );
                      if (bulkAction === "private") {
                        setLocalWorks((prev) =>
                          prev.map((v) => (selectedVideoIds.includes(v.id) ? { ...v, visibility: "private" } : v)),
                        );
                        setLocalFinalistVideos((prev) =>
                          prev.map((v) => (selectedVideoIds.includes(v.id) ? { ...v, visibility: "private" } : v)),
                        );
                      } else if (bulkAction === "public") {
                        setLocalWorks((prev) =>
                          prev.map((v) => (selectedVideoIds.includes(v.id) ? { ...v, visibility: "public" } : v)),
                        );
                        setLocalFinalistVideos((prev) =>
                          prev.map((v) => (selectedVideoIds.includes(v.id) ? { ...v, visibility: "public" } : v)),
                        );
                      }
                      setBulkSaving(false);
                      setEditMode(false);
                      setBulkAction(null);
                      setSelectedVideoIds([]);
                      router.refresh();
                      setTimeout(() => router.refresh(), 500);
                    }}
                    className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white transition hover:bg-primary/90"
                  >
                    {bulkSaving ? t("settings.saving", "Saving…") : selectedVideoIds.length > 0 ? `${t("profile.apply", "Apply")} (${selectedVideoIds.length})` : "OK"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setBulkAction(null);
                      setSelectedVideoIds([]);
                    }}
                    className="rounded-md border border-border px-3 py-1 text-xs text-white/70 transition hover:bg-white/5 hover:text-white"
                  >
                    {t("common.cancel", "Cancel")}
                  </button>
                </div>
              </div>
            ) : null}

            {activeAwardFilter ? (
              <div className="mt-3 flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-purple-900/50 px-3 py-1 text-xs text-purple-300">
                  {awardFilterLabel(activeAwardFilter)}
                  <button
                    type="button"
                    onClick={() => setActiveAwardFilter(null)}
                    aria-label={t("profile.clearAwardFilter")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </div>
            ) : null}

            {activeTab === "Series" ? (
              (() => {
                const seriesMap = new Map<string, Video[]>();
                for (const v of localWorks.filter((v) => v.seriesName)) {
                  const key = v.seriesName!;
                  if (!seriesMap.has(key)) seriesMap.set(key, []);
                  seriesMap.get(key)!.push(v);
                }
                const groups = Array.from(seriesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

                if (groups.length === 0) {
                  return (
                    <p className="mt-8 text-center text-sm text-white/30">{t("profile.seriesEmptyHint")}</p>
                  );
                }

                return (
                  <div className="mt-4 space-y-8">
                    {groups.map(([seriesTitle, episodes]) => (
                      <div key={seriesTitle}>
                        <div className="mb-3 flex items-center gap-3">
                          <h3 className="text-lg font-bold text-white">{seriesTitle}</h3>
                          <span className="rounded-full border border-[#7F77DD]/30 bg-[#534AB7]/20 px-2.5 py-0.5 text-xs text-[#AFA9EC]">
                            {t("profile.episodesTotal").replace("{n}", String(episodes.length))}
                          </span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                          {episodes
                            .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
                            .map((video) => {
                              const thumb =
                                video.thumbnailUrl?.trim() || `https://picsum.photos/seed/${video.id}/400/225`;
                              const views = formatViewCountShort(video.viewCount ?? 0);
                              return (
                                <Link
                                  key={video.id}
                                  href={`/watch/${video.id}`}
                                  className="group/card relative shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/[0.08] transition-all duration-300 hover:scale-[1.03] hover:border-[#7F77DD]/40"
                                  style={{ width: "220px" }}
                                >
                                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
                                    <img
                                      src={thumb}
                                      alt=""
                                      className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                                    />
                                    <div
                                      className="absolute inset-x-0 bottom-0 z-[1]"
                                      style={{
                                        height: "70%",
                                        background:
                                          "linear-gradient(to top, rgba(8,6,24,1) 0%, rgba(8,6,24,0.8) 40%, transparent 100%)",
                                      }}
                                    />
                                    {video.episodeNumber ? (
                                      <span className="absolute left-2 top-2 z-[2] rounded-full border border-[#7F77DD]/30 bg-[#534AB7]/40 px-2 py-0.5 text-[10px] font-bold text-[#AFA9EC] backdrop-blur-sm">
                                        EP {video.episodeNumber}
                                      </span>
                                    ) : null}
                                    {video.runtime ? (
                                      <span className="absolute bottom-[36px] right-2 z-[2] rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                                        {video.runtime}
                                      </span>
                                    ) : null}
                                    <div className="absolute bottom-0 left-0 right-0 z-[3] px-2.5 pb-2">
                                      <h3 className="line-clamp-1 text-[12px] font-bold text-white">{video.title}</h3>
                                      <p className="text-[10px] text-white/40">
                                        {views} {t("profile.viewsSuffix")}
                                      </p>
                                    </div>
                                  </div>
                                </Link>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {displayVideos.videos.length === 0 && activeAwardFilter ? (
                  <p className="col-span-4 mt-12 text-center text-sm text-neutral-500">{t("profile.noVideosForAward")}</p>
                ) : null}
                {displayVideos.videos.map((video) => {
                  const thumb =
                    video.thumbnailUrl?.trim() ||
                    `https://picsum.photos/seed/${encodeURIComponent(video.id)}/400/225`;
                  const views = formatViewCountShort(video.viewCount ?? 0);
                  const when = formatUploadedRelative(video.createdAt, locale);
                  return (
                    <div
                      key={`${activeTab}-${video.id}`}
                      className={cn(
                        "relative group/card cursor-pointer",
                        editMode && selectedVideoIds.includes(video.id) && "scale-95 ring-2 ring-primary rounded-xl",
                      )}
                      onClick={
                        editMode
                          ? (e) => {
                              e.preventDefault();
                              if (!bulkAction) {
                                setShowBulkHint(true);
                                setTimeout(() => setShowBulkHint(false), 2000);
                                return;
                              }
                              setSelectedVideoIds((prev) =>
                                prev.includes(video.id) ? prev.filter((id) => id !== video.id) : [...prev, video.id],
                              );
                            }
                          : undefined
                      }
                    >
                      <Link
                        href={editMode ? "#" : `/watch/${video.id}`}
                        onClick={editMode ? (e) => e.preventDefault() : undefined}
                        className="group/card relative block cursor-pointer overflow-hidden rounded-xl border border-white/[0.08] transition-all duration-300 hover:scale-[1.03] hover:border-[#7F77DD]/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
                      >
                        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
                          <Image
                            src={thumb}
                            alt={video.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                            sizes="(max-width: 1024px) 50vw, 25vw"
                            unoptimized={thumb.startsWith("http")}
                          />

                          {/* 하단 그라데이션 */}
                          <div
                            className="absolute inset-x-0 bottom-0 z-[1]"
                            style={{
                              height: "85%",
                              background:
                                "linear-gradient(to top, rgba(8,6,24,1) 0%, rgba(8,6,24,0.95) 25%, rgba(8,6,24,0.6) 50%, transparent 100%)",
                              marginBottom: "-1px",
                            }}
                          />

                          {/* 수상 배지 */}
                          {video.award ? (
                            <div className="absolute left-2 top-2 z-[2] flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                              {video.award === "gold" && <Trophy className="h-3 w-3 text-yellow-400" />}
                              {video.award === "silver" && <Trophy className="h-3 w-3 text-slate-300" />}
                              {video.award === "bronze" && <Trophy className="h-3 w-3 text-amber-600" />}
                              {video.award === "special" && <Trophy className="h-3 w-3 text-purple-400" />}
                              {video.award === "genre_1st" && <Star className="h-3 w-3 text-yellow-400" />}
                              {video.award === "genre_2nd" && <Star className="h-3 w-3 text-slate-300" />}
                              {video.award === "genre_3rd" && <Star className="h-3 w-3 text-amber-600" />}
                              <span className="text-[10px] font-semibold text-white">
                                {video.award === "gold" && t("profile.awardGrandPrize")}
                                {video.award === "silver" && t("profile.awardRunnerUp")}
                                {video.award === "bronze" && t("profile.awardThirdPlace")}
                                {video.award === "special" && t("profile.awardSpecial")}
                                {video.award === "genre_1st" && t("profile.awardGenreFirst")}
                                {video.award === "genre_2nd" && t("profile.awardGenreSecond")}
                                {video.award === "genre_3rd" && t("profile.awardGenreThird")}
                              </span>
                            </div>
                          ) : null}

                          {/* 런타임 */}
                          {video.runtime ? (
                            <span className="absolute bottom-[44px] right-2 z-[2] rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                              {video.runtime}
                            </span>
                          ) : null}

                          {/* 호버 플레이 */}
                          <div className="absolute inset-0 z-[2] flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
                            <div className="relative flex items-center justify-center">
                              <img src="/genova-play1.png" alt="" className="h-[44px] w-[44px] object-contain opacity-50" aria-hidden />
                              <svg className="absolute h-[16px] w-[16px]" viewBox="0 0 24 24" fill="white" style={{ marginLeft: "1px" }} aria-hidden>
                                <polygon points="6,3 20,12 6,21" />
                              </svg>
                            </div>
                          </div>

                          {/* 하단 텍스트 */}
                          <div className="absolute bottom-0 left-0 right-0 z-[3] px-3 pb-2.5">
                            <h3 className="line-clamp-1 text-[13px] font-bold text-white">{video.title}</h3>
                            <div className="mt-0.5 flex items-center justify-between">
                              <p className="text-[11px] text-white/45">
                                {views} {t("profile.viewsSuffix")}
                              </p>
                              <p className="text-[11px] text-white/30">{when}</p>
                            </div>
                            {video.description ? (
                              <p className="mt-0.5 line-clamp-1 text-[11px] text-white/30">{video.description}</p>
                            ) : null}
                          </div>

                          {/* 편집 버튼 */}
                          {isOwner ? (
                            <button
                              type="button"
                              className="absolute top-2 right-2 z-[10] flex items-center gap-1 rounded-md border-0 bg-black/70 px-2 py-1 text-[10px] text-white/70 opacity-0 backdrop-blur-sm transition group-hover/card:opacity-100 hover:bg-black/90 hover:text-white"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/upload/edit/${video.id}`);
                              }}
                            >
                              <Pencil className="h-2.5 w-2.5" />
                              {t("profile.edit")}
                            </button>
                          ) : null}

                          {/* 선택 체크 */}
                          {isOwner && editMode && selectedVideoIds.includes(video.id) ? (
                            <div className="absolute inset-0 z-[4] rounded-xl bg-black/60 pointer-events-none" />
                          ) : null}
                          {isOwner && editMode && selectedVideoIds.includes(video.id) ? (
                            <div className="absolute top-3 left-3 z-[5] flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-lg">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          ) : null}
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
            {displayVideos.totalPages > 1 ? (
              <div className="w-full px-0">
                <div className="mt-8 flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage(1);
                      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
                    }}
                    disabled={currentPage === 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-all duration-200 hover:bg-white/5 hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary hover:shadow-md hover:shadow-purple-500/10 disabled:opacity-30"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
                    }}
                    disabled={currentPage === 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-all duration-200 hover:bg-white/5 hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary hover:shadow-md hover:shadow-purple-500/10 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    {getVisiblePages(currentPage, displayVideos.totalPages).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => {
                          setCurrentPage(page);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={cn(
                          "h-7 w-7 rounded-lg border text-xs transition-all duration-200",
                          currentPage === page
                            ? "border-primary bg-primary/20 font-medium text-primary shadow-md shadow-purple-500/20"
                            : "border-border bg-card text-foreground hover:bg-white/5 hover:border-primary/50 hover:text-primary hover:-translate-y-0.5 hover:shadow-md hover:shadow-purple-500/10",
                        )}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((p) => Math.min(displayVideos.totalPages, p + 1));
                      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
                    }}
                    disabled={currentPage === displayVideos.totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-all duration-200 hover:bg-white/5 hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary hover:shadow-md hover:shadow-purple-500/10 disabled:opacity-30"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage(displayVideos.totalPages);
                      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
                    }}
                    disabled={currentPage === displayVideos.totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-all duration-200 hover:bg-white/5 hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary hover:shadow-md hover:shadow-purple-500/10 disabled:opacity-30"
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : null}
        </div>
      </div>
      </div>
      </div>

      {isOwner && awardsModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-background p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{t("profile.chooseAchievements")}</h3>
              <button
                type="button"
                onClick={() => setAwardsModalOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
                aria-label={t("common.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[50vh] space-y-2 overflow-auto pr-1">
              {awardBadges.map((award) => {
                const checked = visibleAwardIds.includes(award.id);
                return (
                  <label
                    key={award.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 px-3 py-2 hover:bg-card/60"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setVisibleAwardIds((prev) =>
                          e.target.checked ? [...prev, award.id] : prev.filter((id) => id !== award.id),
                        );
                      }}
                    />
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      {renderAwardIcon(award)}
                    </span>
                    <span className="text-sm text-foreground">
                      {award.awardType} · {award.awardTier}
                    </span>
                  </label>
                );
              })}
              {awardBadges.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("profile.noTrophiesYet")}</p>
              ) : null}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setAwardsModalOpen(false)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                {t("settings.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
