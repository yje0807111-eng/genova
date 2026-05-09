"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/genova/language-provider";
import { intlDateLocale } from "@/lib/i18n/browser-locale";
import { formatPrizeWithConversion } from "@/lib/utils/format-prize";
import { mainGenreLabel } from "@/lib/constants/genres";
import { cn } from "@/lib/utils/cn";
import { VideoCard } from "@/components/video/video-card";
import type { Video as AppVideo } from "@/lib/types";
import { Trophy, Calendar, Clock, ChevronLeft, Upload, Star, Grid, List, Users, Award, Medal } from "lucide-react";

type Competition = {
  id: string;
  title: string;
  title_ko?: string | null;
  title_en?: string | null;
  title_ja?: string | null;
  genre: string;
  status: string;
  deadline: string;
  vote_end: string;
  prize_info: string;
  prize_info_ko?: string | null;
  prize_info_en?: string | null;
  prize_info_ja?: string | null;
  sponsor: string | null;
  description: string | null;
  rules: string | null;
  rules_ko?: string | null;
  rules_en?: string | null;
  rules_ja?: string | null;
  eligibility: string | null;
  eligibility_ko?: string | null;
  eligibility_en?: string | null;
  eligibility_ja?: string | null;
  judging_criteria?: string | null;
  judging_criteria_ko?: string | null;
  judging_criteria_en?: string | null;
  judging_criteria_ja?: string | null;
  submission_guidelines?: string | null;
  submission_guidelines_ko?: string | null;
  submission_guidelines_en?: string | null;
  submission_guidelines_ja?: string | null;
  announcement?: string | null;
  announcement_ko?: string | null;
  announcement_en?: string | null;
  announcement_ja?: string | null;
  thumbnail_url: string | null;
  banner_url: string | null;
  concept: string | null;
  concept_ko?: string | null;
  concept_en?: string | null;
  concept_ja?: string | null;
  prize_grand?: string | null;
  prize_excellence?: string | null;
  prize_merit?: string | null;
  prize_audience?: string | null;
  prize_audience_count?: number | null;
  exchange_rate_usd_krw?: number | null;
  exchange_rate_usd_jpy?: number | null;
  base_currency?: string | null;
};

type Video = {
  id: string;
  title: string;
  description?: string | null;
  genre?: string | null;
  thumbnail_url: string | null;
  view_count: number | null;
  uploaded_by: string | null;
  created_at: string;
  award: string | null;
  is_competition_featured?: boolean | null;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
};

type CompetitionDetailProps = {
  competition: Competition;
  videos: Video[];
  featuredVideos: Video[];
};

function competitionRowToAppVideo(video: Video): AppVideo {
  const row = video as Video & { runtime?: string | null; like_count?: number | null; mux_playback_id?: string | null };
  return {
    id: video.id,
    title: video.title,
    thumbnailUrl: video.thumbnail_url ?? "",
    vimeoId: null,
    muxPlaybackId: row.mux_playback_id ?? null,
    genre: video.genre ?? "film",
    subGenre: null,
    purpose: "competition",
    creatorId: null,
    isOriginal: false,
    isFinalist: Boolean(video.award),
    isCompetitionFeatured: Boolean(video.is_competition_featured),
    award: video.award ?? null,
    runtime: row.runtime ?? "",
    createdAt: video.created_at,
    visibility: "public",
    description: video.description ?? "",
    aiTools: [],
    tags: [],
    seriesName: null,
    episodeNumber: null,
    uploadedBy: video.uploaded_by ?? null,
    uploaderDisplayName: video.profiles?.display_name ?? null,
    uploaderAvatarUrl: video.profiles?.avatar_url ?? null,
    viewCount: video.view_count ?? 0,
    likeCount: row.like_count ?? 0,
  };
}

function dDay(deadline: string) {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
}

