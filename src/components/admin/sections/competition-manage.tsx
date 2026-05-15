"use client";

import { ChevronDown, ChevronUp, Edit, ExternalLink, Film, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  deleteCompetitionAction,
  getCompetitionVideosAction,
  toggleCompetitionFeaturedAction,
  toggleCompetitionFeaturedFlagAction,
  updateCompetitionStatusAction,
  type CompetitionSubmissionVideo,
} from "@/app/actions/admin";
import { adminTokens } from "@/lib/admin-styles";
import type { Competition, Video } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { CompetitionSubmissionRow } from "./competition-submission-row";

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
  onViewCompetitionVideos,
}: {
  competitions: Competition[];
  videos: Video[];
  selectedCompetition: Competition | null;
  setSelectedCompetition: (competition: Competition | null) => void;
  setVideoFilter: (value: string) => void;
  onCompetitionsChange: (next: Competition[]) => void;
  onMessage: (message: string) => void;
  /**
   * 연동 복구: 이 공모전 출품작을 "영상 관리" 화면에서 필터된 채로
   * 열기.  대시보드 개편으로 영상/공모전 화면이 분리되며 끊긴 동선을
   * 복구한다.  미전달 시 버튼을 렌더하지 않음(하위 호환).
   */
  onViewCompetitionVideos?: (competition: Competition) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [competitionVideos, setCompetitionVideos] = useState<Record<string, CompetitionSubmissionVideo[]>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"views" | "likes" | "newest">("views");
  const [pendingFeaturedId, setPendingFeaturedId] = useState<string | null>(null);
  const [pendingFeaturedCompetitionId, setPendingFeaturedCompetitionId] = useState<string | null>(null);
  // G5: free-text search across competition title / id / sponsor.
  const [search, setSearch] = useState("");

  const sortedCompetitions = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? competitions.filter((c) =>
          [c.title, c.id, c.sponsor]
            .filter((s): s is string => Boolean(s))
            .some((s) => s.toLowerCase().includes(q)),
        )
      : competitions;
    return [...filtered].sort((a, b) => {
      const af = a.isFeatured ? 1 : 0;
      const bf = b.isFeatured ? 1 : 0;
      if (af !== bf) return bf - af;
      return 0;
    });
  }, [competitions, search]);

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
        {/* G5: free-text search */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="검색 (제목/ID/스폰서)"
          className={cn(adminTokens.input, "min-w-[180px] text-[12px]")}
        />
      </div>

      {/* 고정 높이 스크롤 — 공모전이 많아도 카드가 무한정 길어지지
          않게 해서 아래 트로피/생성 섹션이 항상 보이도록. */}
      <div className="max-h-[560px] space-y-1 overflow-y-auto pr-0.5">
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

                  {onViewCompetitionVideos ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewCompetitionVideos(comp);
                      }}
                      className="flex h-7 items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.02] px-2 text-[11px] font-medium text-white/50 transition hover:bg-white/[0.06] hover:text-white/80"
                      title="이 공모전 출품작을 영상 관리에서 보기"
                    >
                      <Film size={10} aria-hidden />
                      출품작
                    </button>
                  ) : null}

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
                        <CompetitionSubmissionRow
                          key={video.id}
                          video={video}
                          compId={comp.id}
                          loading={loading}
                          pendingFeaturedId={pendingFeaturedId}
                          onToggleFeatured={handleToggleFeatured}
                          onRunVideoAction={runVideoAction}
                        />
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
