"use client";

import Image from "next/image";
import Link from "next/link";
import { LotteryGuideInfoButton } from "@/components/lottery/lottery-guide-info-button";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/genova/language-provider";
import { intlDateLocale } from "@/lib/i18n/browser-locale";
import { formatPrizeWithConversion } from "@/lib/utils/format-prize";
import { cn } from "@/lib/utils/cn";
import { HoverPreviewCard } from "@/components/genova/hover-preview-card";
import { useUploadModal } from "@/components/upload/upload-modal-context";
import type { Video as AppVideo } from "@/lib/types";
import { Trophy, ChevronLeft, Upload, Star, Grid, List, Award, Medal, ArrowRight } from "lucide-react";

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

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
  judging_process?: string | null;
  judging_process_ko?: string | null;
  judging_process_en?: string | null;
  judging_process_ja?: string | null;
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

/**
 * Local raw-row shape received from `mergeVideoRows`.  Aligned with
 * `Parameters<typeof mapVideo>[0]` for the fields this client reads,
 * so the page can pass merged rows straight through without an extra
 * mapping step (the component owns its own row→AppVideo conversion
 * below via `competitionRowToAppVideo`).
 *
 * `view_count` / `uploaded_by` are optional to match the Supabase
 * select result (column-omission case).  `profiles` can be an array
 * (FK embed) or a single object — `mergeVideoRows` always writes the
 * single shape, but the union admits both so the type stays
 * structurally assignable from VideoRow.
 */
type Video = {
  id: string;
  title: string;
  description?: string | null;
  genre?: string | null;
  thumbnail_url: string | null;
  view_count?: number | null;
  uploaded_by?: string | null;
  created_at: string;
  award: string | null;
  is_competition_featured?: boolean | null;
  profiles?:
    | { display_name: string | null; avatar_url?: string | null }
    | { display_name: string | null; avatar_url?: string | null }[]
    | null;
};

type CompetitionDetailProps = {
  competition: Competition;
  videos: Video[];
  featuredVideos: Video[];
  /** Phase 4-B: total eligible lottery entries for this competition. */
  entryCount?: number;
  /** Phase 4-B: at least one live (non-invalidated) winner row exists →
   *  show the "winners announced" banner linking to /results. */
  winnersAnnounced?: boolean;
};

function competitionRowToAppVideo(video: Video): AppVideo {
  const row = video as Video & { runtime?: string | null; like_count?: number | null; mux_playback_id?: string | null };
  // `mergeVideoRows` writes profiles as a single object, but the type
  // union still admits the array form (FK-embed shape).  Peel here so
  // the field accesses below stay simple.
  const profile = Array.isArray(video.profiles)
    ? video.profiles[0] ?? null
    : video.profiles ?? null;
  return {
    id: video.id,
    title: video.title,
    thumbnailUrl: video.thumbnail_url ?? "",
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
    uploaderDisplayName: profile?.display_name ?? null,
    uploaderAvatarUrl: profile?.avatar_url ?? null,
    viewCount: video.view_count ?? 0,
    likeCount: row.like_count ?? 0,
  };
}

function dDay(deadline: string) {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
}

