"use client";

import { ExternalLink, Eye, EyeOff, Star, Trash2, Trophy } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { setVideoAwardAction, setVideoFinalistAction, setVideoOriginalAction } from "@/app/actions/admin";
import { deleteVideoAction, updateVideoVisibilityAction } from "@/app/actions/video";
import { adminTokens } from "@/lib/admin-styles";
import type { Competition, Video } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export function VideoManage({
  videos,
  selectedCompetition,
  setSelectedCompetition,
  videoFilter,
  setVideoFilter,
  onMessage,
}: {
  videos: Video[];
  selectedCompetition: Competition | null;
  setSelectedCompetition: (competition: Competition | null) => void;
  videoFilter: string;
  setVideoFilter: (value: string) => void;
  onMessage: (message: string) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [videoSort, setVideoSort] = useState<"latest" | "likes" | "views" | "reports">("latest");
  const [videoTimeFilter, setVideoTimeFilter] = useState<"all" | "week" | "month">("all");
  // G5: free-text search across title / creator / uploader / video id.
  const [videoSearch, setVideoSearch] = useState("");
  // H4-D.5: persist operator-added award labels across reloads.
  // Defaults are the built-in set; localStorage adds extra labels the
  // operator typed for a custom prize.  Previously they vanished on
  // every refresh.
  const DEFAULT_AWARD_OPTIONS = [
    "대상",
    "금상",
    "은상",
    "동상",
    "입선",
    "장려상",
    "Grand Prize",
    "Excellence",
    "Merit",
    "Audience Award",
    "Special Award",
  ];
  const AWARD_STORAGE_KEY = "genova_admin_award_options";
  const [awardOptions, setAwardOptions] = useState<string[]>(DEFAULT_AWARD_OPTIONS);
  // Read localStorage once on mount.  Wrap in try/catch — Safari
  // private mode can throw on read.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(AWARD_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
        // Merge: stored values appended after defaults, dedup'd.
        const merged = [...DEFAULT_AWARD_OPTIONS];
        for (const v of parsed) {
          if (!merged.includes(v)) merged.push(v);
        }
        setAwardOptions(merged);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Persist non-default (operator-added) award labels only. */
  const persistAwardOptions = (next: string[]) => {
    setAwardOptions(next);
    try {
      const extras = next.filter((v) => !DEFAULT_AWARD_OPTIONS.includes(v));
      window.localStorage.setItem(AWARD_STORAGE_KEY, JSON.stringify(extras));
    } catch {
      /* ignore */
    }
  };

  const [newAwardOption, setNewAwardOption] = useState("");
  const [showAwardSelect, setShowAwardSelect] = useState<string | null>(null);

  const filteredVideos = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
    let result = videos.filter((v) => {
      if (videoFilter.startsWith("competition_")) return v.purpose === "competition";
      if (videoFilter === "competition") return v.isFinalist || v.purpose === "competition";
      if (videoFilter !== "all") return v.genre === videoFilter;
      return true;
    });
    result = result.filter((v) => {
      if (videoTimeFilter === "week") return new Date(v.createdAt).getTime() >= weekAgo;
      if (videoTimeFilter === "month") return new Date(v.createdAt).getTime() >= monthAgo;
      return true;
    });
    const q = videoSearch.trim().toLowerCase();
    if (q) {
      result = result.filter((v) =>
        [v.title, v.creatorName, v.uploaderDisplayName, v.id]
          .filter((s): s is string => Boolean(s))
          .some((s) => s.toLowerCase().includes(q)),
      );
    }
    const primarySorted = [...result].sort((a, b) => {
      if (videoSort === "likes") return (b.likeCount ?? 0) - (a.likeCount ?? 0);
      if (videoSort === "views") return (b.viewCount ?? 0) - (a.viewCount ?? 0);
      if (videoSort === "reports") {
        return (
          ((b as Video & { reportCount?: number }).reportCount ?? 0) -
          ((a as Video & { reportCount?: number }).reportCount ?? 0)
        );
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return primarySorted.sort((a, b) => {
      if (a.isCompetitionFeatured && !b.isCompetitionFeatured) return -1;
      if (!a.isCompetitionFeatured && b.isCompetitionFeatured) return 1;
      return 0;
    });
  }, [videos, videoFilter, videoSort, videoTimeFilter, videoSearch]);

  const call = async (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setLoading(true);
    try {
      const res = await fn();
      onMessage(res.ok ? "저장되었습니다." : res.message ?? "실패했습니다.");
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleSetFinalist = (id: string, next: boolean) => {
    void call(() => setVideoFinalistAction(id, next));
  };

  const handleSetFeatured = (id: string, next: boolean) => {
    void call(() => setVideoOriginalAction(id, next));
  };

  const handleAward = (id: string, award: string) => {
    void call(() => setVideoAwardAction(id, award));
    setShowAwardSelect(null);
  };

  const handleToggleVisibility = (id: string, currentlyPrivate: boolean) => {
    void call(() => updateVideoVisibilityAction(id, currentlyPrivate ? "public" : "private"));
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`"${title}" 영상을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    void call(() => deleteVideoAction(id));
  };

  const filterSelectClass = cn(adminTokens.input, "min-w-[110px] cursor-pointer text-[12px]");

  return (
    <div className={adminTokens.card}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className={cn(adminTokens.sectionHeader, "!mb-0")}>영상 관리</h2>
          <span className="text-[11px] font-mono text-white/30">{videos.length}</span>
          {selectedCompetition ? (
            <span className="truncate text-[11px] text-white/35">· {selectedCompetition.title}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* G5: free-text search */}
          <input
            type="search"
            value={videoSearch}
            onChange={(e) => setVideoSearch(e.target.value)}
            placeholder="검색 (제목/크리에이터/ID)"
            className={cn(adminTokens.input, "min-w-[180px] text-[12px]")}
          />
          {selectedCompetition ? (
            <button
              type="button"
              onClick={() => {
                setSelectedCompetition(null);
                setVideoFilter("all");
              }}
              className={cn(adminTokens.buttonGhost, "inline-flex h-9 shrink-0 items-center")}
            >
              ← 전체 영상
            </button>
          ) : null}
          <select
            value={videoFilter}
            onChange={(e) => setVideoFilter(e.target.value)}
            className={filterSelectClass}
          >
            <option value="all">전체 장르</option>
            <option value="competition">공모전</option>
            {selectedCompetition ? (
              <option value={"competition_" + selectedCompetition.id}>{selectedCompetition.title}</option>
            ) : null}
            <option value="film">단편영화</option>
            <option value="animation">애니메이션</option>
            <option value="music">뮤직비디오</option>
            <option value="daily">일상</option>
            <option value="art">아트</option>
          </select>
          <select
            value={videoTimeFilter}
            onChange={(e) => setVideoTimeFilter(e.target.value as "all" | "week" | "month")}
            className={filterSelectClass}
          >
            <option value="all">전체 기간</option>
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
          </select>
          <select
            value={videoSort}
            onChange={(e) => setVideoSort(e.target.value as typeof videoSort)}
            className={filterSelectClass}
          >
            <option value="latest">최신</option>
            <option value="likes">좋아요</option>
            <option value="views">조회수</option>
            <option value="reports">신고</option>
          </select>
        </div>
      </div>

      {/* H4-C.4: dim grid during async action so the visible state
          matches the disabled controls. */}
      <div
        className={cn(
          "max-h-[600px] min-h-0 space-y-1 overflow-y-auto pr-0.5 transition-opacity",
          loading && "pointer-events-none opacity-60",
        )}
      >
        {filteredVideos.length === 0 ? (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] py-12 text-center">
            <p className="text-[12px] text-white/35">
              {videos.length === 0 ? "아직 업로드된 영상이 없습니다" : "필터 조건에 맞는 영상이 없습니다"}
            </p>
          </div>
        ) : (
          filteredVideos.map((video) => (
            <div
              key={video.id}
              className={cn(
                "group flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5 transition",
                video.isCompetitionFeatured
                  ? "border-[#7F77DD]/25 bg-[#7F77DD]/[0.04] hover:border-[#7F77DD]/35 hover:bg-[#7F77DD]/[0.06]"
                  : "border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] hover:bg-white/[0.03]",
              )}
            >
              <div className="relative h-9 w-16 shrink-0 overflow-hidden rounded">
                {video.thumbnailUrl?.trim() ? (
                  <Image src={video.thumbnailUrl} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <div className="h-full w-full bg-white/[0.04]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  {video.isCompetitionFeatured ? (
                    <Star size={11} className="shrink-0 fill-[#AFA9EC] text-[#AFA9EC]" aria-hidden />
                  ) : null}
                  <p className="truncate text-[13px] font-medium text-white">{video.title}</p>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-white/35">
                  <span>{video.genre || "—"}</span>
                  <span className="text-white/20">·</span>
                  <span>{video.viewCount ?? 0} views</span>
                  {video.purpose === "competition" ? (
                    <>
                      <span className="text-white/20">·</span>
                      <span className="text-[#AFA9EC]/90">출품작</span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex max-w-[140px] shrink-0 flex-wrap items-center justify-end gap-1 lg:max-w-none">
                {video.isOriginal ? (
                  <span className={cn(adminTokens.badge, adminTokens.badgeInfo)}>Genova Original</span>
                ) : null}
                {video.isFinalist ? (
                  <span className={cn(adminTokens.badge, adminTokens.badgeWarning)}>결선</span>
                ) : null}
                {video.award ? (
                  <span className={cn(adminTokens.badge, adminTokens.badgeSuccess)}>{video.award}</span>
                ) : null}
                {video.visibility === "private" ? (
                  <span className={cn(adminTokens.badge, adminTokens.badgeNeutral)}>비공개</span>
                ) : null}
              </div>

              {/* G3: hover-fade only on hover-capable pointers — keeps
                  actions visible on touch devices (iPad admin). */}
              <div className="flex shrink-0 items-center gap-1 opacity-100 sm:transition-opacity [@media(hover:hover)]:sm:opacity-0 [@media(hover:hover)]:sm:group-hover:opacity-100">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSetFinalist(video.id, !video.isFinalist)}
                  className={cn(adminTokens.buttonGhost, "disabled:opacity-40")}
                  title="결선 지정"
                >
                  결선
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSetFeatured(video.id, !video.isOriginal)}
                  className={cn(adminTokens.buttonGhost, "disabled:opacity-40")}
                  title={video.isOriginal ? "Genova Original 해제" : "Genova Original 지정"}
                >
                  {video.isOriginal ? "✓ Original" : "Original"}
                </button>
                <button
                  type="button"
                  className={cn(adminTokens.iconButton, "disabled:opacity-40")}
                  title="보기"
                  onClick={() => window.open(`/watch/${video.id}`, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink size={13} />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowAwardSelect(showAwardSelect === video.id ? null : video.id)}
                    className={cn(adminTokens.iconButton, "disabled:opacity-40")}
                    title="수상 지정"
                  >
                    <Trophy size={13} />
                  </button>
                  {showAwardSelect === video.id ? (
                    <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-md border border-white/[0.08] py-1 shadow-lg" style={{ background: "#0d0b1f" }}>
                      <div className="max-h-[200px] overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => handleAward(video.id, "")}
                          className="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-white/35 transition hover:bg-white/[0.05] hover:text-white/70"
                        >
                          수상 취소
                        </button>
                        {awardOptions.map((award) => (
                          <button
                            key={award}
                            type="button"
                            onClick={() => handleAward(video.id, award)}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[12px] transition hover:bg-white/[0.05]"
                            style={{ color: video.award === award ? "#94a3b8" : "rgba(255,255,255,0.65)" }}
                          >
                            <span>{award}</span>
                          </button>
                        ))}
                      </div>
                      <div className={cn(adminTokens.divider, "p-2")}>
                        <div className="flex gap-1">
                          <input
                            value={newAwardOption}
                            onChange={(e) => setNewAwardOption(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (!newAwardOption.trim()) return;
                                if (!awardOptions.includes(newAwardOption.trim())) {
                                  persistAwardOptions([...awardOptions, newAwardOption.trim()]);
                                }
                                setNewAwardOption("");
                              }
                            }}
                            className={cn(adminTokens.input, "h-8 flex-1 text-[11px]")}
                            placeholder="새 수상 추가..."
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newAwardOption.trim()) return;
                              if (!awardOptions.includes(newAwardOption.trim())) {
                                persistAwardOptions([...awardOptions, newAwardOption.trim()]);
                              }
                              setNewAwardOption("");
                            }}
                            className={adminTokens.buttonSecondary}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAwardSelect(null)}
                        className="absolute right-2 top-2 text-white/25 hover:text-white/50"
                      >
                        ×
                      </button>
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleToggleVisibility(video.id, video.visibility === "private")}
                  className={cn(adminTokens.iconButton, "disabled:opacity-40")}
                  title="비공개 전환"
                >
                  {video.visibility === "private" ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDelete(video.id, video.title)}
                  className={cn(adminTokens.buttonDanger, "flex h-8 min-w-8 items-center justify-center px-2 disabled:opacity-40")}
                  title="삭제"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
