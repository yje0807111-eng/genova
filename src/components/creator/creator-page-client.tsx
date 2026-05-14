"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Grid, MessageCircle, Star, Trophy, UserCheck, UserPlus, X } from "lucide-react";
import { followUserAction, unfollowUserAction } from "@/app/actions/profile";
import { useI18n } from "@/components/genova/language-provider";
import { formatUploadedRelative } from "@/lib/format-uploaded-relative";
import { formatViewCountShort } from "@/lib/view-count";
import { addWindowCustomListener } from "@/lib/dom/window-custom-events";
import type { Creator, Video } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const VIDEOS_PER_PAGE = 32;

function toHandle(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "");
}

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

export function CreatorPageClient({
  creator,
  works,
  finalistVideos,
  currentUserId,
}: {
  creator: Creator;
  works: Video[];
  finalistVideos: Video[];
  currentUserId: string | null;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"Videos" | "Competition">("Videos");
  const [sortBy, setSortBy] = useState<"Newest" | "Oldest" | "Most Viewed">("Newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeAwardFilter, setActiveAwardFilter] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(creator.followerCount ?? 0);
  const [showFollowToast, setShowFollowToast] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [pending, startTransition] = useTransition();
  const showFollow = Boolean(currentUserId);
  const isOwner = Boolean(currentUserId && currentUserId === creator.id);
  const listVideos = activeTab === "Videos" ? works : finalistVideos;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("profile-owner-status", { detail: false }));
    return () => {
      window.dispatchEvent(new CustomEvent("profile-owner-status", { detail: false }));
    };
  }, []);

  useEffect(() => {
    return addWindowCustomListener<string>("profile-tab-change", (tab) => {
      if (tab === "videos") {
        setActiveTab("Videos");
        setCurrentPage(1);
      } else if (tab === "competition") {
        setActiveTab("Competition");
        setCurrentPage(1);
      }
    });
  }, []);
  const allPaddedForCounts = useMemo(() => [...works, ...finalistVideos], [works, finalistVideos]);

  useEffect(() => {
    setActiveAwardFilter(null);
    setCurrentPage(1);
  }, [activeTab]);

  const sortedVideos = useMemo(() => {
    const real = [...listVideos];
    real.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      if (sortBy === "Most Viewed") return (b.viewCount ?? 0) - (a.viewCount ?? 0);
      return sortBy === "Newest" ? tb - ta : ta - tb;
    });
    const filtered =
      activeAwardFilter === "all"
        ? real.filter((v) => v.award !== null)
        : activeAwardFilter
          ? real.filter((v) => v.award === activeAwardFilter)
          : real;
    return filtered;
  }, [listVideos, sortBy, activeAwardFilter]);

  const paged = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(sortedVideos.length / VIDEOS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const videos = sortedVideos.slice((safePage - 1) * VIDEOS_PER_PAGE, safePage * VIDEOS_PER_PAGE);
    return { videos, totalPages, safePage };
  }, [sortedVideos, currentPage]);

  const handle = toHandle(creator.name || "creator");
  const toolsLine = useMemo(() => {
    const tools = Array.from(
      new Set([...works.flatMap((v) => v.aiTools ?? []), ...finalistVideos.flatMap((v) => v.aiTools ?? [])].filter(Boolean)),
    );

    if (tools.length > 0) return tools.slice(0, 5).join(" · ");
    return "";
  }, [works, finalistVideos]);

  const hasAwardCounts = useMemo(
    () => allPaddedForCounts.some((v) => v.award !== null),
    [allPaddedForCounts],
  );

  const awardFilterLabel = (filter: string | null) => {
    if (filter === "all") return "🏆 " + t("profile.allAwards");
    if (filter === "gold") return "🏆 " + t("profile.awardGrandPrize");
    if (filter === "silver") return "🏆 " + t("profile.awardRunnerUp");
    if (filter === "bronze") return "🏆 " + t("profile.awardThirdPlace");
    if (filter === "special") return "🏆 " + t("profile.awardSpecial");
    if (filter === "genre_1st") return "⭐ " + t("profile.awardGenreFirst");
    if (filter === "genre_2nd") return "⭐ " + t("profile.awardGenreSecond");
    if (filter === "genre_3rd") return "⭐ " + t("profile.awardGenreThird");
    return filter ?? "";
  };

  const onFollowToggle = () => {
    if (following) {
      setShowUnfollowModal(true);
      return;
    }
    startTransition(async () => {
      const res = await followUserAction(creator.id);
      if (!res.ok) {
        alert(res.message);
        return;
      }
      setFollowing(true);
      setFollowersCount((prev: number) => prev + 1);
      setShowFollowToast(true);
      setTimeout(() => setShowFollowToast(false), 2500);
      router.refresh();
    });
  };

  const onConfirmUnfollow = () => {
    startTransition(async () => {
      const res = await unfollowUserAction(creator.id);
      if (!res.ok) {
        alert(res.message);
        return;
      }
      setFollowing(false);
      setFollowersCount((prev: number) => Math.max(0, prev - 1));
      setShowUnfollowModal(false);
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1100px] px-8">
        <div className="relative z-10 flex items-start gap-8 pb-6 pt-12">
          <div className="z-10 shrink-0">
            <div className="h-32 w-32 overflow-hidden rounded-full border-[3px] border-purple-500/30 shadow-lg shadow-purple-500/20">
              <Image src={creator.avatarUrl} alt={creator.name} width={128} height={128} className="h-full w-full object-cover" />
            </div>
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{creator.name}</h1>
              {creator.isPartner ? (
                <span className="rounded-full border border-purple-500/30 bg-purple-900/50 px-3 py-1 text-xs text-purple-300">
                  {t("profile.genovaOriginalPartner")}
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span>@{handle || "creator"}</span>
              <span>·</span>
              <span>{t("creator.followersCount").replace("{n}", String(followersCount))}</span>
              <span>·</span>
              <span>{t("creator.videosCount").replace("{n}", String(works.length))}</span>
            </div>
            {creator.bio ? <p className="mt-1 whitespace-pre-wrap text-base text-foreground">{creator.bio}</p> : null}
            {toolsLine ? <p className="mt-0.5 text-xs text-muted-foreground/40">{toolsLine}</p> : null}
          </div>

          {!isOwner ? (
            <div className="shrink-0 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("open-message", {
                        detail: {
                          userId: creator.id,
                          displayName: creator.name,
                          avatarUrl: creator.avatarUrl,
                        },
                      }),
                    );
                  }}
                  className="group relative flex items-center gap-2 overflow-hidden rounded-lg border border-border bg-card px-4 py-2 text-sm transition-all duration-200 hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95"
                >
                  <MessageCircle className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                  <span>{t("profile.message")}</span>
                  {/* Ripple shine effect on hover */}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                </button>
                {showFollow ? (
                  <button
                    type="button"
                    onClick={onFollowToggle}
                    disabled={pending}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition disabled:opacity-60",
                      following
                        ? "border border-border bg-card hover:bg-white/5 text-foreground"
                        : "bg-primary text-white hover:bg-primary/90",
                    )}
                  >
                    {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {following ? t("profile.following") : t("profile.follow")}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/[0.06] py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
            {t("profile.achievements")}
          </p>
          {hasAwardCounts ? (
            <div className="flex items-center gap-4">
              {[
                { tier: "gold", color: "#FFD700", tooltip: t("profile.tooltipCompetitionGrandPrize") },
                { tier: "silver", color: "#C0C0C0", tooltip: t("profile.tooltipCompetitionRunnerUp") },
                { tier: "bronze", color: "#CD7F32", tooltip: t("profile.tooltipCompetitionThird") },
                { tier: "special", color: "#7F77DD", tooltip: t("profile.tooltipCompetitionSpecial") },
              ].map((award) => {
                const count = allPaddedForCounts.filter((v) => v.award === award.tier).length;
                return (
                  <div
                    key={award.tier}
                    className={cn(
                      "group relative flex-shrink-0",
                      count === 0 ? "opacity-40" : "cursor-pointer transition-transform duration-200 hover:scale-125",
                    )}
                    onClick={count > 0 ? () => {
                      setActiveAwardFilter(award.tier);
                      setCurrentPage(1);
                    } : undefined}
                    title={award.tooltip}
                  >
                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {award.tooltip}
                    </span>
                    <Trophy
                      className="h-6 w-6"
                      style={{ color: count === 0 ? "#3a3a3a" : award.color }}
                    />
                    <div
                      className={cn(
                        "absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background text-[9px] font-bold",
                        count > 0 ? "border border-white/20 text-white" : "border border-white/5 text-neutral-600",
                      )}
                    >
                      x{count}
                    </div>
                  </div>
                );
              })}

              <div className="mx-4 h-8 self-center border-l border-neutral-700" aria-hidden />

              {[
                { place: "1st", awardKey: "genre_1st", color: "#FFD700", tooltip: t("profile.tooltipGenreFirst") },
                { place: "2nd", awardKey: "genre_2nd", color: "#C0C0C0", tooltip: t("profile.tooltipGenreSecond") },
                { place: "3rd", awardKey: "genre_3rd", color: "#CD7F32", tooltip: t("profile.tooltipGenreThird") },
              ].map((award) => {
                const count = allPaddedForCounts.filter((v) => v.award === award.awardKey).length;
                return (
                  <div
                    key={award.place}
                    className={cn(
                      "group relative flex-shrink-0",
                      count === 0 ? "opacity-40" : "cursor-pointer transition-transform duration-200 hover:scale-125",
                    )}
                    onClick={count > 0 ? () => {
                      setActiveAwardFilter(award.awardKey);
                      setCurrentPage(1);
                    } : undefined}
                    title={award.tooltip}
                  >
                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {award.tooltip}
                    </span>
                    <Star
                      className="h-6 w-6"
                      style={{ color: count === 0 ? "#3a3a3a" : award.color }}
                    />
                    <div
                      className={cn(
                        "absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background text-[9px] font-bold",
                        count > 0 ? "border border-white/20 text-white" : "border border-white/5 text-neutral-600",
                      )}
                    >
                      x{count}
                    </div>
                  </div>
                );
              })}
              {(() => {
                const totalAwardCount = allPaddedForCounts.filter((v) => v.award !== null).length;
                return totalAwardCount > 0 ? (
                  <div
                    className={cn(
                      "group relative flex-shrink-0 ml-2 cursor-pointer transition-transform duration-200 hover:scale-110",
                    )}
                    onClick={() => {
                      setActiveAwardFilter("all");
                      setCurrentPage(1);
                    }}
                  >
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition",
                        activeAwardFilter === "all"
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-white/20 bg-white/5 text-white/55 hover:text-white hover:border-white/40",
                      )}
                    >
                      {t("common.all")}
                    </span>
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("profile.noAwardsYet")}</p>
          )}
        </div>

        <div className="border-t border-border pb-12 pt-4">
          <div className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("Videos");
                  setCurrentPage(1);
                }}
                className={cn(
                  "-mb-px mr-6 flex items-center gap-2 border-b-2 pb-3 text-sm transition",
                  activeTab === "Videos"
                    ? "border-primary font-medium text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Grid className="h-4 w-4" />
                {t("profile.videos")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("Competition");
                  setCurrentPage(1);
                }}
                className={cn(
                  "-mb-px mr-6 flex items-center gap-2 border-b-2 pb-3 text-sm transition",
                  activeTab === "Competition"
                    ? "border-primary font-medium text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Trophy className="h-4 w-4" />
                {t("profile.tabCompetition")}
              </button>
            </div>
            <div className="flex shrink-0 items-center">
              {(["Newest", "Oldest", "Most Viewed"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setSortBy(opt);
                    setCurrentPage(1);
                    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs transition",
                    sortBy === opt ? "bg-white/10 font-medium text-white" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt === "Newest" ? t("profile.sortNewest") : opt === "Oldest" ? t("profile.sortOldest") : t("profile.sortMostViewed")}
                </button>
              ))}
            </div>
          </div>
          {activeAwardFilter ? (
            <div className="mt-3 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-purple-900/50 px-3 py-1 text-xs text-purple-300">
                {awardFilterLabel(activeAwardFilter)}
                <button type="button" onClick={() => setActiveAwardFilter(null)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
          ) : null}

          <div
            id={activeTab === "Videos" ? "profile-section-videos" : "profile-section-competition"}
            className="mt-4 grid grid-cols-4 gap-4"
          >
            {paged.videos.length === 0 && activeAwardFilter ? (
              <p className="col-span-4 mt-12 text-center text-sm text-neutral-500">{t("profile.noVideosForAward")}</p>
            ) : null}
            {paged.videos.map((video) => {
              const thumb = video.thumbnailUrl?.trim() || `https://picsum.photos/seed/${encodeURIComponent(video.id)}/400/225`;
              const views = formatViewCountShort(video.viewCount ?? 0);
              const when = formatUploadedRelative(video.createdAt, locale);
              return (
                <Link
                  key={video.id}
                  href={`/watch/${video.id}`}
                  className="group -m-2 mb-5 block cursor-pointer rounded-xl p-2 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-black/20"
                >
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-card">
                    <Image
                      src={thumb}
                      alt={video.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      unoptimized={thumb.startsWith("http")}
                    />
                    <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/50" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative flex h-12 w-12 scale-75 items-center justify-center opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                        <Image src="/genova-play.png" alt="" width={48} height={48} className="h-full w-full" aria-hidden />
                        <svg
                          className="absolute h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="white"
                          aria-hidden
                        >
                          <polygon points="6,3 20,12 6,21" />
                        </svg>
                      </div>
                    </div>
                    {video.award ? (
                      <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                        {video.award === "gold" && <Trophy className="h-3 w-3 text-yellow-400" />}
                        {video.award === "silver" && <Trophy className="h-3 w-3 text-slate-300" />}
                        {video.award === "bronze" && <Trophy className="h-3 w-3 text-amber-600" />}
                        {video.award === "special" && <Trophy className="h-3 w-3 text-purple-400" />}
                        {video.award === "genre_1st" && <Star className="h-3 w-3 text-yellow-400" />}
                        {video.award === "genre_2nd" && <Star className="h-3 w-3 text-slate-300" />}
                        {video.award === "genre_3rd" && <Star className="h-3 w-3 text-amber-600" />}
                        <span className="typo-stat-xs font-semibold tracking-wide text-white">
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
                  </div>
                  <div className="mt-2 px-0.5">
                    <p className="typo-card-title line-clamp-1 text-foreground transition group-hover:text-primary">{video.title}</p>
                    <p className="typo-card-meta mt-0.5 text-muted-foreground">
                      {t("creator.viewsWhen").replace("{views}", views).replace("{when}", when)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {paged.totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
                }}
                disabled={paged.safePage === 1}
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
                disabled={paged.safePage === 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-all duration-200 hover:bg-white/5 hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary hover:shadow-md hover:shadow-purple-500/10 disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center gap-1.5">
                {getVisiblePages(paged.safePage, paged.totalPages).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={cn(
                    "h-7 w-7 rounded-lg border text-xs transition-all duration-200",
                    paged.safePage === page
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
                  setCurrentPage((p) => Math.min(paged.totalPages, p + 1));
                  setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
                }}
                disabled={paged.safePage === paged.totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-all duration-200 hover:bg-white/5 hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary hover:shadow-md hover:shadow-purple-500/10 disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(paged.totalPages);
                  setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
                }}
                disabled={paged.safePage === paged.totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-all duration-200 hover:bg-white/5 hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary hover:shadow-md hover:shadow-purple-500/10 disabled:opacity-30"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {showFollowToast ? (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-primary/30 bg-card px-4 py-3 shadow-lg shadow-purple-500/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <UserCheck className="h-4 w-4 text-primary" />
          <span className="text-sm text-foreground">
            {t("profile.nowFollowing")}{" "}
            <span className="font-medium text-primary">{creator.name}</span>
          </span>
        </div>
      ) : null}
      {showUnfollowModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-foreground">
              {t("profile.unfollowConfirmTitle")} {creator.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("profile.unfollowConfirmBody")}</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowUnfollowModal(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-white/5 transition"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={onConfirmUnfollow}
                className="rounded-lg bg-red-500/80 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition"
              >
                {t("profile.unfollow")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