export function CompetitionDetailClient({
  competition,
  videos,
  featuredVideos,
  entryCount = 0,
  winnersAnnounced = false,
}: CompetitionDetailProps) {
  const { t, locale } = useI18n();
  const { open: openUploadModal } = useUploadModal();
  const dateLocale = intlDateLocale(locale);
  const [sortBy, setSortBy] = useState<"views" | "newest" | "award">("views");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  // 모바일 전용: 섹션 탭 전환(활성 섹션만 표시). 데스크톱은 단일 스크롤 유지.
  const [section, setSection] = useState<"overview" | "judging" | "faq" | "entries">("overview");

  const getText = (ko: string | null | undefined, en: string | null | undefined, ja: string | null | undefined, fallback: string) => {
    if (locale === "ko") return ko || en || ja || fallback;
    if (locale === "ja") return ja || en || ko || fallback;
    return en || ko || ja || fallback;
  };

  const prizeDisplay = formatPrizeWithConversion(
    competition.prize_info_ko, competition.prize_info_en, competition.prize_info_ja,
    competition.prize_info, locale, competition.base_currency,
    competition.exchange_rate_usd_krw ?? 1350, competition.exchange_rate_usd_jpy ?? 148,
  );

  const rulesText = getText(competition.rules_ko, competition.rules_en, competition.rules_ja, competition.rules ?? "");
  const rules = rulesText ? rulesText.split("\n").filter(Boolean) : [];

  const d = dDay(competition.deadline);
  const isVoting = ["Voting", "투표중"].includes(competition.status);
  const isOpen = !isVoting && ["Open", "접수중", "In Review"].includes(competition.status);
  const isUpcoming = ["Upcoming", "예정"].includes(competition.status);
  const isClosed = !isOpen && !isUpcoming && !isVoting;

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
    { label: t("films.mockAwardGrand"), value: competition.prize_grand, icon: "🥇", glowColor: "rgba(255,215,0,0.3)", borderColor: "rgba(255,215,0,0.25)", bgColor: "rgba(255,215,0,0.06)" },
    { label: t("films.mockAwardExcellence"), value: competition.prize_excellence, icon: "🥈", glowColor: "rgba(192,192,192,0.3)", borderColor: "rgba(192,192,192,0.2)", bgColor: "rgba(192,192,192,0.04)" },
    { label: t("films.mockAwardMerit"), value: competition.prize_merit, icon: "🥉", glowColor: "rgba(205,127,50,0.3)", borderColor: "rgba(205,127,50,0.2)", bgColor: "rgba(205,127,50,0.04)" },
    {
      label:
        (competition.prize_audience_count ?? 1) > 1
          ? t("competition.detail.prizeAudienceTimes").replace("{n}", String(competition.prize_audience_count ?? 1))
          : t("films.mockAwardAudience"),
      value: competition.prize_audience,
      icon: "🎖",
      glowColor: "rgba(127,119,221,0.3)",
      borderColor: "rgba(127,119,221,0.25)",
      bgColor: "rgba(83,74,183,0.08)",
    },
  ];

  return (
    <div className="relative min-h-screen text-white">
      {/* 히어로 분위기를 본문 시작부에서 짧게 이어주는 앰버언트 글로우.
          이음매에서만 은은히 번지고 한 화면 안에 완전히 소멸 — 본문은
          깨끗하게 유지(가독성/집중). Apple TV+/Spotify 디테일 문법. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[44vh] z-0 h-[82vh]"
        style={{
          background:
            "radial-gradient(72% 60% at 24% 6%, rgba(83,74,183,0.07) 0%, rgba(83,74,183,0.03) 38%, transparent 70%)",
          filter: "blur(32px)",
        }}
        aria-hidden
      />

      {/* Phase 4-B: winners-announced banner.  Renders only once
          the admin has triggered a draw.  Links to the dedicated
          results page where the 5 winner cards live. */}
      {winnersAnnounced ? (
        <Link
          href={`/competition/${competition.id}/results`}
          className="group/banner relative z-30 mx-4 mb-4 mt-20 flex items-center justify-between gap-4 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent px-5 py-3 backdrop-blur-md transition hover:border-amber-400/50 sm:mx-6 md:mx-8 lg:mx-12"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">
              🏆 {t("lottery.results.bannerTitle", "Winners announced")}
            </span>
            <span className="truncate text-[13px] font-semibold text-amber-100/90">
              {t("lottery.results.bannerCta", "See the winners →")}
            </span>
          </div>
          <span className="shrink-0 text-[12px] font-bold text-amber-200/80 transition-transform group-hover/banner:translate-x-0.5">
            →
          </span>
        </Link>
      ) : null}

      {/* ── Hero ─────────────────────────────────── */}
      <div
        className="group/hero relative w-full overflow-hidden -mt-16 min-h-[50vh] md:min-h-[60vh]"
      >
        {/* Background: video or image */}
        {bannerImage && isVideoUrl(bannerImage) ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="hero-kenburns absolute inset-0 h-full w-full object-cover"
            src={bannerImage}
          />
        ) : bannerImage ? (
          <Image
            src={bannerImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="hero-kenburns object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(83,74,183,0.20) 0%, #0a0a0a 70%)" }}
          >
            <Image src="/genova-logo.png" alt="Genova" width={96} height={96} className="h-24 w-24 object-contain opacity-20" />
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div
                className="absolute -right-32 top-1/2 h-[140%] w-[60%] -translate-y-1/2 rounded-full opacity-40 blur-3xl"
                style={{ background: "radial-gradient(circle, rgba(83,74,183,0.16) 0%, transparent 70%)" }}
              />
              <div
                className="absolute -left-20 bottom-0 h-[60%] w-[40%] rounded-full opacity-25 blur-3xl"
                style={{ background: "radial-gradient(circle, rgba(83,74,183,0.12) 0%, transparent 72%)" }}
              />
            </div>
          </div>
        )}

        {/* Cinematic scrim stack (Netflix/Disney+/A24 key-art 문법):
            ① 좌→우 디렉셔널 스크림 — 텍스트 가독성, 우측 이미지 호흡
            ② 하단 페이드 — 페이지 배경(#0a0a0a)까지 완전히 녹여 본문과 무경계 연결
            ③ 상단 스크림 — 밝은 이미지 위 내비/뒤로가기 가독성
            ④ 비네트 — 가장자리 미세 암부로 영화적 깊이 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(90deg, #0a0a0a 0%, rgba(10,10,10,0.86) 26%, rgba(10,10,10,0.45) 54%, transparent 84%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(180deg, transparent 34%, rgba(10,10,10,0.5) 62%, rgba(10,10,10,0.88) 84%, #0a0a0a 100%)" }}
        />
        <div
          className="absolute inset-x-0 top-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(10,10,10,0.72) 0%, transparent 100%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(125% 85% at 50% 32%, transparent 52%, rgba(0,0,0,0.5) 100%)" }}
        />
        {/* ⑤ 브랜드 컬러 캐스트 — 밝은 글로우 blob(올드함) 대신,
            그림자측에 거의 안 보이게 깔리는 절제된 시네마틱 색조.
            깊은 코어 톤(#534AB7) 저채도·저불투명·광역 확산. */}
        <div
          className="absolute -left-48 bottom-0 h-[95%] w-[68%] pointer-events-none"
          style={{
            background: "radial-gradient(58% 72% at 20% 82%, rgba(83,74,183,0.10) 0%, rgba(83,74,183,0.04) 46%, transparent 74%)",
            filter: "blur(64px)",
          }}
        />
        {/* ⑥ 필름 그레인 — A24/MUBI 시그니처 텍스처. assetless SVG noise. */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-soft-light"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Back button */}
        <Link
          href="/competition"
          className="absolute left-8 top-20 z-30 flex items-center gap-2 rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-[12px] text-white/55 backdrop-blur-sm transition hover:border-white/30 hover:text-white"
        >
          <ChevronLeft size={14} />
          {t("competition.detail.backToAll")}
        </Link>

        {/* Content layout */}
        <div className="relative z-20 flex h-full min-h-[50vh] items-end px-4 pt-24 pb-10 md:min-h-[60vh] md:px-10 md:pt-32 md:pb-14 lg:px-16">
          <div className="flex w-full items-center justify-between gap-12">
            {/* Left — Text content */}
            <div className="flex max-w-[560px] flex-col gap-6">
              {/* Status Badge */}
              {isOpen && (
                <span
                  className="inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em]"
                  style={{
                    background: "rgba(83,74,183,0.12)",
                    border: "1px solid rgba(127,119,221,0.22)",
                    color: "#C4BEEF",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {t("competition.detail.acceptingSubmissions")}
                </span>
              )}
              {isVoting && (
                <span
                  className="inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em]"
                  style={{
                    background: "rgba(127,119,221,0.10)",
                    border: "1px solid rgba(127,119,221,0.22)",
                    color: "#C4BEEF",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7F77DD] animate-pulse" />
                  {t("competition.statusVoting", "투표중")}
                </span>
              )}
              {isUpcoming && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white/55">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  {t("competition.detail.heroStatusUpcoming")}
                </span>
              )}
              {isClosed && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white/35">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                  {t("competition.detail.heroStatusClosed")}
                </span>
              )}

              {/* Sponsor tag */}
              {competition.sponsor && (
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#AFA9EC]">
                  ✦ {t("competition.sponsoredBy", "Hosted by")} · {competition.sponsor}
                </span>
              )}

              {/* Title */}
              <h1
                className="break-keep text-3xl font-black leading-tight tracking-tight md:text-4xl lg:text-5xl text-white"
                style={{
                  textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                }}
              >
                {getText(competition.title_ko, competition.title_en, competition.title_ja, competition.title)}
              </h1>

              {concept && (
                <p className="max-w-[480px] text-[14px] leading-relaxed text-white/55 md:text-[15px]">
                  {concept.split("\n")[0]}
                </p>
              )}

              {/* Meta info blocks */}
              <div className="mt-1 flex flex-wrap items-start gap-x-8 gap-y-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                    {t("competition.period", "접수 기간")}
                  </span>
                  <span className="mt-0.5 text-[14px] font-bold tabular-nums text-white">
                    {deadlineLabel}
                  </span>
                </div>

                {competition.vote_end && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                      {t("competition.resultAnnouncement", "결과 발표")}
                    </span>
                    <span className="mt-0.5 text-[14px] font-bold tabular-nums text-white">
                      {voteEndLabel}
                    </span>
                  </div>
                )}

                {d > 0 && isOpen && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                      {t("competition.daysLeft", "남은 기간")}
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1.5 text-[14px] font-bold text-[#AFA9EC]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#7F77DD] animate-pulse" />
                      D-{d}
                    </span>
                  </div>
                )}
                {/* Phase 4-B: total eligible lottery entries.
                    Only renders when at least one ticket entered
                    the pool — keeps the stat row clean for fresh
                    competitions. */}
                {entryCount > 0 ? (
                  <div className="flex flex-col">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                      {t("lottery.entriesLabel", "Entries")}
                      <LotteryGuideInfoButton
                        ariaLabel={t("lottery.guideLink", "응모권 추첨 안내")}
                        size={12}
                        className="text-white/30 transition hover:text-[#AFA9EC]"
                      />
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1.5 text-[14px] font-bold tabular-nums text-[#AFA9EC]">
                      {entryCount.toLocaleString()}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* CTA Buttons — featured-hero 캐러셀과 동일 디자인 언어
                  (pill / 퍼플 그라데이션 primary + 글래스 보조).
                  순서: 지금 출품하기(primary) → 자세히 보기(보조). */}
              <div className="mt-1 flex flex-wrap items-center gap-2.5">
                {isOpen && (
                  <button
                    type="button"
                    onClick={() => openUploadModal({ competitionId: competition.id })}
                    className="group inline-flex items-center gap-1.5 rounded-full px-6 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90"
                    style={{
                      backgroundImage: "var(--gradient-cta-primary)",
                      border: "1px solid var(--border-emphasis)",
                      boxShadow: "var(--shadow-cta)",
                    }}
                  >
                    {t("competition.detail.submitNowCta")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("overview")?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.15] bg-white/[0.03] px-5 py-2.5 text-[13px] font-semibold text-white/80 backdrop-blur-md transition hover:border-white/[0.3] hover:bg-white/[0.08] hover:text-white"
                >
                  {t("competition.detail.viewDetailsCta")}
                </button>
              </div>
            </div>

            {/* Right — Prize Card */}
            <div
              className="relative hidden w-[280px] shrink-0 self-center overflow-hidden rounded-2xl md:block"
              style={{
                background:
                  "linear-gradient(165deg, rgba(255,255,255,0.06) 0%, rgba(10,10,10,0.5) 58%, rgba(10,10,10,0.62) 100%)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 18px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              {/* 상단 금색 헤어라인 — 상금 패널 식별 액센트 (절제) */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{ background: "linear-gradient(to right, transparent, rgba(245,209,130,0.55) 50%, transparent)" }}
              />
              {/* Grand prize — hero */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center gap-1.5">
                  <Trophy size={13} className="text-amber-300" fill="currentColor" />
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300/90">
                    {t("competition.detail.grandPrizeLabel")}
                  </span>
                </div>
                <p
                  className="mt-2 text-[34px] font-black leading-none tabular-nums"
                  style={{
                    background: "linear-gradient(135deg, #FFE9B0 0%, #FBBF24 60%, #C8963E 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {competition.prize_grand ?? prizeDisplay}
                </p>
              </div>

              {/* Tier breakdown — ranked list */}
              {competition.prize_excellence && (
                <div className="space-y-1 border-t border-white/[0.08] px-3 py-3">
                  {[
                    { label: t("competition.detail.prizeEyebrowExcellence"), value: competition.prize_excellence },
                    competition.prize_merit
                      ? { label: t("competition.detail.prizeEyebrowMerit"), value: competition.prize_merit }
                      : null,
                    competition.prize_audience
                      ? { label: t("competition.detail.prizeEyebrowAudience"), value: competition.prize_audience }
                      : null,
                  ]
                    .filter(Boolean)
                    .map((item, i) => (
                      <div
                        key={item!.label}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 transition hover:bg-white/[0.04]"
                      >
                        <span className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black tabular-nums text-white/55" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                            {i + 2}
                          </span>
                          <span className="text-[12px] font-semibold text-white/55">{item!.label}</span>
                        </span>
                        <span className="text-[13px] font-bold tabular-nums text-[#F5D182]">{item!.value}</span>
                      </div>
                    ))}
                </div>
              )}

              {/* Total — footer summary */}
              {competition.prize_grand && (
                <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.03] px-5 py-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                    {t("competition.detail.prizeTotalWord")}
                  </span>
                  <span className="text-[12px] font-bold tabular-nums text-[#F5D182]/85">{prizeDisplay}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky section nav + persistent action ──
          탭 제거 → 단일 스크롤. 라벨은 섹션으로 점프하는 앵커가 되고,
          우측엔 스크롤 내내 따라다니는 핵심 액션(마감·상금·지금 출품)을
          상시 노출 → 전환 동선 단축 (Kickstarter/영화제 랜딩 문법). */}
      <div data-tab-content className="sticky top-0 z-40 border-b border-white/[0.07] bg-[rgba(10,10,10,0.96)] backdrop-blur-lg">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: "overview", label: t("competition.detail.tabOverview") },
              { id: "judging", label: t("competition.detail.tabJudging") },
              { id: "faq", label: t("competition.detail.tabSupport") },
              { id: "entries", label: t("competition.detail.tabEntriesCount").replace("{n}", String(videos.length)) },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  // 모바일: 활성 섹션 전환. 데스크톱: 해당 섹션으로 스크롤.
                  setSection(s.id as typeof section);
                  if (window.matchMedia("(min-width: 768px)").matches) {
                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className={cn(
                  "-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-3.5 text-[13px] font-medium transition-all duration-200 hover:text-white md:px-5",
                  section === s.id
                    ? "border-[#7F77DD] text-white md:border-transparent md:text-white/45 md:hover:text-white"
                    : "border-transparent text-white/45",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {d > 0 && isOpen ? (
              <span className="flex items-center gap-1.5 text-[12px] font-bold text-[#AFA9EC]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7F77DD] animate-pulse" />
                D-{d}
              </span>
            ) : null}
            <span className="hidden text-[12px] font-bold tabular-nums text-[#F5D182] lg:inline">
              {prizeDisplay}
            </span>
            {isOpen ? (
              <button
                type="button"
                onClick={() => openUploadModal({ competitionId: competition.id })}
                className="group inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-bold text-white transition hover:opacity-90"
                style={{
                  backgroundImage: "var(--gradient-cta-primary)",
                  border: "1px solid var(--border-emphasis)",
                  boxShadow: "var(--shadow-cta)",
                }}
              >
                {t("competition.detail.submitNowCta")}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────── */}
      <div className="relative z-10 mx-auto min-h-[58vh] max-w-[1400px] space-y-20 px-4 py-12 md:px-8">

        {/* 개요 */}
        <section id="overview" className={cn("scroll-mt-24 md:block", section === "overview" ? "block" : "hidden")}>
          <div className="space-y-6">

            {/* 공모전 소개 + 참가 규칙 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] items-stretch">

              {/* 왼쪽 — 공모전 소개 */}
              <div className="h-full">
                <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/40 backdrop-blur-xl shadow-card-soft">

                  {/* 트로피 이미지 제거 — 색 단차/경계 문제로 폐기.
                      우측은 경계 없는 브랜드 퍼플 글로우로만 채워 깔끔하게. */}
                  <div
                    className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2"
                    style={{
                      width: "420px",
                      height: "420px",
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle, rgba(127,119,221,0.13) 0%, rgba(83,74,183,0.07) 45%, transparent 72%)",
                      filter: "blur(56px)",
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
                    style={{ background: "var(--gradient-card-top-accent)" }}
                  />

                  <div className="relative z-10 p-8">
                  {/* eyebrow */}
                  <div className="mb-1 flex items-center gap-1.5">
                    <span
                      className="text-[11px] font-black"
                      style={{
                        backgroundImage: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-light) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >✦</span>
                    <p
                      className="text-[11px] font-black uppercase tracking-[0.2em]"
                      style={{
                        backgroundImage: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-light) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >{t("competition.detail.overviewEyebrow")}</p>
                  </div>

                  {/* 제목 */}
                  <h2
                    className="mb-3 font-bold tracking-tight text-white/85"
                    style={{
                      fontSize: "clamp(1rem,1.4vw,1.3rem)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {t("competition.detail.introTitle")}
                  </h2>

                    {/* 본문 */}
                    {concept ? (
                      <div className="space-y-5">
                        {concept.split("\n").filter(Boolean).map((line, i) => (
                          i === 0 ? (
                            <div key={i} className="flex items-center gap-2.5">
                              <span className="shrink-0 text-[18px] text-accent-primary">✦</span>
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
                      <p className="text-[14px] text-white/25">{t("competition.detail.noConcept")}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 오른쪽 — 참가 규칙 */}
              <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/40 p-5 backdrop-blur-xl shadow-card-soft">
                <div className="pointer-events-none absolute top-0 left-0 right-0 h-px" style={{ background: "var(--gradient-card-top-accent)" }} />
                <div className="pointer-events-none absolute right-0 bottom-0 w-40 h-40 rounded-full" style={{ background: "radial-gradient(circle, rgba(83,74,183,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
                <h2 className="mb-4 text-[16px] font-bold text-white">{t("competition.detail.rulesSidebarTitle")}</h2>
                <div className="divide-y divide-white/[0.05]">
                  {[
                    {
                      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/></svg>,
                      label: t("competition.detail.ruleFieldEligibility"),
                      value: getText(competition.eligibility_ko, competition.eligibility_en, competition.eligibility_ja, competition.eligibility ?? "") || t("competition.detail.ruleFallbackUnlimited"),
                    },
                    {
                      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4" strokeLinecap="round"/></svg>,
                      label: t("competition.detail.ruleFieldFormat"),
                      value: getText(competition.submission_guidelines_ko, competition.submission_guidelines_en, competition.submission_guidelines_ja, competition.submission_guidelines ?? "") || t("competition.detail.ruleFallbackAiVideo"),
                    },
                    {
                      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/></svg>,
                      label: t("competition.detail.ruleFieldCount"),
                      value: t("competition.detail.ruleFallbackUnlimited"),
                    },
                    {
                      icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinecap="round"/></svg>,
                      label: t("competition.detail.ruleFieldRegion"),
                      value: t("competition.detail.worldwide"),
                    },
                    {
                      icon: <Star size={16} />,
                      label: t("competition.detail.ruleFieldJudgingShort"),
                      value: getText(competition.judging_criteria_ko, competition.judging_criteria_en, competition.judging_criteria_ja, competition.judging_criteria ?? "") || t("competition.detail.ruleFallbackJudging"),
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex gap-2.5 py-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-accent-light bg-line-white-06 border border-line-white-10">
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
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/40 px-8 backdrop-blur-xl"
            >
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(127,119,221,0.3) 40%, transparent)" }} />

            {/* 주제 — 전체 너비 카드 스타일 */}
            {rules.length > 0 && (
              <div className="py-8 border-t border-white/[0.06]">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[10px] text-[#7F77DD]">✦</span>
                  <h2 className="text-[18px] font-bold text-white">{t("competition.detail.topicRulesTitle")}</h2>
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
                  <h2 className="text-[22px] font-black tracking-tight text-white">{t("competition.detail.prizeBreakdownHeading")}</h2>
                  <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7F77DD] to-transparent" />
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-md">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/35">{t("competition.detail.prizeTotalWord")}</span>
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
                    eyebrow: t("competition.detail.prizeEyebrowGrand"),
                    label: t("films.mockAwardGrand"),
                    value: competition.prize_grand,
                    Icon: Trophy,
                    isHero: true,
                    accent: "#FFD478",
                    accentDark: "#C8963E",
                    cardBg: "linear-gradient(155deg, rgba(200,150,62,0.10) 0%, rgba(10,10,10,0.55) 55%, rgba(10,10,10,0.65) 100%)",
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
                    eyebrow: t("competition.detail.prizeEyebrowExcellence"),
                    label: t("films.mockAwardExcellence"),
                    value: competition.prize_excellence,
                    Icon: Award,
                    isHero: false,
                    accent: "#E0E5EC",
                    accentDark: "#A8B0BD",
                    cardBg: "linear-gradient(155deg, rgba(190,198,212,0.07) 0%, rgba(10,10,10,0.55) 55%, rgba(10,10,10,0.65) 100%)",
                    cardBorder: "rgba(180,190,210,0.18)",
                    cardShadow: "0 0 24px rgba(180,190,210,0.06)",
                    glowColor: "rgba(200,210,225,0.12)",
                    iconBg: "rgba(200,210,225,0.08)",
                    iconBorder: "rgba(200,210,225,0.18)",
                    divider: "rgba(180,190,210,0.12)",
                  },
                  {
                    rank: "03",
                    eyebrow: t("competition.detail.prizeEyebrowMerit"),
                    label: t("films.mockAwardMerit"),
                    value: competition.prize_merit,
                    Icon: Medal,
                    isHero: false,
                    accent: "#D89060",
                    accentDark: "#A66A3D",
                    cardBg: "linear-gradient(155deg, rgba(205,127,50,0.08) 0%, rgba(10,10,10,0.55) 55%, rgba(10,10,10,0.65) 100%)",
                    cardBorder: "rgba(205,127,50,0.2)",
                    cardShadow: "0 0 24px rgba(205,127,50,0.06)",
                    glowColor: "rgba(216,144,96,0.14)",
                    iconBg: "rgba(216,144,96,0.1)",
                    iconBorder: "rgba(216,144,96,0.22)",
                    divider: "rgba(205,127,50,0.14)",
                  },
                  {
                    rank: "04",
                    eyebrow: t("competition.detail.prizeEyebrowAudience"),
                    label:
                      (competition.prize_audience_count ?? 1) > 1
                        ? t("competition.detail.prizeAudienceTimes").replace("{n}", String(competition.prize_audience_count ?? 1))
                        : t("films.mockAwardAudience"),
                    value: competition.prize_audience,
                    suffix: (competition.prize_audience_count ?? 1) > 1 ? t("competition.detail.prizePerPerson") : undefined,
                    Icon: Star,
                    isHero: false,
                    accent: "#AFA9EC",
                    accentDark: "#7F77DD",
                    cardBg: "linear-gradient(155deg, rgba(127,119,221,0.09) 0%, rgba(10,10,10,0.55) 55%, rgba(10,10,10,0.65) 100%)",
                    cardBorder: "rgba(127,119,221,0.22)",
                    cardShadow: "0 0 24px var(--tint-purple-08)",
                    glowColor: "rgba(127,119,221,0.16)",
                    iconBg: "var(--tint-purple-12)",
                    iconBorder: "rgba(127,119,221,0.25)",
                    divider: "rgba(127,119,221,0.16)",
                  },
                ].map((tier) => (
                  <div
                    key={tier.rank}
                    className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      background: tier.cardBg,
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
                        <span className="absolute right-3 top-3 text-xs font-mono text-white/35">
                          #{Number(tier.rank)}
                        </span>
                      </div>

                      {/* Eyebrow + Label */}
                      <div className="mt-5">
                        <p
                          className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50"
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
                  <h2 className="text-[22px] font-black tracking-tight text-white">{t("competition.detail.scheduleHeading")}</h2>
                  <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7F77DD] to-transparent" />
                </div>
                {d > 0 && isOpen && (
                  <div className="text-right">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">{t("competition.detail.untilDeadline")}</p>
                    <p className="text-2xl font-bold leading-none tabular-nums text-[#7F77DD]">
                      D-{d}
                    </p>
                  </div>
                )}
              </div>

              {(() => {
                const stages = [
                  { label: t("competition.detail.stageOpen"), date: null, done: true, active: false },
                  { label: t("competition.detail.stageClose"), date: deadlineLabel, done: isClosed, active: isOpen },
                  { label: t("competition.detail.stageReview"), date: null, done: false, active: false },
                  { label: t("competition.detail.stageVoteEnd"), date: voteEndLabel, done: false, active: false },
                  { label: t("competition.detail.stageCeremony"), date: null, done: false, active: false },
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
                          boxShadow: "0 0 12px rgba(83,74,183,0.12)",
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
                                      boxShadow: "0 0 0 4px rgba(127,119,221,0.15), 0 0 16px rgba(83,74,183,0.12)",
                                    }
                                  : isPast
                                    ? {
                                        top: "-46px",
                                        width: "12px",
                                        height: "12px",
                                        background: "#7F77DD",
                                        boxShadow: "0 0 6px rgba(83,74,183,0.10)",
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
                                      background: "rgba(10,10,10,0.4)",
                                      border: "1px solid rgba(127,119,221,0.22)",
                                      backdropFilter: "blur(12px)",
                                      boxShadow: "0 0 24px rgba(127,119,221,0.15)",
                                    }
                                  : {
                                      background: "rgba(10,10,10,0.4)",
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
                                {t("competition.detail.stageStep").replace("{n}", String(idx + 1).padStart(2, "0"))}
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
                                {stage.date ?? t("competition.detail.dateTbd")}
                              </p>

                              {/* 진행 중 뱃지 */}
                              {isNow && (
                                <div className="mt-2.5 flex justify-center">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                                    <span className="text-emerald-400 animate-pulse">●</span>
                                    {t("competition.detail.badgeActive")}
                                  </span>
                                </div>
                              )}
                              {isPast && !isNow && (
                                <div className="mt-2.5 flex justify-center">
                                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-accent-light/80">
                                    {t("competition.detail.badgeDone")}
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
        </section>

        {/* 심사 및 시상 */}
        <section id="judging" className={cn("scroll-mt-24 md:block", section === "judging" ? "block" : "hidden")}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <div
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/40 p-8 backdrop-blur-xl shadow-card-soft"
              >
                <div className="pointer-events-none absolute top-0 left-0 right-0 h-px" style={{ background: "var(--gradient-card-top-accent)" }} />
                <div className="mb-6 flex items-center gap-3">
                  <span className="text-sm text-[#7F77DD]">✦</span>
                  <h2 className="text-[22px] font-black tracking-tight text-white">{t("competition.detail.judgingTitle")}</h2>
                  <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7F77DD] to-transparent" />
                </div>

                <div className="grid gap-3">
                  {(() => {
                    const stepWord =
                      locale === "ko" ? "단계" : locale === "ja" ? "ステップ" : "STEP";
                    const customProcess = getText(
                      competition.judging_process_ko,
                      competition.judging_process_en,
                      competition.judging_process_ja,
                      competition.judging_process ?? "",
                    ).trim();

                    let steps: { step: string; title: string; desc: string }[];
                    if (customProcess) {
                      steps = customProcess
                        .split(/\r?\n/)
                        .map((l) => l.trim())
                        .filter(Boolean)
                        .map((line, i) => {
                          const m = line.match(/^(.*?)\s*[—–\-:]\s+(.*)$/);
                          return {
                            step: `${stepWord} ${String(i + 1).padStart(2, "0")}`,
                            title: m ? m[1].trim() : line,
                            desc: m ? m[2].trim() : "",
                          };
                        });
                    } else {
                      steps = [
                        {
                          step: t("competition.detail.judgingStepLabel01"),
                          title: t("competition.detail.judgingRound1Title"),
                          desc: t("competition.detail.judgingRound1Desc"),
                        },
                        {
                          step: t("competition.detail.judgingStepLabel02"),
                          title: t("competition.detail.judgingRound2Title"),
                          desc:
                            getText(
                              competition.judging_criteria_ko,
                              competition.judging_criteria_en,
                              competition.judging_criteria_ja,
                              competition.judging_criteria ?? "",
                            ) || t("competition.detail.judgingCriteriaMissing"),
                        },
                        {
                          step: t("competition.detail.judgingStepLabel03"),
                          title: t("competition.detail.judgingFinalTitle"),
                          desc: t("competition.detail.judgingFinalDesc").replace("{date}", voteEndLabel),
                        },
                      ];
                    }

                    return steps.map((item, i) => (
                      <div key={`${item.step}-${i}`} className="space-y-2 rounded-xl border border-white/10 bg-[#0a0a0a]/40 p-5 backdrop-blur-xl">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#7F77DD]">{item.step}</p>
                        <p className="text-base font-bold text-white">{item.title}</p>
                        {item.desc ? (
                          <p className="text-sm leading-relaxed text-white/55">{item.desc}</p>
                        ) : null}
                      </div>
                    ));
                  })()}
                </div>

                <div className="mt-6 rounded-xl border border-white/10 bg-[#0a0a0a]/40 p-5 backdrop-blur-xl">
                  <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#7F77DD]">EVALUATION WEIGHTS</p>
                  <div className="space-y-3">
                    {[
                      { label: t("competition.detail.weightCreativity"), weight: 35 },
                      { label: t("competition.detail.weightTechnical"), weight: 25 },
                      { label: t("competition.detail.weightStory"), weight: 25 },
                      { label: t("competition.detail.weightImpact"), weight: 15 },
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

                <div className="mt-6 rounded-xl border border-white/10 bg-[#0a0a0a]/40 p-5 backdrop-blur-xl">
                  <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#7F77DD]">{t("competition.detail.judgingScheduleBlockTitle")}</p>
                  <div className="space-y-2 text-sm text-white/70">
                    <p>{t("competition.detail.judgingScheduleLine1").replace("{date}", deadlineLabel)}</p>
                    <p>{t("competition.detail.judgingScheduleLine2").replace("{date}", voteEndLabel)}</p>
                    <p>{t("competition.detail.judgingScheduleLine3").replace("{date}", voteEndLabel)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div
                className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]/40 p-5 backdrop-blur-xl lg:sticky lg:top-24"
                style={{ boxShadow: "0 0 24px rgba(83,74,183,0.08), inset 0 1px 0 rgba(255,255,255,0.05)" }}
              >
                <h2 className="mb-4 text-[18px] font-bold text-white">{t("competition.detail.sidebarPrizeHeading")}</h2>
                <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
                  <p className="mb-0.5 text-[10px] uppercase tracking-[0.2em] text-white/35">TOTAL</p>
                  {(() => {
                    const splitAt = prizeDisplay.indexOf(" (");
                    const main = splitAt === -1 ? prizeDisplay : prizeDisplay.slice(0, splitAt);
                    const approx =
                      splitAt === -1 ? null : prizeDisplay.slice(splitAt + 1).replace(/^\(|\)$/g, "");
                    return (
                      <>
                        <p className="text-[20px] font-bold leading-tight tabular-nums text-[#F5D182]">
                          {main}
                        </p>
                        {approx ? (
                          <p className="mt-0.5 text-[12px] leading-tight tabular-nums text-[#F5D182]/55">
                            {approx}
                          </p>
                        ) : null}
                      </>
                    );
                  })()}
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
        </section>

        {/* 문의 */}
        <section id="faq" className={cn("scroll-mt-24 md:block", section === "faq" ? "block" : "hidden")}>
          <div className="max-w-2xl space-y-5">
            {(competition.announcement_ko || competition.announcement_en || competition.announcement_ja || competition.announcement) && (
              <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, var(--tint-accent-15) 0%, rgba(40,35,100,0.1) 100%)", border: "1px solid rgba(127,119,221,0.2)" }}>
                <h2 className="mb-3 text-[18px] font-bold text-white">{t("competition.detail.announcementsTitle")}</h2>
                <p className="text-[13px] leading-relaxed text-white/55 whitespace-pre-wrap">
                  {getText(competition.announcement_ko, competition.announcement_en, competition.announcement_ja, competition.announcement ?? "")}
                </p>
              </div>
            )}

            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="text-sm text-[#7F77DD]">✦</span>
                <h2 className="text-[22px] font-black tracking-tight text-white">{t("competition.detail.faqHeading")}</h2>
                <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7F77DD] to-transparent" />
              </div>
              <div className="space-y-2">
                {[
                  { q: t("competition.detail.faq1Q"), a: t("competition.detail.faq1A") },
                  { q: t("competition.detail.faq2Q"), a: t("competition.detail.faq2A") },
                  { q: t("competition.detail.faq3Q"), a: t("competition.detail.faq3A") },
                  { q: t("competition.detail.faq4Q"), a: t("competition.detail.faq4A") },
                  { q: t("competition.detail.faq5Q"), a: t("competition.detail.faq5A") },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0a0a0a]/40 p-5 backdrop-blur-xl transition-colors duration-200 hover:border-white/15"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 shrink-0 font-mono text-sm font-bold text-[#7F77DD]">Q.</span>
                      <p className="text-base font-semibold leading-[1.5] text-white">{item.q}</p>
                    </div>
                    <div className="flex items-start gap-2.5 pl-[2px]">
                      <span className="mt-0.5 shrink-0 font-mono text-xs text-white/35">A.</span>
                      <p className="text-sm leading-[1.6] text-white/65">{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0a0a0a]/40 p-5 text-center backdrop-blur-xl">
              <p className="mb-1.5 text-sm font-semibold text-white/55">{t("competition.detail.faqContactLead")}</p>
              <p className="mb-4 text-xs text-white/35">{t("competition.detail.faqContactHint")}</p>
              <a
                href="mailto:contact@genova.tv"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-[13px] font-medium text-white/90 backdrop-blur-md transition-colors hover:bg-white/10"
              >
                contact@genova.tv
              </a>
            </div>
          </div>
        </section>

        {/* 출품작 */}
        <section id="entries" className={cn("scroll-mt-24 md:block", section === "entries" ? "block" : "hidden")}>
          <div className="space-y-8">
            {featuredVideos.length > 0 && (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <span className="text-[#7F77DD] text-sm">✦</span>
                  <h2 className="text-[22px] font-black tracking-tight text-white">{t("competition.detail.entriesFeaturedTitle")}</h2>
                  <span className="text-[15px] font-normal text-white/30">({featuredVideos.length})</span>
                  <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7F77DD] to-transparent" />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {featuredVideos.map((video) => (
                    <div key={`featured-${video.id}`} className="relative">
                      <HoverPreviewCard video={competitionRowToAppVideo(video)} />

                      <div className="pointer-events-none absolute left-2.5 top-2.5 z-20">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 backdrop-blur-md"
                          style={{
                            background: "rgba(127,119,221,0.22)",
                            border: "1px solid rgba(127,119,221,0.22)",
                          }}
                        >
                          <Star size={9} className="fill-[#AFA9EC] text-[#AFA9EC]" />
                          <span className="text-[9px] font-black uppercase tracking-wider text-[#AFA9EC]">{t("competition.detail.badgeFeatured")}</span>
                        </span>
                      </div>

                      {video.award && (
                        <div
                          className="pointer-events-none absolute right-2.5 top-2.5 z-20 flex items-center gap-1 rounded-full px-2 py-0.5"
                          style={{
                            background: "linear-gradient(135deg, rgba(255,215,128,0.92) 0%, rgba(200,150,62,0.88) 100%)",
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
                  <h2 className="text-[22px] font-black tracking-tight text-white">{t("competition.detail.entriesAllTitle")}</h2>
                  <span className="text-[15px] font-normal text-white/30">({sortedVideos.length})</span>
                  <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7F77DD] to-transparent" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[
                      { key: "views", label: t("competition.detail.entriesSortPopular") },
                      { key: "newest", label: t("competition.detail.entriesSortNewest") },
                      { key: "award", label: t("competition.detail.entriesSortAward") },
                    ].map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setSortBy(s.key as typeof sortBy)}
                        className={cn(
                          "h-8 cursor-pointer rounded-full px-4 text-xs font-medium tracking-wide transition-all duration-200",
                          sortBy === s.key
                            ? "bg-white text-[#0a0a0a]"
                            : "border border-white/[0.08] bg-white/[0.04] text-white/55 hover:border-white/[0.15] hover:bg-white/[0.08] hover:text-white/80",
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
                        viewMode === "grid" ? "bg-white/10 text-white" : "text-white/35 hover:text-white/70",
                      )}
                    >
                      <Grid size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center transition-colors",
                        viewMode === "list" ? "bg-white/10 text-white" : "text-white/35 hover:text-white/70",
                      )}
                    >
                      <List size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {sortedVideos.length === 0 ? (
                <div className="flex min-h-[42vh] flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <Upload size={24} className="text-white/20" />
                  </div>
                  <h3 className="text-lg font-semibold text-white/50">{t("competition.detail.entriesEmptyTitle")}</h3>
                  <p className="mt-2 text-sm text-white/30">{t("competition.detail.entriesEmptyHint")}</p>
                  {isOpen && (
                    <button type="button" onClick={() => openUploadModal({ competitionId: competition.id })} className="mt-6 flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition hover:scale-[1.02]" style={{ background: "var(--gradient-cta-solid)" }}>
                      <Upload size={14} />
                      {t("competition.detail.entriesEmptyCta")}
                    </button>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {sortedVideos.map((video, idx) => (
                    <div key={video.id} className="relative">
                      <HoverPreviewCard video={competitionRowToAppVideo(video)} />

                      <div className="pointer-events-none absolute left-2.5 top-2.5 z-20 flex items-center gap-1">
                        <span
                          className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums text-white backdrop-blur-md"
                          style={{ background: "rgba(10,10,10,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}
                        >
                          {idx + 1}
                        </span>
                        {video.is_competition_featured && (
                          <Star size={12} className="fill-[#AFA9EC] text-[#AFA9EC] drop-shadow-[0_0_8px_rgba(127,119,221,0.6)]" />
                        )}
                      </div>

                      {video.award && (
                        <div
                          className="pointer-events-none absolute right-2.5 top-2.5 z-20 flex items-center gap-1 rounded-full px-2 py-0.5"
                          style={{
                            background: "linear-gradient(135deg, rgba(255,215,128,0.92) 0%, rgba(200,150,62,0.88) 100%)",
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
                        {video.thumbnail_url && <Image src={video.thumbnail_url} alt="" fill sizes="96px" className="object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-1 text-[14px] font-semibold text-white">{video.title}</h3>
                        <p className="text-[12px] text-white/35">
                          {video.view_count
                            ? t("competition.detail.listViews").replace(
                                "{n}",
                                video.view_count >= 1000 ? `${(video.view_count / 1000).toFixed(1)}K` : String(video.view_count),
                              )
                            : t("competition.detail.listNoViews")}
                        </p>
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
        </section>

      </div>
    </div>
  );
}
