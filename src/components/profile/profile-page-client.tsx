"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useI18n } from "@/components/genova/language-provider";
import { useUploadModal } from "@/components/upload/upload-modal-context";
import { useEditModal } from "@/components/upload/edit-modal-context";
import {
  Bookmark,
  Check,
  ChevronDown,
  Film,
  Pencil,
  Trophy,
} from "lucide-react";
import { ProfilePaginator } from "@/components/profile/profile-paginator";
import { ProfileSeriesView } from "@/components/profile/profile-series-view";
import { ProfileVideoCard } from "@/components/profile/profile-video-card";

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
import {
  MAIN_GENRE_KEYS,
  normalizeToMainGenre,
} from "@/lib/constants/genres";
import { cn } from "@/lib/utils/cn";

type MainTab = "films" | "competition" | "saved";
type FilmSub = "all" | (typeof MAIN_GENRE_KEYS)[number] | "series";
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

export function GenovaProfileClient({
  works,
  competitionVideos,
  savedVideos,
  isOwner,
  headerSlot,
}: {
  profileId: string;
  works: Video[];
  competitionVideos: CompetitionVideo[];
  savedVideos: Video[];
  isOwner: boolean;
  /**
   * Server-rendered profile header (C-2b).  Composed by the route
   * page (`/profile/[id]/page.tsx`, `/creator/[id]/page.tsx`) via
   * `<ProfileHeader …/>` and threaded in here.  The header used to
   * render inline above the tabs row, owning the follow state, the
   * edit-modal open state, and the entire bio expand state; all of
   * that now lives inside small client islands the header composes
   * itself (`ProfileEditPencilTrigger`, `ProfileCtaRow`,
   * `ProfileBioExpander`), so this shell only owns tab/sort/edit
   * state for the gallery below.
   */
  headerSlot: ReactNode;
}) {
  const { t, locale, setLocale } = useI18n();
  const { open: openUploadModal } = useUploadModal();
  const { open: openEditModal } = useEditModal();
  const [mainTab, setMainTab] = useState<MainTab>("films");
  const [filmSub, setFilmSub] = useState<FilmSub>("all");
  const [sortBy, setSortBy] = useState<"Newest" | "Oldest" | "Most Viewed">("Newest");
  const [editMode, setEditMode] = useState(false);
  const [bulkAction, setBulkAction] = useState<"private" | "public" | null>(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [showBulkHint, setShowBulkHint] = useState(false);
  const [localWorks, setLocalWorks] = useState<Video[]>(works);
  const [localCompetitionVideos, setLocalCompetitionVideos] = useState<CompetitionVideo[]>(competitionVideos);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const mainTabs = useMemo(() => {
    const base: MainTab[] = ["films", "competition"];
    if (isOwner) base.push("saved");
    return base;
  }, [isOwner]);

  const filmSubs = useMemo(
    (): FilmSub[] => ["all", ...MAIN_GENRE_KEYS, "series"],
    [],
  );

  // Reset to page 1 whenever tab/sub/sort changes — documented
  // "store previous value, adjust during render" pattern.
  const [prevPageKey, setPrevPageKey] = useState({ mainTab, filmSub, sortBy });
  if (
    prevPageKey.mainTab !== mainTab ||
    prevPageKey.filmSub !== filmSub ||
    prevPageKey.sortBy !== sortBy
  ) {
    setPrevPageKey({ mainTab, filmSub, sortBy });
    setCurrentPage(1);
  }

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("profile-owner-status", { detail: isOwner }));
    return () => {
      window.dispatchEvent(new CustomEvent("profile-owner-status", { detail: false }));
    };
  }, [isOwner]);

  useEffect(() => {
    return addWindowCustomListener<string>("profile-tab-change", (tab) => {
      if (tab === "works") {
        setMainTab("films");
        setFilmSub("all");
      }
      if (tab === "awards") setMainTab("competition");
      if (tab === "saved") setMainTab("saved");
    });
  }, []);

  // Clear selection whenever the bulk-action mode changes —
  // documented "store previous value, adjust during render" pattern.
  const [prevBulkAction, setPrevBulkAction] = useState(bulkAction);
  if (prevBulkAction !== bulkAction) {
    setPrevBulkAction(bulkAction);
    setSelectedVideoIds([]);
  }

  const sortedVideos = useMemo(() => {
    const sourceList =
      mainTab === "competition"
        ? localCompetitionVideos
        : mainTab === "saved"
          ? savedVideos
          : filmSub === "all"
            ? localWorks
            : filmSub === "series"
              ? localWorks.filter((v) => v.seriesName)
              : localWorks.filter(
                  (v) => normalizeToMainGenre(v.genre) === filmSub,
                );
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
  }, [mainTab, filmSub, sortBy, bulkAction, editMode, localWorks, localCompetitionVideos, savedVideos]);

  // Re-sync local competition videos when the server set changes —
  // documented "store previous value, adjust during render" pattern.
  const [prevCompetitionVideos, setPrevCompetitionVideos] = useState(competitionVideos);
  if (prevCompetitionVideos !== competitionVideos) {
    setPrevCompetitionVideos(competitionVideos);
    setLocalCompetitionVideos(competitionVideos);
  }

  const displayVideos = useMemo(() => {
    const totalPages = Math.ceil(sortedVideos.length / VIDEOS_PER_PAGE);
    const paginated = sortedVideos.slice((currentPage - 1) * VIDEOS_PER_PAGE, currentPage * VIDEOS_PER_PAGE);
    return { videos: paginated, totalPages };
  }, [sortedVideos, currentPage]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="relative z-10">
        {/* 모바일 전용 언어 선택 — 프로필 배너 우측 상단에 작게
            (데스크톱은 사이드바 글로브) */}
        <div className="absolute right-3 top-3 z-30 flex gap-0.5 rounded-full border border-white/[0.10] bg-black/30 p-0.5 backdrop-blur-md md:hidden">
          {(["en", "ko", "ja"] as const).map((lng) => (
            <button
              key={lng}
              type="button"
              onClick={() => setLocale(lng)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors",
                locale === lng
                  ? "bg-white text-[#0a0a0a]"
                  : "text-white/60",
              )}
            >
              {lng.toUpperCase()}
            </button>
          ))}
        </div>
        {headerSlot}

      {/* Tabs + grid */}
      <AnimateIn delay={0.1}>
      <div className="pb-12 pt-6">
        <div className="mx-auto min-w-0 w-full max-w-[1800px] px-6 sm:px-10 lg:px-14">
            <div className="flex items-center gap-2 py-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {mainTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setMainTab(tab);
                      if (tab === "films") setFilmSub("all");
                    }}
                    className={cn(
                      "flex min-w-[88px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] transition",
                      mainTab === tab
                        ? "border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        : "border border-transparent font-semibold text-white/45 hover:bg-white/[0.03] hover:text-white/80",
                    )}
                  >
                    {tab === "films" ? <Film className="h-3.5 w-3.5" /> : null}
                    {tab === "competition" ? (
                      <Trophy className="h-3.5 w-3.5" />
                    ) : null}
                    {tab === "saved" ? <Bookmark className="h-3.5 w-3.5" /> : null}
                    {tab === "films"
                      ? t("homeTab.films", "필름")
                      : tab === "competition"
                        ? t("homeTab.competition", "공모전")
                        : t("profile.tabSaved")}
                  </button>
                ))}
              </div>
              {/* 정렬 + 편집 — 우측 고정 1렬 (홈과 동일 배치) */}
              <div className="flex shrink-0 items-center gap-2">
              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const v = e.target.value as "Newest" | "Oldest" | "Most Viewed";
                    setSortBy(v);
                  }}
                  style={{ colorScheme: "dark" }}
                  className="cursor-pointer appearance-none rounded-lg border border-white/[0.08] bg-white/[0.03] py-1.5 pl-3 pr-9 text-[12px] font-semibold text-white/75 outline-none transition hover:border-[#7F77DD]/40 hover:bg-white/[0.05] hover:text-white focus:border-[#7F77DD]/50"
                >
                  {(
                    [
                      ["Newest", t("profile.sortNewest")],
                      ["Oldest", t("profile.sortOldest")],
                      ["Most Viewed", t("profile.sortMostViewed")],
                    ] as const
                  ).map(([val, label]) => (
                    <option
                      key={val}
                      value={val}
                      style={{ background: "#141019", color: "#fff" }}
                    >
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/45" />
              </div>
              {isOwner ? (
                <button
                  type="button"
                  onClick={() => setEditMode((prev) => !prev)}
                  className={cn(
                    "inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg border transition",
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

            {/* 필름 세부 섹션 — 장르 + 시리즈 (공모전/저장은 섹션 없음) */}
            {mainTab === "films" ? (
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-2 px-0.5">
                {filmSubs.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setFilmSub(sub)}
                    className={cn(
                      "text-[13px] font-semibold transition",
                      filmSub === sub
                        ? "text-white"
                        : "text-white/40 hover:text-white/70",
                    )}
                  >
                    {sub === "all"
                      ? t("homeTab.subRec.all", "전체")
                      : t(`homeTab.subGenre.${sub}`, sub)}
                  </button>
                ))}
              </div>
            ) : null}

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

            {mainTab === "films" && filmSub === "series" ? (
              <ProfileSeriesView videos={localWorks} />
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
                    key={`${mainTab}-${filmSub}-${video.id}`}
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

      {/* ProfileSettingsModal is now mounted inside <ProfileEditPencilTrigger>,
          which the server-rendered <ProfileHeader> composes for owners. */}

      </div>
    </div>
  );
}