export function CompetitionDetailClient({ competition, videos, featuredVideos }: CompetitionDetailProps) {
  const { t, locale } = useI18n();
  const dateLocale = intlDateLocale(locale);
  const [sortBy, setSortBy] = useState<"views" | "newest" | "award">("views");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"overview" | "judging" | "faq" | "entries">("overview");

  useEffect(() => {
    console.log("[COMP_CLIENT_DEBUG]", {
      videosLength: videos.length,
      videos: videos.map((v) => ({ id: v.id, title: v.title })),
    });
  }, [videos]);

  const getText = (ko: string | null | undefined, en: string | null | undefined, ja: string | null | undefined, fallback: string) => {
    if (locale === "ko") return ko || en || ja || fallback;
    if (locale === "ja") return ja || en || ko || fallback;
    return en || ko || ja || fallback;
  };

  const prizeText = getText(competition.prize_info_ko, competition.prize_info_en, competition.prize_info_ja, competition.prize_info);
  const prizeDisplay = formatPrizeWithConversion(
    competition.prize_info_ko, competition.prize_info_en, competition.prize_info_ja,
    competition.prize_info, locale, competition.base_currency,
    competition.exchange_rate_usd_krw ?? 1350, competition.exchange_rate_usd_jpy ?? 148,
  );

  const rulesText = getText(competition.rules_ko, competition.rules_en, competition.rules_ja, competition.rules ?? "");
  const rules = rulesText ? rulesText.split("\n").filter(Boolean) : [];

  const d = dDay(competition.deadline);
  const isOpen = ["Open", "접수중", "In Review", "Voting"].includes(competition.status);
  const isUpcoming = ["Upcoming", "예정"].includes(competition.status);
  const isClosed = !isOpen && !isUpcoming;

  const bannerImage = competition.banner_url || competition.thumbnail_url || null;
  const concept = getText(competition.concept_ko, competition.concept_en, competition.concept_ja, competition.concept ?? "") || null;

  const sortedVideos = [...videos]
    .sort((a, b) => {
      if (sortBy === "views") return (b.view_count ?? 0) - (a.view_count ?? 0);
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "award") return (a.award ? -1 : 1);
      return 0;
    })
    .sort((a, b) => {
      if (a.is_competition_featured && !b.is_competition_featured) return -1;
      if (!a.is_competition_featured && b.is_competition_featured) return 1;
      return 0;
    });

  const deadlineLabel = new Date(competition.deadline).toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" });
  const voteEndLabel = new Date(competition.vote_end).toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" });

  const prizeItems = [
    { label: "대상", value: competition.prize_grand, icon: "🥇", glowColor: "rgba(255,215,0,0.3)", borderColor: "rgba(255,215,0,0.25)", bgColor: "rgba(255,215,0,0.06)" },
    { label: "최우수상", value: competition.prize_excellence, icon: "🥈", glowColor: "rgba(192,192,192,0.3)", borderColor: "rgba(192,192,192,0.2)", bgColor: "rgba(192,192,192,0.04)" },
    { label: "우수상", value: competition.prize_merit, icon: "🥉", glowColor: "rgba(205,127,50,0.3)", borderColor: "rgba(205,127,50,0.2)", bgColor: "rgba(205,127,50,0.04)" },
    { label: `장려상${(competition.prize_audience_count ?? 1) > 1 ? ` ×${competition.prize_audience_count}` : ""}`, value: competition.prize_audience, icon: "🎖", glowColor: "rgba(127,119,221,0.3)", borderColor: "rgba(127,119,221,0.25)", bgColor: "rgba(83,74,183,0.08)" },
  ];

  return (
    <div className="min-h-screen text-white" style={{ background: "#080618", fontFamily: "'Inter', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif", WebkitFontSmoothing: "antialiased" }}>

      {/* ── Hero ─────────────────────────────────── */}
      <div className="relative w-full overflow-hidden -mt-16" style={{ height: "420px" }}>
        {bannerImage ? (
          <img src={bannerImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1a1547 0%, #0f0d24 100%)" }}>
            <img src="/genova-logo.png" alt="Genova" className="h-24 w-24 object-contain opacity-20" />
          </div>
        )}
        {/* overlays */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(8,6,24,0.95) 0%, rgba(8,6,24,0.7) 45%, rgba(8,6,24,0.2) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,6,24,1) 0%, rgba(8,6,24,0.3) 30%, transparent 60%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(8,6,24,0.95) 0%, rgba(8,6,24,0.3) 15%, transparent 35%)" }} />

        {/* back */}
        <Link href="/competition" className="absolute left-8 top-20 z-20 flex items-center gap-2 rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-[12px] text-white/60 backdrop-blur-sm transition hover:border-white/30 hover:text-white">
          <ChevronLeft size={14} />
          공모전 목록
        </Link>

        {/* content */}
        <div className="absolute bottom-0 left-0 z-20 p-10 pb-12" style={{ maxWidth: "80%" }}>
          {/* badges */}
          <div className="mb-2 flex items-center gap-2.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${
              isOpen ? "text-emerald-400" :
              isUpcoming ? "text-sky-300/80" :
              "text-white/35"
            }`}>
              <span className={`${isOpen ? "text-emerald-400/90" : isUpcoming ? "text-sky-300/70" : "text-white/35"}`}>●</span>
              {isOpen ? "모집 중" : isUpcoming ? "예정" : "종료"}
            </span>
            {competition.sponsor && (
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#AFA9EC]">
                ✦ SPONSORED BY {competition.sponsor.toUpperCase()}
              </span>
            )}
          </div>

          {/* title */}
          <h1
            className="mb-1 whitespace-nowrap text-[clamp(1.8rem,3.5vw,3.6rem)] font-black leading-tight tracking-tight"
            style={{
              backgroundImage: "linear-gradient(135deg, #ffffff 0%, #e8e4ff 50%, #AFA9EC 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {getText(competition.title_ko, competition.title_en, competition.title_ja, competition.title)}
          </h1>

          {competition.description && (
            <p className="mb-3 mt-1 text-[16px] text-white/65 leading-relaxed">{competition.description}</p>
          )}

          {/* meta row */}
          <div className="mb-6 flex flex-wrap items-center gap-4 text-[13px] text-white/50">
            <div className="flex items-center gap-1.5">
              <Trophy size={13} className="text-[#C8963E]" />
              <span className="font-bold text-[#C8963E]">{prizeDisplay}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={13} />
              <span>마감 {deadlineLabel}</span>
            </div>
            {d > 0 && isOpen && (
              <div className="flex items-center gap-1.5">
                <Clock size={13} />
                <span className="font-bold text-white/80">D-{d}</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            {isOpen && (
              <Link
                href={`/upload?competition=${competition.id}&purpose=competition`}
                className="inline-flex items-center gap-2 rounded-xl px-9 py-2 text-[14px] font-bold text-white transition-all duration-300 hover:scale-[1.03]"
                style={{
                  background: "linear-gradient(125deg, #5B7FE8 0%, #6B5FD4 35%, #7B4FCC 65%, #5B35B0 100%)",
                  border: "1px solid rgba(150,170,255,0.3)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 20px rgba(100,120,255,0.4)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none"; }}
              >
                <Upload size={15} />
                출품하기
              </Link>
            )}
            <button
              type="button"
              onClick={() => setActiveTab("entries")}
              className="inline-flex items-center gap-2 rounded-xl px-8 py-2 text-[14px] font-semibold text-white/60 transition hover:text-white/90"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
            >
              출품작 보기 →
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-white/[0.07]" style={{ background: "rgba(8,6,24,0.96)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto max-w-[1400px] px-8">
          <div className="flex">
            {[
              { key: "overview", label: "개요" },
              { key: "judging", label: "심사 및 시상" },
              { key: "faq", label: "문의" },
              { key: "entries", label: `출품작 (${videos.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`-mb-px border-b-2 px-5 py-3.5 text-[13px] font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? "border-[#7F77DD] text-white"
                    : "border-transparent text-white/35 hover:text-white/65"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────── */}
      <div className="mx-auto max-w-[1400px] px-8 py-10">

        {/* 개요 */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <style>{`
              .overview-bg { background: linear-gradient(160deg, rgba(16,12,32,0.6) 0%, rgba(8,6,20,0.7) 100%); }
            `}</style>

            {/* 공모전 소개 + 참가 규칙 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] items-stretch">

              {/* 왼쪽 — 공모전 소개 */}
              <div className="h-full">
                <div
                  className="relative h-full overflow-hidden rounded-2xl"
                  style={{
                    border: "1px solid rgba(127,119,221,0.18)",
                    background: "linear-gradient(160deg, rgba(16,12,32,0.92) 0%, rgba(8,6,20,0.96) 100%)",
                    boxShadow: "0 0 30px rgba(83,74,183,0.08), inset 0 1px 0 rgba(127,119,221,0.15)",
                  }}
                >
                  <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-[50%]">
                    <img
                      src="/competition-trophy.png"
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover object-center"
                      style={{ opacity: 0.4, filter: "saturate(1.05) brightness(0.78)" }}
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(8,6,20,1) 0%, rgba(8,6,20,0.6) 35%, rgba(8,6,20,0.1) 75%, rgba(8,6,20,0) 100%)" }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(8,6,20,0.5) 0%, transparent 25%, transparent 75%, rgba(8,6,20,0.5) 100%)" }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to left, transparent 0%, rgba(8,6,24,0.3) 45%, rgba(8,6,24,0.7) 100%)" }} />
                  </div>

                  {/* 우측 배경 글로우 orb */}
                  <div
                    className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2"
                    style={{
                      width: "300px",
                      height: "300px",
                      borderRadius: "50%",
                      background: "radial-gradient(circle, rgba(83,74,183,0.05) 0%, transparent 72%)",
                      filter: "blur(48px)",
                    }}
                  />
                  {/* 좌측 보라 글로우 orb */}
                  <div
                    className="pointer-events-none absolute left-0 bottom-0"
                    style={{
                      width: "200px",
                      height: "200px",
                      borderRadius: "50%",
                      background: "radial-gradient(circle, rgba(83,74,183,0.1) 0%, transparent 70%)",
                      filter: "blur(50px)",
                    }}
                  />
                  {/* 상단 shimmer 라인 */}
                  <div
                    className="pointer-events-none absolute top-0 left-0 right-0 h-px"
                    style={{
                      background: "linear-gradient(to right, transparent, rgba(127,119,221,0.5) 30%, rgba(175,169,236,0.3) 60%, transparent)",
                    }}
                  />

                  <div className="relative z-10 p-8">
                  {/* eyebrow */}
                  <div className="mb-1 flex items-center gap-1.5">
                    <span
                      className="text-[11px] font-black"
                      style={{
                        backgroundImage: "linear-gradient(135deg, #534AB7 0%, #3D35A0 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >✦</span>
                    <p
                      className="text-[11px] font-black uppercase tracking-[0.2em]"
                      style={{
                        backgroundImage: "linear-gradient(135deg, #3D35A0 0%, #534AB7 60%, #4A42A8 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >Contest Overview</p>
                  </div>

                  {/* 제목 */}
                  <h2
                    className="mb-3 font-bold tracking-tight text-white/85"
                    style={{
                      fontSize: "clamp(1rem,1.4vw,1.3rem)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    공모전 소개
                  </h2>

                    {/* 본문 */}
                    {concept ? (
                      <div className="space-y-5">
                        {concept.split("\n").filter(Boolean).map((line, i) => (
                          i === 0 ? (
                            <div key={i} className="flex items-center gap-2.5">
                              <span className="shrink-0 text-[18px] text-[#7F77DD]" style={{ filter: "drop-shadow(0 0 6px rgba(127,119,221,0.6))" }}>✦</span>
                              <p className="text-[17px] font-bold leading-snug text-white/90">{line}</p>
                            </div>
                          ) : i === 1 ? (
                            <p key={i} className="mt-3 pl-6 text-[15px] leading-[1.8] text-white/55">{line}</p>
                          ) : (
                            <p key={i} className="pl-6 text-[15px] leading-[1.8] text-white/55">{line}</p>
                          )
                        ))}
                      </div>
                    ) : (
                      <p className="text-[14px] text-white/25">소개 내용이 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 오른쪽 — 참가 규칙 */}
              <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-[#080618]/40 p-5 backdrop-blur-xl" style={{ boxShadow: "0 0 30px rgba(83,74,183,0.08), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
                <div className="pointer-events-none absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(127,119,221,0.5) 30%, rgba(175,169,236,0.3) 60%, transparent)" }} />
                <div className="pointer-events-none absolute right-0 bottom-0 w-40 h-40 rounded-full" style={{ background: "radial-gradient(circle, rgba(83,74,183,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
                <h2 className="mb-4 text-[16px] font-bold text-white">참가 규칙</h2>
                <div className="divide-y divide-white/[0.05]">
                  {[
                    {
                      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/></svg>,
                      label: "참가 자격",
                      value: getText(competition.eligibility_ko, competition.eligibility_en, competition.eligibility_ja, competition.eligibility ?? "") || "제한 없음",
                    },
                    {
                      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4" strokeLinecap="round"/></svg>,
                      label: "출품 형식",
                      value: getText(competition.submission_guidelines_ko, competition.submission_guidelines_en, competition.submission_guidelines_ja, competition.submission_guidelines ?? "") || "AI 생성 영상",
                    },
                    {
                      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/></svg>,
                      label: "출품 수",
                      value: "제한 없음",
                    },
                    {
                      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinecap="round"/></svg>,
                      label: "참가 지역",
                      value: "전 세계",
                    },
                    {
                      icon: <Star size={16} />,
                      label: "심사 방법",
                      value: getText(competition.judging_criteria_ko, competition.judging_criteria_en, competition.judging_criteria_ja, competition.judging_criteria ?? "") || "심사위원 + 시청자 투표",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex gap-2.5 py-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#AFA9EC]" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-white/30">{item.label}</p>
                        <p className="mt-0.5 line-clamp-1 text-[12px] font-medium text-white/70">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 하단 구역 — 공유 배경 */}
            <div
              className="relative overflow-hidden rounded-2xl px-8"
              style={{
                border: "1px solid rgba(127,119,221,0.1)",
                background: "linear-gradient(160deg, rgba(14,10,28,0.7) 0%, rgba(8,6,18,0.8) 100%)",
              }}
            >
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(127,119,221,0.3) 40%, transparent)" }} />

            {/* 주제 — 전체 너비 카드 스타일 */}
            {rules.length > 0 && (
              <div className="py-8 border-t border-white/[0.06]">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[10px] text-[#7F77DD]">✦</span>
                  <h2 className="text-[18px] font-bold text-white">주제</h2>
                </div>
                <div className="space-y-0 divide-y divide-white/[0.05]">
                  {rules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-3 py-5">
                      <span
                        className="shrink-0 text-xs font-mono font-bold tabular-nums leading-none text-right text-[#7F77DD]"
                        style={{
                          minWidth: "48px",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="h-5 w-px shrink-0 bg-white/10" />
                      <p className="text-[15px] leading-relaxed text-white/70">{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 상금 구성 — 균등 그리드 + 1등 강조 (Stripe 스타일) */}
            <div className="py-10 border-t border-white/[0.06]">
              <div className="mb-7 flex items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#7F77DD]">✦</span>
                  <h2 className="text-[22px] font-black tracking-tight text-white">상금 구성</h2>
                  <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7F77DD] to-transparent" />
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-md">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/40">Total</span>
                  <span className="h-3 w-px bg-white/15" />
                  <span
                    className="text-[20px] font-black tabular-nums leading-none"
                    style={{
                      backgroundImage: "linear-gradient(135deg, #FFE9B0 0%, #F5D182 55%, #C8963E 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {prizeDisplay}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                {[
                  {
                    rank: "01",
                    eyebrow: "Grand Prize",
                    label: "대상",
                    value: competition.prize_grand,
                    Icon: Trophy,
                    isHero: true,
                    accent: "#FFD478",
                    accentDark: "#C8963E",
                    cardBg: "linear-gradient(155deg, rgba(200,150,62,0.18) 0%, rgba(120,80,30,0.08) 50%, rgba(20,15,40,0.7) 100%)",
                    cardBorder: "rgba(200,150,62,0.4)",
                    cardShadow: "0 0 40px rgba(200,150,62,0.15), inset 0 1px 0 rgba(255,215,128,0.25)",
                    glowColor: "rgba(255,215,128,0.2)",
                    iconBg: "rgba(255,215,128,0.12)",
                    iconBorder: "rgba(255,215,128,0.3)",
                    valueGradient: "linear-gradient(135deg, #FFE9B0 0%, #FFD478 50%, #C8963E 100%)",
                    rankGradient: "linear-gradient(135deg, rgba(255,215,128,0.5) 0%, rgba(200,150,62,0.2) 100%)",
                    divider: "rgba(200,150,62,0.2)",
                  },
                  {
                    rank: "02",
                    eyebrow: "Excellence",
                    label: "최우수상",
                    value: competition.prize_excellence,
                    Icon: Award,
                    isHero: false,
                    accent: "#E0E5EC",
                    accentDark: "#A8B0BD",
                    cardBg: "linear-gradient(155deg, rgba(180,190,210,0.08) 0%, rgba(20,15,40,0.6) 60%, rgba(15,10,30,0.5) 100%)",
                    cardBorder: "rgba(180,190,210,0.18)",
                    cardShadow: "0 0 24px rgba(180,190,210,0.06)",
                    glowColor: "rgba(200,210,225,0.12)",
                    iconBg: "rgba(200,210,225,0.08)",
                    iconBorder: "rgba(200,210,225,0.18)",
                    divider: "rgba(180,190,210,0.12)",
                  },
                  {
                    rank: "03",
                    eyebrow: "Merit",
                    label: "우수상",
                    value: competition.prize_merit,
                    Icon: Medal,
                    isHero: false,
                    accent: "#D89060",
                    accentDark: "#A66A3D",
                    cardBg: "linear-gradient(155deg, rgba(205,127,50,0.1) 0%, rgba(20,15,40,0.6) 60%, rgba(15,10,30,0.5) 100%)",
                    cardBorder: "rgba(205,127,50,0.2)",
                    cardShadow: "0 0 24px rgba(205,127,50,0.06)",
                    glowColor: "rgba(216,144,96,0.14)",
                    iconBg: "rgba(216,144,96,0.1)",
                    iconBorder: "rgba(216,144,96,0.22)",
                    divider: "rgba(205,127,50,0.14)",
                  },
                  {
                    rank: "04",
                    eyebrow: "Honorable",
                    label: `장려상${(competition.prize_audience_count ?? 1) > 1 ? ` × ${competition.prize_audience_count}` : ""}`,
                    value: competition.prize_audience,
                    suffix: (competition.prize_audience_count ?? 1) > 1 ? "/ each" : undefined,
                    Icon: Star,
                    isHero: false,
                    accent: "#AFA9EC",
                    accentDark: "#7F77DD",
                    cardBg: "linear-gradient(155deg, rgba(127,119,221,0.1) 0%, rgba(20,15,40,0.6) 60%, rgba(15,10,30,0.5) 100%)",
                    cardBorder: "rgba(127,119,221,0.22)",
                    cardShadow: "0 0 24px rgba(127,119,221,0.08)",
                    glowColor: "rgba(127,119,221,0.16)",
                    iconBg: "rgba(127,119,221,0.12)",
                    iconBorder: "rgba(127,119,221,0.25)",
                    divider: "rgba(127,119,221,0.16)",
                  },
                ].map((tier) => (
                  <div
                    key={tier.rank}
                    className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      background: "linear-gradient(to bottom, rgba(21,16,46,0.8) 0%, rgba(12,8,32,0.8) 100%)",
                      border:
                        tier.rank === "01"
                          ? "1px solid rgba(245,209,130,0.3)"
                          : tier.rank === "02"
                            ? "1px solid rgba(255,255,255,0.15)"
                            : tier.rank === "03"
                              ? "1px solid rgba(205,127,50,0.3)"
                              : "1px solid rgba(175,169,236,0.3)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 0 24px rgba(0,0,0,0.22)",
                    }}
                  >
                    {/* 글로우 orb */}
                    <div
                      className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full transition-opacity duration-500"
                      style={{
                        background: `radial-gradient(circle, ${tier.glowColor} 0%, transparent 70%)`,
                        filter: "blur(30px)",
                        opacity: tier.isHero ? 1 : 0.6,
                      }}
                    />
                    {/* shimmer 라인 (Hero 전용) */}
                    {tier.isHero && (
                      <div
                        className="pointer-events-none absolute top-0 left-0 right-0 h-px"
                        style={{ background: "linear-gradient(to right, transparent, rgba(255,215,128,0.7) 50%, transparent)" }}
                      />
                    )}

                    <div className="relative z-10 flex h-full flex-col">
                      {/* Header: Icon + Rank Number */}
                      <div className="flex items-start justify-between">
                        <tier.Icon
                          size={tier.isHero ? 20 : 18}
                          style={{
                            color:
                              tier.rank === "01"
                                ? "#F5D182"
                                : tier.rank === "02"
                                  ? "rgba(255,255,255,0.7)"
                                  : tier.rank === "03"
                                    ? "#CD7F32"
                                    : "#AFA9EC",
                          }}
                          strokeWidth={tier.isHero ? 2 : 1.75}
                        />
                        <span className="absolute right-3 top-3 text-xs font-mono text-white/40">
                          #{Number(tier.rank)}
                        </span>
                      </div>

                      {/* Eyebrow + Label */}
                      <div className="mt-5">
                        <p
                          className="text-[10px] font-black uppercase tracking-[0.22em]"
                          style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          {tier.eyebrow}
                        </p>
                        <p
                          className="mt-1.5 text-[18px] font-bold tracking-tight"
                          style={{ color: tier.isHero ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.9)" }}
                        >
                          {tier.label}
                        </p>
                      </div>

                      {/* Value */}
                      <div
                        className="mt-5 pt-5"
                        style={{ borderTop: `1px solid ${tier.divider}` }}
                      >
                        <p
                          className="text-3xl font-bold leading-none tracking-tight tabular-nums"
                          style={{
                            color:
                              tier.rank === "01"
                                ? "#F5D182"
                                : tier.rank === "02"
                                  ? "#FFFFFF"
                                  : tier.rank === "03"
                                    ? "#CD7F32"
                                    : "#AFA9EC",
                          }}
                        >
                          {tier.value ?? "—"}
                        </p>
                        {tier.suffix && (
                          <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-white/30">
                            {tier.suffix}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 주요 일정 — Progress Timeline */}
            <div className="py-10 border-t border-white/[0.06]">
              <div className="mb-8 flex items-end justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#7F77DD]">✦</span>
                  <h2 className="text-[22px] font-black tracking-tight text-white">주요 일정</h2>
                  <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7F77DD] to-transparent" />
                </div>
                {d > 0 && isOpen && (
                  <div className="text-right">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">CLOSING IN</p>
                    <p className="text-2xl font-bold leading-none tabular-nums text-[#7F77DD]">
                      D-{d}
                    </p>
                  </div>
                )}
              </div>

              {(() => {
                const stages = [
                  { label: "접수 시작", date: null, done: true, active: false },
                  { label: "접수 마감", date: deadlineLabel, done: isClosed, active: isOpen },
                  { label: "심사", date: null, done: false, active: false },
                  { label: "투표 마감", date: voteEndLabel, done: false, active: false },
                  { label: "시상식", date: null, done: false, active: false },
                ];
                const activeIdx = stages.findIndex((s) => s.active);
                const lastDoneIdx = stages.map((s) => s.done).lastIndexOf(true);
                const currentIdx = activeIdx >= 0 ? activeIdx : lastDoneIdx;
                const progress = stages.length > 1 ? (currentIdx / (stages.length - 1)) * 100 : 0;

                return (
                  <div className="relative">
                    {/* Progress Bar */}
                    <div
                      className="relative mb-9 h-[6px] w-full overflow-hidden rounded-full"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
                      }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                        style={{
                          width: `${progress}%`,
                          background: "linear-gradient(to right, #534AB7 0%, #7F77DD 60%, #AFA9EC 100%)",
                          boxShadow: "0 0 16px rgba(127,119,221,0.7), 0 0 4px rgba(175,169,236,0.5)",
                        }}
                      />
                    </div>

                    {/* Stages */}
                    <div className="grid grid-cols-5 gap-3">
                      {stages.map((stage, idx) => {
                        const isPast = idx < currentIdx || (stage.done && !stage.active);
                        const isNow = stage.active;

                        return (
                          <div key={stage.label} className="relative flex flex-col items-center text-center">
                            {/* Node Marker */}
                            <div
                              className="absolute flex items-center justify-center rounded-full transition-all duration-300"
                              style={
                                isNow
                                  ? {
                                      top: "-50px",
                                      width: "20px",
                                      height: "20px",
                                      background: "#AFA9EC",
                                      boxShadow: "0 0 0 5px rgba(127,119,221,0.3), 0 0 24px rgba(127,119,221,0.8)",
                                    }
                                  : isPast
                                    ? {
                                        top: "-46px",
                                        width: "12px",
                                        height: "12px",
                                        background: "#7F77DD",
                                        boxShadow: "0 0 8px rgba(127,119,221,0.5)",
                                      }
                                    : {
                                        top: "-46px",
                                        width: "12px",
                                        height: "12px",
                                        background: "rgba(255,255,255,0.18)",
                                        border: "1.5px solid rgba(255,255,255,0.25)",
                                      }
                              }
                            >
                              {isNow && (
                                <span
                                  className="absolute h-full w-full animate-ping rounded-full"
                                  style={{ background: "rgba(175,169,236,0.6)" }}
                                />
                              )}
                            </div>

                            {/* Card Container */}
                            <div
                              className="w-full rounded-xl px-4 py-4 transition-all duration-300"
                              style={
                                isNow
                                  ? {
                                      background: "rgba(8,6,24,0.4)",
                                      border: "1px solid rgba(127,119,221,0.4)",
                                      backdropFilter: "blur(12px)",
                                      boxShadow: "0 0 24px rgba(127,119,221,0.15)",
                                    }
                                  : {
                                      background: "rgba(8,6,24,0.4)",
                                      border: "1px solid rgba(255,255,255,0.1)",
                                      backdropFilter: "blur(12px)",
                                    }
                              }
                            >
                              {/* Step number */}
                              <p
                                className="text-[10px] font-black uppercase tracking-[0.22em]"
                                style={{
                                  color: isNow ? "#AFA9EC" : isPast ? "rgba(175,169,236,0.85)" : "rgba(255,255,255,0.5)",
                                }}
                              >
                                Step {String(idx + 1).padStart(2, "0")}
                              </p>

                              {/* Label */}
                              <p
                                className="mt-2 text-[16px] font-bold tracking-tight"
                                style={{
                                  color: isNow ? "rgba(255,255,255,1)" : isPast ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.75)",
                                }}
                              >
                                {stage.label}
                              </p>

                              {/* Date */}
                              <p
                                className="mt-1.5 text-[13px] font-semibold tabular-nums"
                                style={{
                                  color: stage.date ? (isNow ? "#AFA9EC" : isPast ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.5)") : "rgba(255,255,255,0.3)",
                                }}
                              >
                                {stage.date ?? "TBD"}
                              </p>

                              {/* 진행 중 뱃지 */}
                              {isNow && (
                                <div className="mt-2.5 flex justify-center">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                                    <span className="text-emerald-400 animate-pulse">●</span>
                                    Live
                                  </span>
                                </div>
                              )}
                              {isPast && !isNow && (
                                <div className="mt-2.5 flex justify-center">
                                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider" style={{ color: "rgba(175,169,236,0.8)" }}>
                                    ✓ Done
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
            </div>

          </div>
        )}

        {/* 심사 및 시상 */}
        {activeTab === "judging" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <div
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080618]/40 p-8 backdrop-blur-xl"
                style={{ boxShadow: "0 0 30px rgba(83,74,183,0.08), inset 0 1px 0 rgba(255,255,255,0.05)" }}
              >
                <div className="pointer-events-none absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(127,119,221,0.45) 30%, rgba(175,169,236,0.25) 60%, transparent)" }} />
                <div className="mb-6 flex items-center gap-3">
                  <span className="text-sm text-[#7F77DD]">✦</span>
                  <h2 className="text-[22px] font-black tracking-tight text-white">심사 방법</h2>
                  <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7F77DD] to-transparent" />
                </div>

                <div className="grid gap-3">
                  {[
                    {
                      step: "STEP 01",
                      title: "1차 심사 — 운영진 사전 검토",
                      desc: "출품 규정 준수 여부 및 기본 완성도를 검토합니다.",
                    },
                    {
                      step: "STEP 02",
                      title: "2차 심사 — 심사위원 평가 (100%)",
                      desc: getText(
                        competition.judging_criteria_ko,
                        competition.judging_criteria_en,
                        competition.judging_criteria_ja,
                        competition.judging_criteria ?? "",
                      ) || "심사 기준 정보가 아직 등록되지 않았습니다.",
                    },
                    {
                      step: "STEP 03",
                      title: "최종 발표",
                      desc: `최종 결과는 투표 마감일(${voteEndLabel}) 이후 공개됩니다.`,
                    },
                  ].map((item) => (
                    <div key={item.step} className="space-y-2 rounded-xl border border-white/10 bg-[#080618]/40 p-5 backdrop-blur-xl">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#7F77DD]">{item.step}</p>
                      <p className="text-base font-bold text-white">{item.title}</p>
                      <p className="text-sm leading-relaxed text-white/60">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-white/10 bg-[#080618]/40 p-5 backdrop-blur-xl">
                  <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#7F77DD]">EVALUATION WEIGHTS</p>
                  <div className="space-y-3">
                    {[
                      { label: "창의성", weight: 35 },
                      { label: "기술 완성도", weight: 25 },
                      { label: "스토리텔링", weight: 25 },
                      { label: "임팩트", weight: 15 },
                    ].map((metric) => (
                      <div key={metric.label}>
                        <div className="mb-1 flex items-center justify-between text-xs text-white/65">
                          <span>{metric.label}</span>
                          <span className="font-mono text-white/45">{metric.weight}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${metric.weight}%`,
                              background: "linear-gradient(to right, rgba(127,119,221,0.9), rgba(175,169,236,0.75))",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-white/10 bg-[#080618]/40 p-5 backdrop-blur-xl">
                  <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#7F77DD]">JUDGING SCHEDULE</p>
                  <div className="space-y-2 text-sm text-white/70">
                    <p>1차 심사 기간 · 접수 시작 ~ {deadlineLabel}</p>
                    <p>2차 심사 기간 · 마감 이후 ~ {voteEndLabel}</p>
                    <p>결과 발표 · {voteEndLabel} 이후</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div
                className="relative overflow-hidden rounded-xl border border-white/10 bg-[#080618]/40 p-5 backdrop-blur-xl lg:sticky lg:top-24"
                style={{ boxShadow: "0 0 24px rgba(83,74,183,0.08), inset 0 1px 0 rgba(255,255,255,0.05)" }}
              >
                <h2 className="mb-4 text-[18px] font-bold text-white">상금 구성</h2>
                <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">TOTAL</p>
                  <p className="text-2xl font-bold text-[#F5D182]">{prizeDisplay}</p>
                </div>

                <div>
                  {prizeItems.map((tier, idx) => {
                    const iconColor =
                      idx === 0
                        ? "#F5D182"
                        : idx === 1
                          ? "rgba(255,255,255,0.7)"
                          : idx === 2
                            ? "#CD7F32"
                            : "#AFA9EC";
                    const Icon = idx === 0 ? Trophy : idx === 1 ? Award : idx === 2 ? Medal : Star;

                    return (
                      <div key={tier.label} className="flex items-center justify-between border-b border-white/[0.06] py-2 last:border-b-0">
                        <div className="flex items-center gap-2">
                          <Icon size={14} style={{ color: iconColor }} />
                          <span className="text-sm text-white/80">{tier.label}</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-white">{tier.value ?? "—"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 문의 */}
        {activeTab === "faq" && (
          <div className="max-w-2xl space-y-5">
            {(competition.announcement_ko || competition.announcement_en || competition.announcement_ja || competition.announcement) && (
              <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, rgba(83,74,183,0.15) 0%, rgba(40,35,100,0.1) 100%)", border: "1px solid rgba(127,119,221,0.2)" }}>
                <h2 className="mb-3 text-[18px] font-bold text-white">공지사항</h2>
                <p className="text-[13px] leading-relaxed text-white/60 whitespace-pre-wrap">
                  {getText(competition.announcement_ko, competition.announcement_en, competition.announcement_ja, competition.announcement ?? "")}
                </p>
              </div>
            )}

            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="text-sm text-[#7F77DD]">✦</span>
                <h2 className="text-[22px] font-black tracking-tight text-white">자주 묻는 질문</h2>
                <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7F77DD] to-transparent" />
              </div>
              <div className="space-y-2">
                {[
                  { q: "AI 영상이 아닌 영상도 출품할 수 있나요?", a: "아니요. Genova는 AI로 제작된 영상만 출품 가능합니다. 출품 시 사용한 AI 툴을 반드시 태그해야 합니다." },
                  { q: "출품 수 제한이 있나요?", a: "제한 없이 여러 작품을 출품할 수 있습니다. 단, 각 영상은 독립적인 작품이어야 합니다." },
                  { q: "수상 결과는 언제 발표되나요?", a: "투표 마감 후 심사위원 심사를 거쳐 결과가 발표됩니다. 정확한 일정은 공지사항을 확인해주세요." },
                  { q: "저작권은 누구에게 있나요?", a: "출품작의 저작권은 창작자에게 귀속됩니다. Genova는 플랫폼 내 홍보 목적으로만 작품을 사용합니다." },
                  { q: "상금은 어떻게 지급되나요?", a: "수상자 확인 후 개별 연락을 통해 지급 방식을 안내드립니다." },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="space-y-3 rounded-xl border border-white/[0.08] bg-[#080618]/40 p-5 backdrop-blur-xl transition-colors duration-200 hover:border-white/15"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 shrink-0 font-mono text-sm font-bold text-[#7F77DD]">Q.</span>
                      <p className="text-base font-semibold leading-[1.5] text-white">{item.q}</p>
                    </div>
                    <div className="flex items-start gap-2.5 pl-[2px]">
                      <span className="mt-0.5 shrink-0 font-mono text-xs text-white/40">A.</span>
                      <p className="text-sm leading-[1.6] text-white/65">{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#080618]/40 p-5 text-center backdrop-blur-xl">
              <p className="mb-1.5 text-sm font-semibold text-white/60">더 궁금한 점이 있으신가요?</p>
              <p className="mb-4 text-xs text-white/40">공식 이메일로 문의해주세요.</p>
              <a
                href="mailto:contact@genova.tv"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-[13px] font-medium text-white/90 backdrop-blur-md transition-colors hover:bg-white/10"
              >
                contact@genova.tv
              </a>
            </div>
          </div>
        )}

        {/* 출품작 */}
        {activeTab === "entries" && (
          <div className="space-y-8">
            {featuredVideos.length > 0 && (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <span className="text-[#7F77DD] text-sm">✦</span>
                  <h2 className="text-[22px] font-black tracking-tight text-white">추천 작품</h2>
                  <span className="text-[15px] font-normal text-white/30">({featuredVideos.length})</span>
                  <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7F77DD] to-transparent" />
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {featuredVideos.map((video) => (
                    <div key={`featured-${video.id}`} className="relative">
                      <VideoCard
                        video={competitionRowToAppVideo(video)}
                        showRank={false}
                        showLikes={true}
                        showMadeWith={false}
                        showDuration={true}
                        showViews={true}
                      />

                      <div className="pointer-events-none absolute left-3 top-3 z-20">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 backdrop-blur-md"
                          style={{
                            background: "rgba(127,119,221,0.2)",
                            border: "1px solid rgba(127,119,221,0.4)",
                            boxShadow: "0 0 12px rgba(127,119,221,0.3)",
                          }}
                        >
                          <Star size={9} className="fill-[#AFA9EC] text-[#AFA9EC]" />
                          <span className="text-[9px] font-black uppercase tracking-wider text-[#AFA9EC]">추천</span>
                        </span>
                      </div>

                      {video.award && (
                        <div
                          className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full px-2 py-1"
                          style={{
                            background: "linear-gradient(135deg, rgba(255,215,128,0.9) 0%, rgba(200,150,62,0.85) 100%)",
                            boxShadow: "0 0 12px rgba(255,215,128,0.5)",
                          }}
                        >
                          <Trophy size={10} className="text-[#1a1000]" fill="#1a1000" />
                          <span className="text-[9px] font-black uppercase tracking-wider text-[#1a1000]">{video.award}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#7F77DD]">✦</span>
                  <h2 className="text-[22px] font-black tracking-tight text-white">출품작</h2>
                  <span className="text-[15px] font-normal text-white/30">({sortedVideos.length})</span>
                  <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7F77DD] to-transparent" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[
                      { key: "views", label: "인기순" },
                      { key: "newest", label: "최신순" },
                      { key: "award", label: "수상작" },
                    ].map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setSortBy(s.key as typeof sortBy)}
                        className={cn(
                          "h-8 cursor-pointer rounded-full px-4 text-xs font-medium tracking-wide transition-all duration-200",
                          sortBy === s.key
                            ? "bg-white text-[#080618]"
                            : "border border-white/[0.08] bg-white/[0.04] text-white/60 hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white/80",
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center transition-colors",
                        viewMode === "grid" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70",
                      )}
                    >
                      <Grid size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center transition-colors",
                        viewMode === "list" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70",
                      )}
                    >
                      <List size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {sortedVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <Upload size={24} className="text-white/20" />
                  </div>
                  <h3 className="text-lg font-semibold text-white/50">아직 출품작이 없습니다</h3>
                  <p className="mt-2 text-sm text-white/30">첫 번째 출품자가 되어보세요!</p>
                  {isOpen && (
                    <Link href="/upload" className="mt-6 flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #534AB7 0%, #7B6FE4 100%)" }}>
                      <Upload size={14} />
                      지금 출품하기
                    </Link>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {sortedVideos.map((video, idx) => (
                    <div key={video.id} className="relative">
                      <VideoCard
                        video={competitionRowToAppVideo(video)}
                        rank={idx + 1}
                        showRank={true}
                        showLikes={true}
                        showMadeWith={false}
                        showDuration={true}
                        showViews={true}
                      />
                      {video.is_competition_featured && (
                        <div className="pointer-events-none absolute left-3 top-10 z-20">
                          <Star size={12} className="fill-[#AFA9EC] text-[#AFA9EC] drop-shadow-[0_0_8px_rgba(127,119,221,0.6)]" />
                        </div>
                      )}
                      {video.award && (
                        <div
                          className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full px-2 py-1"
                          style={{
                            background: "linear-gradient(135deg, rgba(255,215,128,0.9) 0%, rgba(200,150,62,0.85) 100%)",
                            boxShadow: "0 0 12px rgba(255,215,128,0.5)",
                          }}
                        >
                          <Trophy size={10} className="text-[#1a1000]" fill="#1a1000" />
                          <span className="text-[9px] font-black uppercase tracking-wider text-[#1a1000]">{video.award}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {sortedVideos.map((video, idx) => (
                    <Link key={video.id} href={`/watch/${video.id}`} className="group flex items-center gap-4 rounded-xl border border-white/[0.06] p-3 transition hover:border-[rgba(127,119,221,0.25)] hover:bg-white/[0.03]" style={{ background: "rgba(15,13,36,0.6)" }}>
                      <span className="flex w-8 shrink-0 items-center justify-center gap-1 text-center text-[13px] font-bold text-white/20">
                        {video.is_competition_featured ? (
                          <Star size={12} className="shrink-0 fill-[#AFA9EC] text-[#AFA9EC]" />
                        ) : null}
                        <span>{idx + 1}</span>
                      </span>
                      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg">
                        {video.thumbnail_url && <img src={video.thumbnail_url} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-1 text-[14px] font-semibold text-white">{video.title}</h3>
                        <p className="text-[12px] text-white/35">{video.view_count ? `${video.view_count >= 1000 ? (video.view_count / 1000).toFixed(1) + "K" : video.view_count} 조회` : "조회수 없음"}</p>
                      </div>
                      {video.award && (
                        <span className="flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-[11px] font-bold text-yellow-400">
                          <Trophy size={10} />
                          {video.award}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
