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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  EyeOff,
  Film,
  Globe,
  Grid,
  Instagram,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Star,
  Trophy,
  UserCheck,
  UserPlus,
  X,
  Youtube,
} from "lucide-react";
import { followUserAction, unfollowUserAction } from "@/app/actions/profile";
import { updateVideoVisibilityAction } from "@/app/actions/video";
import type { FollowingPreviewUser, ProfileAwardBadge } from "@/lib/queries/profile-queries";
import type { Video } from "@/lib/types";
import { AnimateIn } from "@/components/animate-in";
import { addWindowCustomListener } from "@/lib/dom/window-custom-events";
import { formatUploadedRelative } from "@/lib/format-uploaded-relative";
import { formatViewCountShort } from "@/lib/view-count";
import { cn } from "@/lib/utils/cn";

type TabKey = "Videos" | "Competition" | "Series" | "Saved";
type CompetitionMeta = {
  id: string;
  title: string;
  title_ko?: string | null;
  title_en?: string | null;
  title_ja?: string | null;
  status?: string | null;
};
type CompetitionVideo = Video & {
  competitions?: CompetitionMeta | null;
};
const VIDEOS_PER_PAGE = 32;
const GENRE_LABEL: Record<string, string> = {
  film: "Filmmaker",
  animation: "Animator",
  music: "Music Video",
  documentary: "Documentary",
  horror: "Horror",
  sci_fi: "Sci-Fi",
  art: "Art",
  daily: "Daily",
};

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

