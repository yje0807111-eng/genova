"use client";

import { ChevronDown, ChevronUp, Edit, ExternalLink, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  deleteCompetitionAction,
  getCompetitionVideosAction,
  setVideoAwardAction,
  setVideoFinalistAction,
  toggleCompetitionFeaturedAction,
  toggleCompetitionFeaturedFlagAction,
  updateCompetitionStatusAction,
  type CompetitionSubmissionVideo,
} from "@/app/actions/admin";
import { deleteVideoAction, updateVideoVisibilityAction } from "@/app/actions/video";
import { adminTokens } from "@/lib/admin-styles";
import type { Competition, Video } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

function formatRelativeTime(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "방금";
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(date).toLocaleDateString("ko-KR");
}

function sortVideos(videos: CompetitionSubmissionVideo[], sortBy: "views" | "likes" | "newest") {
  const arr = [...videos];
  arr.sort((a, b) => {
    const af = a.is_competition_featured ? 1 : 0;
    const bf = b.is_competition_featured ? 1 : 0;
    if (af !== bf) return bf - af;
    if (sortBy === "views") return (b.view_count ?? 0) - (a.view_count ?? 0);
    if (sortBy === "likes") return b.like_count - a.like_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return arr;
}

export function CompetitionManage({
  competitions,
  videos: _videos,
  selectedCompetition,
  setSelectedCompetition,
  setVideoFilter,
  onCompetitionsChange,
  onMessage,
}: {
  competitions: Competition[];
  videos: Video[];
  selectedCompetition: Competition | null;
  setSelectedCompetition: (competition: Competition | null) => void;
  setVideoFilter: (value: string) => void;
  onCompetitionsChange: (next: Competition[]) => void;
  onMessage: (message: string) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [competitionVideos, setCompetitionVideos] = useState<Record<string, CompetitionSubmissionVideo[]>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"views" | "likes" | "newest">("views");
  const [pendingFeaturedId, setPendingFeaturedId] = useState<string | null>(null);
  const [pendingFeaturedCompetitionId, setPendingFeaturedCompetitionId] = useState<string | null>(null);

  const sortedCompetitions = useMemo(
    () =>
      [...competitions].sort((a, b) => {
        const af = a.isFeatured ? 1 : 0;
        const bf = b.isFeatured ? 1 : 0;
        if (af !== bf) return bf - af;
        return 0;
      }),
    [competitions],
  );

  const featuredCompCount = useMemo(() => competitions.filter((c) => c.isFeatured).length, [competitions]);

  const handleToggleCompFeatured = async (compId: string, currentFeatured: boolean) => {
    setPendingFeaturedCompetitionId(compId);
    try {
      const result = await toggleCompetitionFeaturedFlagAction(compId, !currentFeatured);
      if (result.ok) {
        onCompetitionsChange(competitions.map((c) => (c.id === compId ? { ...c, isFeatured: !currentFeatured } : c)));
        onMessage("저장되었습니다.");
        router.refresh();
      } else {
        alert(result.message ?? "추천 변경 실패");
      }
    } finally {
      setPendingFeaturedCompetitionId(null);
    }
  };

  const handleToggleFeatured = async (competitionId: string, videoId: string, currentFeatured: boolean) => {
    setPendingFeaturedId(videoId);
    try {
      const result = await toggleCompetitionFeaturedAction(videoId, !currentFeatured);
      if (result.ok) {
        setCompetitionVideos((prev) => ({
          ...prev,
          [competitionId]: (prev[competitionId] ?? []).map((v) =>
            v.id === videoId ? { ...v, is_competition_featured: !currentFeatured } : v,
          ),
        }));
        router.refresh();
      } else {
        alert(result.message ?? "추천 변경 실패");
      }
    } finally {
      setPendingFeaturedId(null);
    }
  };

  const refreshCompetitionVideos = async (compId: string) => {
    const list = await getCompetitionVideosAction(compId);
    setCompetitionVideos((prev) => ({ ...prev, [compId]: list }));
  };

  const runVideoAction = async (compId: string, fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setLoading(true);
    try {
      const res = await fn();
      onMessage(res.ok ? "저장되었습니다." : res.message ?? "실패했습니다.");
      if (res.ok) {
        router.refresh();
        await refreshCompetitionVideos(compId);
      }
    } finally {
      setLoading(false);
    }
  };

  const callWithOptimistic = async (
    fn: () => Promise<{ ok: boolean; message?: string }>,
    optimisticUpdate?: () => void,
  ) => {
    setLoading(true);
    if (optimisticUpdate) optimisticUpdate();
    try {
      const res = await fn();
      onMessage(res.ok ? "저장되었습니다." : res.message ?? "실패했습니다.");
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const updateCompetitionStatus = (id: string, status: string) => {
    void callWithOptimistic(
      () => updateCompetitionStatusAction(id, status),
      () => onCompetitionsChange(competitions.map((comp) => (comp.id === id ? { ...comp, status } : comp))),
    );
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`"${title}" 공모전을 삭제하시겠습니까?`)) return;
    void callWithOptimistic(
      () => deleteCompetitionAction(id),
      () => onCompetitionsChange(competitions.filter((comp) => comp.id !== id)),
    );
  };

  const handleToggle = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      if (selectedCompetition?.id === id) {
        setSelectedCompetition(null);
        setVideoFilter("all");
      }
      return;
    }

    setExpandedId(id);
    const comp = competitions.find((c) => c.id === id);
    if (comp) {
      setSelectedCompetition(comp);
      setVideoFilter("competition");
    }

    if (competitionVideos[id]) return;

    setLoadingId(id);
    try {
      const list = await getCompetitionVideosAction(id);
      setCompetitionVideos((prev) => ({ ...prev, [id]: list }));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className={adminTokens.card}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className={cn(adminTokens.sectionHeader, "!mb-0")}>공모전 관리</h2>
          <span className="text-[11px] font-mono text-white/30">{competitions.length}</span>
          {featuredCompCount > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-[#AFA9EC]">
              <Star size={9} className="fill-[#AFA9EC] text-[#AFA9EC]" aria-hidden />
              {featuredCompCount} 추천
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-1">
        {competitions.length === 0 ? (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] py-12 text-center">
            <p className="text-[12px] text-white/35">공모전이 없습니다</p>
          </div>
        ) : (
          sortedCompetitions.map((comp) => (
            <div
              key={comp.id}
              className={cn(
                "overflow-hidden rounded-lg border bg-white/[0.01] transition hover:border-white/[0.08]",
                comp.isFeatured ? "border-[#7F77DD]/25 bg-[#7F77DD]/[0.04]" : "border-white/[0.04]",
                selectedCompetition?.id === comp.id && "border-[#534AB7]/35 bg-[#534AB7]/[0.08]",
              )}
            >
              <div className="group/row flex items-stretch">
                <button
                  type="button"
                  onClick={() => void handleToggle(comp.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.02]"
                >
                  <div className="shrink-0 text-white/35">
                    {expandedId === comp.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>

                  <div className="w-[60px] shrink-0">
                    {comp.status === "Open" ? (
                      <span className={cn(adminTokens.badge, adminTokens.badgeSuccess)}>모집중</span>
                    ) : null}
                    {comp.status === "In Review" ? (
                      <span className={cn(adminTokens.badge, adminTokens.badgeWarning)}>심사중</span>
                    ) : null}
                    {comp.status === "Voting" ? (
                      <span className={cn(adminTokens.badge, adminTokens.badgeInfo)}>투표중</span>
                    ) : null}
                    {comp.status === "Closed" ? (
                      <span className={cn(adminTokens.badge, adminTokens.badgeNeutral)}>종료</span>
                    ) : null}
                    {!["Open", "In Review", "Voting", "Closed"].includes(comp.status) ? (
                      <span className={cn(adminTokens.badge, adminTokens.badgeNeutral)}>{comp.status}</span>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-[13px] font-medium text-white">{comp.title}</p>
                      <span className="max-w-[120px] shrink-0 truncate text-[10px] font-mono text-white/30">#{comp.id}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/35">
                      <span>마감 {new Date(comp.deadline).toLocaleDateString("ko-KR")}</span>
                      {comp.genre ? (
                        <>
                          <span className="text-white/20">·</span>
                          <span className="truncate">{comp.genre}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </button>

                <div
                  className="flex shrink-0 items-center gap-1 border-l border-white/[0.06] px-3 py-2.5"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    disabled={loading || pendingFeaturedCompetitionId === comp.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleToggleCompFeatured(comp.id, comp.isFeatured ?? false);
                    }}
                    className={cn(
                      "flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition",
                      comp.isFeatured
                        ? "border border-[#7F77DD]/30 bg-[#7F77DD]/20 text-[#AFA9EC] hover:bg-[#7F77DD]/30"
                        : "border border-white/[0.08] bg-white/[0.02] text-white/50 hover:bg-white/[0.06] hover:text-white/80",
                    )}
                    title={comp.isFeatured ? "추천 해제" : "추천 공모전으로 지정"}
                  >
                    <Star size={10} className={comp.isFeatured ? "fill-[#AFA9EC] text-[#AFA9EC]" : "text-white/50"} aria-hidden />
                    {comp.isFeatured ? "추천중" : "추천"}
                  </button>

                  <div
                    className={cn(
                      "flex flex-1 flex-wrap items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/row:opacity-100",
                    )}
                  >
                  <div className="flex flex-wrap items-center gap-0.5 border-r border-white/[0.06] pr-2">
                    <button
                      type="button"
                      disabled={loading || comp.status === "Open"}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCompetitionStatus(comp.id, "Open");
                      }}
                      className={cn(adminTokens.buttonGhost, "h-8 px-2", comp.status === "Open" ? "text-emerald-400" : "")}
                    >
                      모집
                    </button>
                    <button
                      type="button"
                      disabled={loading || comp.status === "In Review"}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCompetitionStatus(comp.id, "In Review");
                      }}
                      className={cn(adminTokens.buttonGhost, "h-8 px-2", comp.status === "In Review" ? "text-amber-400" : "")}
                    >
                      심사
                    </button>
                    <button
                      type="button"
                      disabled={loading || comp.status === "Voting"}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCompetitionStatus(comp.id, "Voting");
                      }}
                      className={cn(adminTokens.buttonGhost, "h-8 px-2", comp.status === "Voting" ? "text-sky-400" : "")}
                    >
                      투표
                    </button>
                    <button
                      type="button"
                      disabled={loading || comp.status === "Closed"}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCompetitionStatus(comp.id, "Closed");
                      }}
                      className={cn(adminTokens.buttonGhost, "h-8 px-2", comp.status === "Closed" ? "text-white/55" : "")}
                    >
                      종료
                    </button>
                  </div>

                  <Link href={`/admin/competition/${comp.id}`} className={adminTokens.iconButton} title="수정" onClick={(e) => e.stopPropagation()}>
                    <Edit size={13} />
                  </Link>
                  <Link
                    href={`/competition/${comp.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={adminTokens.iconButton}
                    title="페이지 보기"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={13} />
                  </Link>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(comp.id, comp.title);
                    }}
                    className={cn(adminTokens.iconButton, "hover:text-red-400")}
                    title="삭제"
                  >
                    <Trash2 size={13} />
                  </button>
                  </div>
                </div>
              </div>

              {expandedId === comp.id ? (
                <div className="border-t border-white/[0.04] bg-[#0a0a0a]/40 px-3 py-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-white/35">
                        출품작 {(competitionVideos[comp.id] ?? []).length}개
                      </span>
                      {(() => {
                        const fc = (competitionVideos[comp.id] ?? []).filter((v) => v.is_competition_featured).length;
                        return fc > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-[#AFA9EC]">
                            <Star size={9} className="fill-[#AFA9EC] text-[#AFA9EC]" />
                            {fc} 추천
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {(
                        [
                          { key: "views" as const, label: "조회순" },
                          { key: "likes" as const, label: "좋아요순" },
                          { key: "newest" as const, label: "최신순" },
                        ] as const
                      ).map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => setSortBy(s.key)}
                          className={cn(
                            "h-7 rounded-md px-2.5 text-[11px] font-medium transition",
                            sortBy === s.key ? "bg-white/10 text-white" : "text-white/35 hover:text-white/70",
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loadingId === comp.id ? (
                    <div className="py-6 text-center text-[11px] text-white/35">로딩 중...</div>
                  ) : (competitionVideos[comp.id] ?? []).length === 0 ? (
                    <div className="py-6 text-center text-[11px] text-white/35">출품작이 없습니다</div>
                  ) : (
                    <div className="space-y-1">
                      {sortVideos(competitionVideos[comp.id] ?? [], sortBy).map((video) => (
                        <div
                          key={video.id}
                          className={cn(
                            "group flex flex-wrap items-center gap-2 rounded-md px-2.5 py-2 transition sm:flex-nowrap sm:gap-3",
                            video.is_competition_featured
                              ? "border border-[#7F77DD]/30 bg-[#7F77DD]/[0.05]"
                              : "border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] hover:bg-white/[0.03]",
                          )}
                        >
                          <div className="relative h-10 w-[72px] shrink-0 overflow-hidden rounded">
                            {video.thumbnail_url?.trim() ? (
                              <Image src={video.thumbnail_url} alt="" fill sizes="72px" className="object-cover" />
                            ) : (
                              <div className="h-full w-full bg-white/[0.04]" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 basis-[140px]">
                            <div className="flex min-w-0 items-center gap-1.5">
                              {video.is_competition_featured ? (
                                <Star size={11} className="shrink-0 fill-[#AFA9EC] text-[#AFA9EC]" aria-hidden />
                              ) : null}
                              <p className="truncate text-[12px] font-medium text-white">{video.title}</p>
                            </div>
                            <p className="truncate text-[10px] text-white/35">{video.profiles?.display_name ?? "익명"}</p>
                          </div>

                          <div className="flex shrink-0 items-center gap-3 font-mono text-[10px] text-white/35">
                            <span title="조회수">{video.view_count ?? 0}</span>
                            <span title="좋아요" className="text-[#FF6B9D]/70">
                              ♥ {video.like_count}
                            </span>
                            <span className="text-white/30">{formatRelativeTime(video.created_at)}</span>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              disabled={loading || pendingFeaturedId === video.id}
                              onClick={() => void handleToggleFeatured(comp.id, video.id, video.is_competition_featured)}
                              className={cn(
                                "h-7 rounded-md px-2 text-[11px] font-medium transition",
                                video.is_competition_featured
                                  ? "border border-[#7F77DD]/30 bg-[#7F77DD]/20 text-[#AFA9EC] hover:bg-[#7F77DD]/30"
                                  : "border border-white/[0.08] bg-white/[0.02] text-white/50 opacity-100 hover:bg-white/[0.06] hover:text-white/80 sm:opacity-0 sm:group-hover:opacity-100",
                              )}
                              title={video.is_competition_featured ? "추천 해제" : "추천 지정"}
                            >
                              {video.is_competition_featured ? "✦ 추천중" : "추천"}
                            </button>
                            <Link
                              href={`/watch/${video.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                adminTokens.iconButton,
                                "h-7 w-7 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100",
                              )}
                              title="보기"
                            >
                              <ExternalLink size={12} />
                            </Link>
                          </div>

                          <div className="flex w-full shrink-0 flex-wrap items-center gap-1 opacity-100 transition-opacity sm:ml-auto sm:w-auto sm:opacity-0 sm:group-hover:opacity-100">
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                void runVideoAction(comp.id, () => setVideoFinalistAction(video.id, !video.is_finalist))
                              }
                              className={cn(adminTokens.buttonGhost, "h-7 px-2 text-[10px]")}
                            >
                              {video.is_finalist ? "✓ 결선" : "결선 지정"}
                            </button>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                void runVideoAction(comp.id, () => setVideoAwardAction(video.id, video.award ? "" : "대상"))
                              }
                              className={cn(adminTokens.buttonGhost, "h-7 px-2 text-[10px]")}
                            >
                              🏆 Set Award
                            </button>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                void runVideoAction(comp.id, () =>
                                  updateVideoVisibilityAction(video.id, video.visibility === "private" ? "public" : "private"),
                                )
                              }
                              className={cn(adminTokens.buttonGhost, "h-7 px-2 text-[10px]")}
                            >
                              {video.visibility === "private" ? "🔒 비공개" : "비공개"}
                            </button>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => {
                                if (!confirm(`"${video.title}" 영상을 삭제하시겠습니까?`)) return;
                                void runVideoAction(comp.id, () => deleteVideoAction(video.id));
                              }}
                              className={cn(adminTokens.buttonGhost, "h-7 px-2 text-[10px] text-red-400/80 hover:text-red-400")}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
