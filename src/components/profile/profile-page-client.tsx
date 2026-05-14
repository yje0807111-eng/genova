"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useI18n } from "@/components/genova/language-provider";
import { useUploadModal } from "@/components/upload/upload-modal-context";
import { useEditModal } from "@/components/upload/edit-modal-context";
import {
  Bookmark,
  Check,
  ChevronDown,
  Film,
  Globe,
  Grid,
  Heart,
  Instagram,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trophy,
  UserCheck,
  UserPlus,
  X,
  Youtube,
} from "lucide-react";
import { followUserAction, unfollowUserAction } from "@/app/actions/profile";
import type { Profile } from "@/lib/queries/profile-queries";
import { ProfilePaginator } from "@/components/profile/profile-paginator";
import { ProfileSettingsModal } from "@/components/profile/profile-settings-modal";
import {
  ProfileAvatar,
  ProfileCoverBanner,
  ProfileHandleRow,
  ProfilePageGlow,
} from "@/components/profile/profile-static-header";

/**
 * Bulk-edit toolbar.  Lazy-loaded because only profile owners in
 * edit mode ever render it — most visits never need this code.
 */
const ProfileBulkToolbar = dynamic(
  () =>
    import("@/components/profile/profile-bulk-toolbar").then((m) => m.ProfileBulkToolbar),
  { ssr: false },
);
import type { Video } from "@/lib/types";
import { AnimateIn } from "@/components/animate-in";
import { addWindowCustomListener } from "@/lib/dom/window-custom-events";
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
  const { t } = useI18n();
  const links = [
    { href: websiteUrl, label: t("profile.socialWebsite"), icon: <Globe className="h-4 w-4" /> },
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

function ProfileVideoCard({ video, t, isOwner, onEdit }: { video: any; t: (key: string, fallback?: string) => string; isOwner?: boolean; onEdit?: (videoId: string) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const muxPid = video.mux_playback_id ?? video.muxPlaybackId;

  return (
    <Link
      href={`/watch/${video.id}`}
      className="group/card relative block overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-white/[0.02]">
        <img
          src={
            isHovered && muxPid
              ? `https://image.mux.com/${muxPid}/animated.gif?width=640&fps=15`
              : video.thumbnail_url ?? video.thumbnailUrl ?? ""
          }
          alt={video.title ?? ""}
          className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
        />

        {/* Bottom gradient */}
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-card-overlay)" }}
        />

        {/* Info overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="line-clamp-1 text-[13px] font-bold text-white">
            {video.title}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-white/55">
            {video.runtime && (
              <>
                <span className="tabular-nums">{video.runtime}</span>
                <span className="text-white/20">·</span>
              </>
            )}
            <span className="tabular-nums">
              {(video.view_count ?? video.viewCount ?? 0).toLocaleString()} {t("profile.viewsSuffix", "views")}
            </span>
            {typeof (video.like_count ?? video.likeCount) === "number" && (video.like_count ?? video.likeCount) > 0 && (
              <>
                <span className="text-white/20">·</span>
                <span className="inline-flex items-center gap-0.5 tabular-nums">
                  <Heart className="h-3 w-3" />
                  {(video.like_count ?? video.likeCount)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Border ring */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[0.06] transition group-hover/card:ring-white/15" />

        {isOwner && onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(video.id);
            }}
            title={t("profile.editVideo", "영상 편집")}
            className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.1] bg-[#0a0a0a]/80 text-white/70 opacity-0 backdrop-blur-md transition hover:bg-[#534AB7] hover:text-white group-hover/card:opacity-100"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Competition badge */}
        {video.purpose === "competition" && (
          <div className="absolute left-2 top-2">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
              {video.is_finalist ? "FINALIST" : t("profile.submission", "출품작")}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[18px] font-bold tabular-nums text-white md:text-[20px]">
        {value.toLocaleString()}
      </span>
      <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">
        {label}
      </span>
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
  works,
  competitionVideos,
  savedVideos,
  isOwner,
  showFollow,
  initialFollowing,
  profile,
  userEmail,
  hasPassword,
  authProvider,
}: {
  profileId: string;
  displayName: string;
  handle: string;
  headerIntro: string;
  headerToolsLine: string;
  bioFull: string;
  mainGenre: string | null;
  country: string | null;
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
  works: Video[];
  competitionVideos: CompetitionVideo[];
  savedVideos: Video[];
  isOwner: boolean;
  showFollow: boolean;
  initialFollowing: boolean;
  /** Owner-only props (settings modal).  Optional so non-owner routes
   *  (`/creator/[id]`) can omit them — the modal only mounts when
   *  `isOwner` is true, at which point these are always supplied by
   *  the `/profile/[id]` server page. */
  profile?: Profile;
  userEmail?: string | null;
  hasPassword?: boolean;
  authProvider?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { open: openUploadModal } = useUploadModal();
  const { open: openEditModal } = useEditModal();
  const [pending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);
  const [activeTab, setActiveTab] = useState<TabKey>("Videos");
  const [sortBy, setSortBy] = useState<"Newest" | "Oldest" | "Most Viewed">("Newest");
  const [editMode, setEditMode] = useState(false);
  const [bulkAction, setBulkAction] = useState<"private" | "public" | null>(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [showBulkHint, setShowBulkHint] = useState(false);
  const [localWorks, setLocalWorks] = useState<Video[]>(works);
  const [localCompetitionVideos, setLocalCompetitionVideos] = useState<CompetitionVideo[]>(competitionVideos);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const tabs = useMemo(() => {
    const base: TabKey[] = ["Videos", "Competition", "Series"];
    if (isOwner) base.push("Saved");
    return base;
  }, [isOwner]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, sortBy]);

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

    const arr = [...visibilityFiltered];
    arr.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      if (sortBy === "Most Viewed") {
        return (b.viewCount ?? 0) - (a.viewCount ?? 0);
      }
      return sortBy === "Newest" ? tb - ta : ta - tb;
    });
    return arr;
  }, [activeTab, sortBy, bulkAction, editMode, localWorks, localCompetitionVideos, savedVideos]);

  useEffect(() => {
    setLocalCompetitionVideos(competitionVideos);
  }, [competitionVideos]);

  const displayVideos = useMemo(() => {
    const totalPages = Math.ceil(sortedVideos.length / VIDEOS_PER_PAGE);
    const paginated = sortedVideos.slice((currentPage - 1) * VIDEOS_PER_PAGE, currentPage * VIDEOS_PER_PAGE);
    return { videos: paginated, totalPages };
  }, [sortedVideos, currentPage]);

  const totalVideoCount = useMemo(() => localWorks.length, [localWorks]);

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

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      <ProfilePageGlow />
      <div className="relative z-10">
      <div>
        <ProfileCoverBanner bannerUrl={bannerUrl} />

        <AnimateIn delay={0.05}>
        <div className="relative z-10 mx-auto w-full max-w-[800px] -mt-60 px-6 pb-2 sm:px-8 md:-mt-72">
          {/* Edit profile icon moved to name row */}
          <div className="flex flex-col items-center text-center">
            <ProfileAvatar avatarUrl={avatarUrl} displayName={displayName} />

            {/* Display name + collab badge + edit icon */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
              <h1 className="text-[22px] font-black tracking-tight text-white md:text-[28px]">
                {displayName}
              </h1>
              {/* 협업 가능 뱃지 제거됨 */}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  title={t("settings.editProfile", "Edit profile")}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-white/55 transition hover:border-[#7F77DD]/40 hover:text-white"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <ProfileHandleRow handle={handle} mainGenre={mainGenre} />

            {/* Bio */}
            {headerIntro ? (
              <p className="mt-2 max-w-[520px] text-[13px] leading-relaxed text-white/65">
                {expanded ? (bioFull || headerIntro) : headerIntro}
              </p>
            ) : null}

            {/* Show more/less */}
            {bioFull && bioFull.length > (headerIntro?.length ?? 0) && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-[#AFA9EC] transition hover:text-white"
              >
                {expanded ? t("profile.showLess", "Show less") : t("profile.showMore", "Show more")}
                <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
              </button>
            )}

            {/* Expanded details */}
            {expanded && (
              <div className="mt-4 flex flex-col items-center gap-3">
                {headerToolsLine && (
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {headerToolsLine.split(" · ").map((tool) => (
                      <span key={tool} className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-xs text-white/70">
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-white/50">
                  {country ? <span>📍 {country}</span> : null}
                  {joinedLabel ? <span>{joinedLabel}</span> : null}
                </div>
                <SocialLinks
                  websiteUrl={websiteUrl}
                  twitterUrl={twitterUrl}
                  instagramUrl={instagramUrl}
                  youtubeUrl={youtubeUrl}
                  tiktokUrl={tiktokUrl}
                  vimeoUrl={vimeoUrl}
                />
              </div>
            )}

            {/* CTA row — message/follow for non-owners */}
            {!isOwner && (
              <div className="mt-3 flex items-center justify-center gap-2">
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
                {showFollow && (
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
                )}
                <button
                  type="button"
                  className="rounded-lg border border-white/15 bg-white/5 p-2 transition hover:bg-white/10"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Stats row */}
            <div className="mt-4 flex items-center gap-5 md:gap-7">
              <Stat label={t("profile.videos", "Videos")} value={totalVideoCount} />
              <div className="h-8 w-px bg-white/[0.08]" />
              <Stat label={t("profile.followers", "Followers")} value={followersCount} />
              <div className="h-8 w-px bg-white/[0.08]" />
              <Stat label={t("profile.followingCountLabel", "Following")} value={followingCount} />
            </div>

            {/* Achievement showcase — removed for beta, restore later */}
          </div>
        </div>
        </AnimateIn>
      </div>

      {/* Tabs + grid */}
      <AnimateIn delay={0.1}>
      <div className="pb-12 pt-6">
        <div className="mx-auto min-w-0 w-full max-w-[1800px] px-6 sm:px-10 lg:px-14">
            <div className="flex items-center justify-between gap-6 py-3">
              <div className="flex items-center gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex min-w-[88px] items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition",
                      activeTab === tab
                        ? "border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        : "border border-transparent font-semibold text-white/45 hover:bg-white/[0.03] hover:text-white/80",
                    )}
                  >
                    {tab === "Videos" ? <Grid className="h-3.5 w-3.5" /> : null}
                    {tab === "Competition" ? <Trophy className="h-3.5 w-3.5" /> : null}
                    {tab === "Series" ? <Film className="h-3.5 w-3.5" /> : null}
                    {tab === "Saved" ? <Bookmark className="h-3.5 w-3.5" /> : null}
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
                    className="appearance-none rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 pr-8 text-[12px] font-semibold text-white/65 outline-none transition hover:border-white/[0.12] hover:text-white/85 focus:border-[#7F77DD]/40"
                  >
                    <option value="Newest">{t("profile.sortNewest")}</option>
                    <option value="Oldest">{t("profile.sortOldest")}</option>
                    <option value="Most Viewed">{t("profile.sortMostViewed")}</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/45" />
                </div>
                {isOwner ? (
                  <button
                    type="button"
                    onClick={() => setEditMode((prev) => !prev)}
                    className={cn(
                      "inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border transition",
                      editMode
                        ? "border-[#7F77DD]/40 bg-[#534AB7]/15 text-[#AFA9EC]"
                        : "border-white/[0.06] bg-white/[0.02] text-white/55 hover:border-white/[0.12] hover:text-white/85",
                    )}
                    aria-label={t("profile.toggleEditMode", "Toggle edit mode")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            {isOwner && editMode ? (
              <ProfileBulkToolbar
                bulkAction={bulkAction}
                setBulkAction={setBulkAction}
                selectedVideoIds={selectedVideoIds}
                setSelectedVideoIds={setSelectedVideoIds}
                showBulkHint={showBulkHint}
                bulkSaving={bulkSaving}
                setBulkSaving={setBulkSaving}
                setEditMode={setEditMode}
                displayedVideoIds={displayVideos.videos.map((v) => v.id)}
                setLocalWorks={setLocalWorks}
              />
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
                                  className="group/card relative shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/[0.08] transition-all duration-300 hover:scale-[1.03] hover:border-[#7F77DD]/40 w-[220px]"
                                >
                                  <div className="relative w-full overflow-hidden aspect-video">
                                    <img
                                      src={thumb}
                                      alt=""
                                      className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                                    />
                                    <div
                                      className="absolute inset-x-0 bottom-0 z-[1] h-[70%]"
                                      style={{
                                        background:
                                          "linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.8) 40%, transparent 100%)",
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
                                      <p className="text-[10px] text-white/35">
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
              <div className="mt-4 grid min-h-[700px] grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 content-start">
                {displayVideos.videos.length === 0 ? (
                  <div className="col-span-full flex min-h-[600px] flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-white/[0.06] py-20 text-center">
                    <Film className="h-12 w-12 text-white/15" />
                    <div className="space-y-1">
                      <p className="text-[15px] font-bold text-white/70">
                        {t("profile.noVideosYet", "아직 작품이 없습니다")}
                      </p>
                      {isOwner && (
                        <p className="text-[12px] text-white/35">
                          {t("profile.noVideosHint", "첫 작품을 업로드해보세요")}
                        </p>
                      )}
                    </div>
                    {isOwner ? (
                      <button
                        type="button"
                        onClick={() => openUploadModal()}
                        className="rounded-lg bg-[#534AB7] px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#6b5fd4]"
                      >
                        {t("upload.uploadTitle", "영상 업로드")}
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {displayVideos.videos.map((video) => (
                  <div
                    key={`${activeTab}-${video.id}`}
                    className={cn(
                      "relative",
                      editMode && selectedVideoIds.includes(video.id) && "scale-95 ring-2 ring-primary rounded-xl",
                      editMode && "[&_a]:pointer-events-none",
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
                    <ProfileVideoCard video={video} t={t} isOwner={isOwner} onEdit={openEditModal} />
                    {isOwner && editMode && selectedVideoIds.includes(video.id) ? (
                      <div className="absolute inset-0 z-[4] rounded-xl bg-black/60 pointer-events-none" />
                    ) : null}
                    {isOwner && editMode && selectedVideoIds.includes(video.id) ? (
                      <div className="absolute top-3 left-3 z-[5] flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-lg">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            <ProfilePaginator
              currentPage={currentPage}
              totalPages={displayVideos.totalPages}
              onPageChange={setCurrentPage}
            />
        </div>
      </div>
      </AnimateIn>

      {isOwner && profile ? (
        <ProfileSettingsModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          profile={profile}
          userEmail={userEmail ?? null}
          hasPassword={hasPassword ?? false}
          authProvider={authProvider ?? "email"}
          handle={handle}
        />
      ) : null}

      </div>
    </div>
  );
}