function SocialLinks({
  websiteUrl,
  twitterUrl,
  instagramUrl,
  youtubeUrl,
  tiktokUrl,
  vimeoUrl,
}: {
  websiteUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  vimeoUrl: string | null;
}) {
  const links = [
    { href: websiteUrl, label: "Website", icon: <Globe className="h-4 w-4" /> },
    { href: twitterUrl, label: "X", icon: <X className="h-4 w-4" /> },
    { href: instagramUrl, label: "Instagram", icon: <Instagram className="h-4 w-4" /> },
    { href: youtubeUrl, label: "YouTube", icon: <Youtube className="h-4 w-4" /> },
    {
      href: tiktokUrl,
      label: "TikTok",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
        </svg>
      ),
    },
    {
      href: vimeoUrl,
      label: "Vimeo",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.53 3.67-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.38-.51 1.07-.78 4.18-1.82 6.97-3.02 8.37-3.6 3.98-1.66 4.81-1.95 5.35-1.96.12 0 .38.03.55.17.14.12.18.28.2.45-.02.07-.02.13-.02.22z" />
        </svg>
      ),
    },
  ].filter((item) => Boolean(item.href?.trim()));

  if (!links.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((item) => (
        <a
          key={item.label}
          href={item.href ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-white/[0.08] p-1.5 text-white/55 transition hover:border-[#7F77DD]/40 hover:text-white"
          aria-label={item.label}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}

export function GenovaProfileClient({
  profileId,
  displayName,
  handle,
  headerIntro,
  headerToolsLine,
  bioFull,
  mainGenre,
  country,
  availableForCollab,
  tagline,
  pronouns,
  websiteUrl,
  twitterUrl,
  instagramUrl,
  youtubeUrl,
  tiktokUrl,
  vimeoUrl,
  avatarUrl,
  bannerUrl,
  joinedLabel,
  followersCount,
  followingCount,
  videoCount,
  works,
  finalistVideos,
  competitionVideos,
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
  mainGenre: string | null;
  country: string | null;
  availableForCollab: boolean;
  tagline: string | null;
  pronouns: string | null;
  websiteUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  vimeoUrl: string | null;
  avatarUrl: string;
  bannerUrl: string | null;
  joinedLabel: string | null;
  followersCount: number;
  followingCount: number;
  videoCount: number;
  works: Video[];
  finalistVideos: Video[];
  competitionVideos: CompetitionVideo[];
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
  const [localCompetitionVideos, setLocalCompetitionVideos] = useState<CompetitionVideo[]>(competitionVideos);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeAwardFilter, setActiveAwardFilter] = useState<string | null>(null);
  const [awardsModalOpen, setAwardsModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [visibleAwardIds, setVisibleAwardIds] = useState<string[]>([]);

  const tabs = useMemo(() => {
    const base: TabKey[] = ["Videos", "Competition", "Series"];
    if (isOwner) base.push("Saved");
    return base;
  }, [isOwner]);

  const listVideos =
    activeTab === "Videos"
      ? localWorks
      : activeTab === "Competition"
        ? localCompetitionVideos
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
          ? localCompetitionVideos
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
  }, [activeTab, sortBy, activeAwardFilter, bulkAction, editMode, localWorks, localCompetitionVideos, savedVideos]);

  useEffect(() => {
    setLocalCompetitionVideos(competitionVideos);
  }, [competitionVideos]);

  const displayVideos = useMemo(() => {
    const totalPages = Math.ceil(sortedVideos.length / VIDEOS_PER_PAGE);
    const paginated = sortedVideos.slice((currentPage - 1) * VIDEOS_PER_PAGE, currentPage * VIDEOS_PER_PAGE);
    return { videos: paginated, totalPages };
  }, [sortedVideos, currentPage]);

  const totalVideoCount = useMemo(() => localWorks.length, [localWorks]);

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
      <svg width="36" height="36" viewBox="0 0 36 36" className="h-11 w-11" aria-hidden>
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}-${rank}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle cx="18" cy="16" r="11" fill={`url(#grad-${color.replace("#", "")}-${rank})`} />
        <circle cx="18" cy="16" r="11" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.5" />
        <text x="18" y="20" textAnchor="middle" fontSize="11" fontWeight="800" fill="white">
          {rank}
        </text>
        <rect x="14" y="27" width="8" height="2" rx="1" fill={color} opacity="0.4" />
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
    const id = cupColor.replace("#", "") + (gemColor?.replace("#", "") ?? "") + (showStar ? "s" : "");
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" className="h-11 w-11" aria-hidden>
        <defs>
          <linearGradient id={`cup-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cupColor} stopOpacity="1" />
            <stop offset="100%" stopColor={cupColor} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path d="M11 5h14v9q0 7-7 9q-7-2-7-9z" fill={`url(#cup-${id})`} />
        <path d="M11 7q-4 0-4 4q0 4 4 5" fill="none" stroke={cupColor} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M25 7q4 0 4 4q0 4-4 5" fill="none" stroke={cupColor} strokeWidth="1.5" strokeLinecap="round" />
        <rect x="14" y="24" width="8" height="2.5" rx="1" fill={cupColor} opacity="0.7" />
        <rect x="11" y="27" width="14" height="2" rx="1" fill={cupColor} opacity="0.5" />
        {gemColor ? <circle cx="18" cy="11" r="2" fill={gemColor} opacity="0.95" /> : null}
        {showStar ? (
          <path d="M18 8l1.2 2.4 2.6.4-1.9 1.8.45 2.6L18 14l-2.35 1.2.45-2.6L14.2 10.8l2.6-.4z" fill="white" opacity="0.85" />
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

  const totalAwardCount = useMemo(() => works.filter((v) => v.award !== null).length, [works]);
  const getCount = (type: ProfileAwardBadge["awardType"], tier: ProfileAwardBadge["awardTier"]) =>
    awardBadges.filter((a) => a.awardType === type && a.awardTier === tier).length;
  const achievementItems = [
    { id: "weekly-gold", awardType: "weekly" as const, awardTier: "gold" as const, count: getCount("weekly", "gold"), tooltip: "Genre Award · 1st" },
    { id: "weekly-silver", awardType: "weekly" as const, awardTier: "silver" as const, count: getCount("weekly", "silver"), tooltip: "Genre Award · 2nd" },
    { id: "weekly-bronze", awardType: "weekly" as const, awardTier: "bronze" as const, count: getCount("weekly", "bronze"), tooltip: "Genre Award · 3rd" },
    { id: "competition-1", awardType: "competition" as const, awardTier: "1" as const, count: getCount("competition", "1"), tooltip: "Competition · Grand Prize" },
    { id: "competition-2", awardType: "competition" as const, awardTier: "2" as const, count: getCount("competition", "2"), tooltip: "Competition · Runner-up" },
    { id: "competition-3", awardType: "competition" as const, awardTier: "3" as const, count: getCount("competition", "3"), tooltip: "Competition · 3rd Place" },
    { id: "competition-4-10", awardType: "competition" as const, awardTier: "4-10" as const, count: getCount("competition", "4-10"), tooltip: "Competition · Top 10" },
  ].filter((item) => item.count > 0);
  const sortedAwards = useMemo(() => {
    const order: Record<string, number> = {
      "competition-1": 1,
      "competition-2": 2,
      "competition-3": 3,
      "competition-4-10": 4,
      "weekly-gold": 5,
      "weekly-silver": 6,
      "weekly-bronze": 7,
    };
    return [...achievementItems].sort(
      (a, b) => (order[`${a.awardType}-${a.awardTier}`] ?? 99) - (order[`${b.awardType}-${b.awardTier}`] ?? 99),
    );
  }, [achievementItems]);
  useEffect(() => {
    if (visibleAwardIds.length === 0 && sortedAwards.length > 0) {
      setVisibleAwardIds(sortedAwards.map((a) => a.id));
    }
  }, [sortedAwards, visibleAwardIds.length]);
  const visibleAwards = useMemo(
    () => sortedAwards.filter((a) => visibleAwardIds.includes(a.id)),
    [sortedAwards, visibleAwardIds],
  );
  const awardLabel = (a: ProfileAwardBadge): string => {
    if (a.awardType === "competition") {
      if (a.awardTier === "1") return "Grand Prize";
      if (a.awardTier === "2") return "Runner-up";
      if (a.awardTier === "3") return "3rd Place";
      if (a.awardTier === "4-10") return "Special Award";
    }
    if (a.awardType === "weekly") {
      if (a.awardTier === "gold") return "Weekly Gold";
      if (a.awardTier === "silver") return "Weekly Silver";
      if (a.awardTier === "bronze") return "Weekly Bronze";
    }
    return "";
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, rgba(83,74,183,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(127,119,221,0.05) 0%, transparent 50%)",
        }}
      />
      <div className="relative z-10">
      <div>
        {/* 커버 배너 */}
        <div className="relative">
          <div
            className="relative h-[200px] w-full overflow-hidden md:h-[420px]"
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
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-[#080618]/60 via-transparent to-transparent" />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%]"
              style={{
                background: "linear-gradient(to bottom, transparent 0%, rgba(8,6,24,0.6) 50%, #080618 100%)",
              }}
            />

            <div className="absolute right-3 top-16 z-20 md:right-6 md:top-20">
              {isOwner ? null : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("open-message", {
                          detail: {
                            userId: profileId,
                            displayName: displayName,
                            avatarUrl: avatarUrl,
                          },
                        }),
                      );
                    }}
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

        <AnimateIn delay={0.05}>
        <div className="relative z-10 mx-auto w-full max-w-[1280px] -mt-40 px-6 pb-6 sm:px-12 md:-mt-48">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
            {/* 좌측: 프로필 + Stats */}
            <div className="relative min-w-0 rounded-xl border border-white/10 bg-[#080618]/40 p-6 backdrop-blur-xl transition-all duration-500 hover:border-[#7F77DD]/25 hover:shadow-[0_0_40px_rgba(127,119,221,0.15)] md:p-8">
              {isOwner ? (
                <Link
                  href="/profile/settings"
                  className="absolute right-3 top-3 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-md transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  {t("settings.editProfile", "Edit profile")}
                </Link>
              ) : null}
              <div className="flex flex-row items-center justify-between gap-5">
                <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:gap-10 md:text-left">
                  <div className="relative">
                    <div className="h-36 w-36 overflow-hidden rounded-full ring-1 ring-white/10">
                      <Image
                        src={avatarUrl}
                        alt={displayName}
                        width={144}
                        height={144}
                        className="h-full w-full object-cover"
                        unoptimized={avatarUrl.startsWith("http")}
                      />
                    </div>
                    {isOwner ? (
                      <Link
                        href="/profile/settings"
                        className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/70 backdrop-blur-md transition hover:border-white/20 hover:bg-black/70"
                        aria-label={t("settings.editProfile", "Edit profile")}
                      >
                        <Pencil className="h-3 w-3" />
                      </Link>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                      <h1 className="text-2xl font-bold text-white md:text-3xl">{displayName}</h1>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3">
                      <p className="text-sm text-white/50">@{handle}</p>
                      {mainGenre ? (
                        <span className="inline-flex rounded-md border border-[#7F77DD]/30 bg-[#534AB7]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#AFA9EC]">
                          {GENRE_LABEL[mainGenre] ?? mainGenre}
                        </span>
                      ) : null}
                    </div>
                    {headerIntro ? <p className="mt-4 line-clamp-1 text-sm text-white/70">{headerIntro}</p> : null}
                    <div className="mt-4 inline-flex items-center gap-2">
                      {availableForCollab ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Open to collaborate
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setExpanded((prev) => !prev)}
                        className="inline-flex items-center gap-1 text-xs text-white/50 transition hover:text-white"
                      >
                        {expanded ? "Show less" : "Show more"}
                        <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className="relative overflow-hidden rounded-xl border border-white/[0.06] px-8 py-6"
                  style={{
                    background:
                      "radial-gradient(ellipse 100% 80% at 50% 100%, rgba(83,74,183,0.25) 0%, transparent 60%), rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="flex items-center gap-10 md:gap-12">
                    <div className="flex flex-col items-center">
                      <p className="text-2xl font-bold leading-none tabular-nums text-white">
                      {totalVideoCount}
                    </p>
                      <p className="mt-2 text-xs text-white/40">{t("profile.videos", "Videos")}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-2xl font-bold leading-none tabular-nums text-white">
                      {followersCount}
                    </p>
                      <p className="mt-2 text-xs text-white/40">{t("profile.followers", "Followers")}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-2xl font-bold leading-none tabular-nums text-white">
                      {followingCount}
                    </p>
                      <p className="mt-2 text-xs text-white/40">{t("profile.followingCountLabel")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {expanded ? (
                <div className="mt-6 space-y-5 border-t border-white/[0.06] pt-6">
                  {headerToolsLine ? (
                    <div>
                      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-white/40">AI Tools</p>
                      <div className="flex flex-wrap gap-1.5">
                        {headerToolsLine.split(" · ").map((tool) => (
                          <span
                            key={tool}
                            className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-xs text-white/70"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                    {country ? <span>📍 {country}</span> : null}
                    {joinedLabel ? <span>{joinedLabel}</span> : null}
                  </div>

                  {bioFull && bioFull.length > headerIntro.length ? (
                    <p className="whitespace-pre-wrap text-sm text-white/70">{bioFull}</p>
                  ) : null}

                  <SocialLinks
                    websiteUrl={websiteUrl}
                    twitterUrl={twitterUrl}
                    instagramUrl={instagramUrl}
                    youtubeUrl={youtubeUrl}
                    tiktokUrl={tiktokUrl}
                    vimeoUrl={vimeoUrl}
                  />
                </div>
              ) : null}
            </div>

            {/* 우측: Achievements */}
            {awardBadges.length > 0 || isOwner ? (
              <div className="shrink-0 rounded-xl border border-white/10 bg-[#080618]/40 p-5 backdrop-blur-xl transition-all duration-500 hover:border-[#7F77DD]/25 hover:shadow-[0_0_40px_rgba(127,119,221,0.15)] md:p-6 lg:w-[300px]">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-white/50">
                    {t("profile.achievements", "Achievements")}
                  </p>
                  <span className="text-xs text-white/40">{visibleAwards.length} earned</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {visibleAwards.map((item) => (
                    <div
                      key={item.id}
                      className="group relative flex flex-col items-center"
                    >
                      <span className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-black/90 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                        {awardLabel({
                          id: item.id,
                          awardType: item.awardType,
                          awardTier: item.awardTier,
                          createdAt: "",
                        })}
                      </span>
                      <div className="transition-transform duration-200 group-hover:scale-110 group-hover:drop-shadow-[0_0_14px_rgba(127,119,221,0.35)]">
                        {renderAwardIcon({
                          id: item.id,
                          awardType: item.awardType,
                          awardTier: item.awardTier,
                          createdAt: "",
                        })}
                      </div>
                      <span className="text-xs font-semibold text-white/70">x{item.count}</span>
                    </div>
                  ))}
                  {(visibleAwards.length < sortedAwards.length || isOwner) && (
                    <button
                      type="button"
                      onClick={() => setAwardsModalOpen(true)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-white/15 text-white/40 transition hover:border-[#7F77DD]/50 hover:text-[#7F77DD]"
                      aria-label={t("profile.customize", "Customize")}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        </AnimateIn>
      </div>

      {/* Tabs + grid */}
      <AnimateIn delay={0.1}>
      <div className="pb-12 pt-6">
        <div className="mx-auto min-w-0 w-full max-w-[1280px] px-6 sm:px-12">
            <div className="flex flex-col gap-3 border-b border-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                      activeTab === tab
                        ? "bg-white/[0.05] text-white shadow-[0_2px_8px_rgba(127,119,221,0.4)]"
                        : "text-white/40 hover:text-white/70",
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
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      const v = e.target.value as "Newest" | "Oldest" | "Most Viewed";
                      setSortBy(v);
                    }}
                    className="appearance-none rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 pr-9 text-sm text-white/80 outline-none transition hover:border-white/15 focus:border-[#7F77DD]/40"
                  >
                    <option value="Newest">Newest</option>
                    <option value="Oldest">Oldest</option>
                    <option value="Most Viewed">Most viewed</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                </div>
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
              <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                {displayVideos.videos.length === 0 ? (
                  <div className="col-span-4 mt-12 flex flex-col items-center justify-center gap-4 text-center">
                    <Film className="h-16 w-16 text-white/15" />
                    <p className="text-sm text-white/40">
                      {activeAwardFilter ? t("profile.noVideosForAward") : t("profile.noVideosYet", "No videos yet.")}
                    </p>
                    {isOwner ? (
                      <Link
                        href="/upload"
                        className="rounded-lg bg-[#534AB7] px-4 py-2 text-sm text-white transition hover:bg-[#7F77DD]"
                      >
                        {t("upload.uploadTitle", "Upload video")}
                      </Link>
                    ) : null}
                  </div>
                ) : null}
                {displayVideos.videos.map((video) => {
                  const thumb =
                    video.thumbnailUrl?.trim() ||
                    `https://picsum.photos/seed/${encodeURIComponent(video.id)}/400/225`;
                  const views = formatViewCountShort(video.viewCount ?? 0);
                  const when = formatUploadedRelative(video.createdAt, locale);
                  const competitionVideo = video as CompetitionVideo;
                  const competitionTitle =
                    locale === "ko"
                      ? competitionVideo.competitions?.title_ko || competitionVideo.competitions?.title
                      : locale === "ja"
                        ? competitionVideo.competitions?.title_ja || competitionVideo.competitions?.title
                        : competitionVideo.competitions?.title_en || competitionVideo.competitions?.title;
                  return (
                    <div
                      key={`${activeTab}-${video.id}`}
                      className={cn(
                        "relative cursor-pointer",
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
                        className="group/card block cursor-pointer rounded-xl border border-white/[0.08] transition duration-300 hover:scale-[1.02] hover:border-[#7F77DD]/60 hover:shadow-[0_0_40px_rgba(127,119,221,0.4)]"
                      >
                        <div
                          className="relative w-full overflow-hidden rounded-xl ring-1 ring-transparent transition group-hover/card:ring-[#7F77DD]/30"
                          style={{ aspectRatio: "16/9" }}
                        >
                          <Image
                            src={thumb}
                            alt={video.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                            sizes="(max-width: 1024px) 50vw, 25vw"
                            unoptimized={thumb.startsWith("http")}
                          />

                          <div
                            className="pointer-events-none absolute -right-16 top-1/2 z-[1] h-48 w-48 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-700 group-hover/card:opacity-100"
                            style={{
                              background: "radial-gradient(circle, rgba(127,119,221,0.25) 0%, transparent 70%)",
                              filter: "blur(40px)",
                            }}
                          />

                          <div className="absolute inset-0 z-[1] bg-black/0 transition group-hover/card:bg-black/20" />

                          {activeTab === "Competition" && competitionTitle ? (
                            <div className="absolute left-2 top-2 z-[3]">
                              <span className="rounded-full border border-[#7F77DD]/30 bg-[#7F77DD]/20 px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#AFA9EC] backdrop-blur-md">
                                ✦ {competitionTitle}
                              </span>
                            </div>
                          ) : null}

                          {/* 수상 배지 */}
                          {video.award ? (
                            <div
                              title={
                                video.award === "gold"
                                  ? t("profile.awardGrandPrize")
                                  : video.award === "silver"
                                    ? t("profile.awardRunnerUp")
                                    : video.award === "bronze"
                                      ? t("profile.awardThirdPlace")
                                      : video.award === "special"
                                        ? t("profile.awardSpecial")
                                        : video.award === "genre_1st"
                                          ? t("profile.awardGenreFirst")
                                          : video.award === "genre_2nd"
                                            ? t("profile.awardGenreSecond")
                                            : t("profile.awardGenreThird")
                              }
                              className="absolute left-2 top-2 z-[3] rounded-full border border-white/10 bg-black/60 p-1.5 backdrop-blur-md"
                            >
                              {video.award === "gold" && <Trophy className="h-4 w-4 text-yellow-400" />}
                              {video.award === "silver" && <Trophy className="h-4 w-4 text-slate-300" />}
                              {video.award === "bronze" && <Trophy className="h-4 w-4 text-amber-600" />}
                              {video.award === "special" && <Trophy className="h-4 w-4 text-purple-400" />}
                              {video.award === "genre_1st" && <Star className="h-4 w-4 text-yellow-400" />}
                              {video.award === "genre_2nd" && <Star className="h-4 w-4 text-slate-300" />}
                              {video.award === "genre_3rd" && <Star className="h-4 w-4 text-amber-600" />}
                            </div>
                          ) : null}

                          {/* 호버 플레이 */}
                          <div className="absolute inset-0 z-[3] flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
                              <Play className="h-5 w-5 text-white" />
                            </div>
                          </div>

                          {/* 편집 버튼 */}
                          {isOwner ? (
                            <button
                              type="button"
                              className="absolute right-2 top-2 z-[10] flex items-center gap-1 rounded-md border border-white/15 bg-black/65 px-2 py-1 text-[10px] text-white/70 opacity-0 backdrop-blur-sm transition group-hover/card:opacity-100 hover:bg-black/85 hover:text-white"
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
                        <div className="px-2.5 pt-2.5">
                          <h3 className="line-clamp-1 text-sm font-semibold text-white">{video.title}</h3>
                          <div className="mt-1 flex items-center gap-2 text-xs text-white/40">
                            {video.runtime ? <span>{video.runtime}</span> : null}
                            {video.runtime ? <span>·</span> : null}
                            <span>
                              {views} {t("profile.viewsSuffix")}
                            </span>
                            <span>·</span>
                            <span>{when}</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
            {displayVideos.totalPages > 1 ? (
              <div className="w-full px-0">
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage(1);
                      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
                    }}
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/50 transition hover:border-white/15 hover:bg-white/[0.05] hover:text-white disabled:opacity-30"
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
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/50 transition hover:border-white/15 hover:bg-white/[0.05] hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex items-center gap-2">
                    {getVisiblePages(currentPage, displayVideos.totalPages).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => {
                          setCurrentPage(page);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={cn(
                          "h-8 w-8 rounded-lg border text-xs transition",
                          currentPage === page
                            ? "border-[#534AB7]/40 bg-[#534AB7]/20 font-medium text-[#AFA9EC]"
                            : "border-white/[0.08] bg-white/[0.02] text-white/50 hover:border-white/15 hover:bg-white/[0.05] hover:text-white",
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
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/50 transition hover:border-white/15 hover:bg-white/[0.05] hover:text-white disabled:opacity-30"
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
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/50 transition hover:border-white/15 hover:bg-white/[0.05] hover:text-white disabled:opacity-30"
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : null}
        </div>
      </div>
      </AnimateIn>

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
              {sortedAwards.map((award) => {
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
                      {renderAwardIcon(award as unknown as Parameters<typeof renderAwardIcon>[0])}
                    </span>
                    <span className="text-sm text-foreground">
                      {awardLabel(award as unknown as Parameters<typeof awardLabel>[0])}
                    </span>
                  </label>
                );
              })}
              {sortedAwards.length === 0 ? (
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
    </div>
  );
}
