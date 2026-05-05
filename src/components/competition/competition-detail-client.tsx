"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/components/genova/language-provider";
import { intlDateLocale } from "@/lib/i18n/browser-locale";
import { formatPrizeWithConversion } from "@/lib/utils/format-prize";
import { mainGenreLabel } from "@/lib/constants/genres";
import {
  Trophy, Calendar, Users, Clock, ChevronLeft,
  Upload, Star, Play, Grid, List
} from "lucide-react";

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
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

function dDay(deadline: string) {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
}

function formatPrize(prizeInfo: string) {
  const wonMatch = prizeInfo.match(/([0-9,]+)만원/);
  if (wonMatch) {
    const krw = parseInt(wonMatch[1].replace(/,/g, "")) * 10000;
    if (krw >= 10000000) return `₩${(krw / 10000000).toFixed(0)}M`;
    if (krw >= 1000000) return `₩${(krw / 1000000).toFixed(0)}00K`;
    return `₩${krw.toLocaleString()}`;
  }
  if (prizeInfo.includes("$")) return prizeInfo.split("+")[0].trim();
  return prizeInfo;
}

export function CompetitionDetailClient({
  competition,
  videos,
}: {
  competition: Competition;
  videos: Video[];
}) {
  const { t, locale } = useI18n();
  const dateLocale = intlDateLocale(locale);
  const [sortBy, setSortBy] = useState<"views" | "newest" | "award">("views");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const getText = (
    ko: string | null | undefined,
    en: string | null | undefined,
    ja: string | null | undefined,
    fallback: string,
  ) => {
    if (locale === "ko") return ko || en || ja || fallback;
    if (locale === "ja") return ja || en || ko || fallback;
    return en || ko || ja || fallback;
  };

  const prizeText = getText(
    competition.prize_info_ko,
    competition.prize_info_en,
    competition.prize_info_ja,
    competition.prize_info,
  );

  const prizeDisplay = formatPrizeWithConversion(
    competition.prize_info_ko,
    competition.prize_info_en,
    competition.prize_info_ja,
    competition.prize_info,
    locale,
    competition.base_currency,
    competition.exchange_rate_usd_krw ?? 1350,
    competition.exchange_rate_usd_jpy ?? 148,
  );

  const rulesText = getText(competition.rules_ko, competition.rules_en, competition.rules_ja, competition.rules ?? "");
  const rules = rulesText ? rulesText.split("\n").filter(Boolean) : [];

  const d = dDay(competition.deadline);
  const isOpen = ["Open", "접수중", "In Review", "Voting"].includes(competition.status);
  const isUpcoming = ["Upcoming", "예정"].includes(competition.status);
  const isClosed = !isOpen && !isUpcoming;

  const bannerImage = competition.banner_url || competition.thumbnail_url || null;

  const concept = competition.concept ?? null;

  const sortedVideos = [...videos].sort((a, b) => {
    if (sortBy === "views") return (b.view_count ?? 0) - (a.view_count ?? 0);
    if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "award") return (a.award ? -1 : 1);
    return 0;
  });

  const deadlineLabel = new Date(competition.deadline).toLocaleDateString(dateLocale, {
    year: "numeric", month: "long", day: "numeric",
  });
  const voteEndLabel = new Date(competition.vote_end).toLocaleDateString(dateLocale, {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen text-white" style={{ background: "#080618" }}>

      {/* Hero Banner */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "21/7" }}>
        {bannerImage ? (
          <img src={bannerImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1a1547 0%, #0f0d24 100%)" }}
          >
            <img
              src="/genova-logo.png"
              alt="Genova"
              className="h-24 w-24 object-contain opacity-20"
            />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(8,6,24,0.97) 0%, rgba(8,6,24,0.6) 50%, rgba(8,6,24,0.1) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,6,24,1) 0%, transparent 40%)" }} />

        {/* Back button */}
        <Link
          href="/competition"
          className="absolute left-8 top-8 flex items-center gap-2 rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-sm text-white/70 backdrop-blur-sm transition hover:text-white"
        >
          <ChevronLeft size={16} />
          {t("competition.detail.backToAll")}
        </Link>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 p-10 max-w-2xl">
          {/* Status badge */}
          <div className="mb-4 flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold border ${
              isOpen ? "bg-green-500/15 border-green-500/30 text-green-400" :
              isUpcoming ? "bg-blue-500/15 border-blue-500/30 text-blue-400" :
              "bg-white/5 border-white/10 text-white/30"
            }`}>
              {isOpen ? t("competition.statusBadgeNowOpen") : isUpcoming ? t("competition.statusUpcoming") : t("competition.statusClosed")}
            </span>
            {competition.sponsor && (
              <span className="text-[12px] text-white/40">
                {t("competition.detail.sponsoredBy").replace("{name}", competition.sponsor)}
              </span>
            )}
          </div>

          <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            {getText(competition.title_ko, competition.title_en, competition.title_ja, competition.title)}
          </h1>

          {/* Stats row */}
          <div className="mt-4 flex flex-wrap items-center gap-6 text-[13px] text-white/60">
            <div className="flex items-center gap-1.5">
              <Trophy size={14} className="text-[#C8963E]" />
              <span className="font-bold text-[#C8963E] text-[15px]">{prizeDisplay}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={13} />
              <span>
                {t("competition.detail.deadlineColon")} {deadlineLabel}
              </span>
            </div>
            {d > 0 && isOpen && (
              <div className="flex items-center gap-1.5">
                <Clock size={13} />
                <span className="text-white/80 font-semibold">D-{d}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Star size={13} className="text-[#7F77DD]" />
              <span>
                {t("competition.detail.voteEndsColon")} {voteEndLabel}
              </span>
            </div>
          </div>

          {/* CTA */}
          {isOpen && (
            <div className="mt-6 flex items-center gap-3">
              <Link
                href={`/upload?competition=${competition.id}&purpose=competition`}
                className="flex items-center gap-2 rounded-lg px-6 py-3 text-[14px] font-bold text-white transition hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #7B6FE4 0%, #4A3FA8 100%)",
                  boxShadow: "0 4px 16px rgba(83,74,183,0.5)"
                }}
              >
                <Upload size={16} />
                {t("competition.detail.submitFilm")}
              </Link>
              <span className="text-[12px] text-white/30">
                {t("competition.detail.entriesSoFar").replace("{n}", String(videos.length))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-[1400px] px-8 py-12 space-y-16">

        {/* Info grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Concept */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8">
              <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/70">Competition Concept</h2>
              {concept && (
                <p className="text-[15px] leading-relaxed text-white/70">{concept}</p>
              )}

              {competition.description && (
                <div className="mt-6 border-t border-white/[0.06] pt-6">
                  <p className="text-[14px] leading-relaxed text-white/50">{competition.description}</p>
                </div>
              )}
            </div>

            {/* Rules */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8">
              <h2 className="mb-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/70">
                {t("competition.detail.rulesTitle")}
              </h2>
              {rules.length > 0 ? (
                <ol className="space-y-4">
                  {rules.map((rule, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#534AB7]/50 bg-[#534AB7]/10 text-[11px] font-bold text-[#7F77DD]">
                        {i + 1}
                      </span>
                      <p className="text-[14px] leading-relaxed text-white/60">{rule}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[13px] text-white/30">등록된 규칙이 없습니다.</p>
              )}
            </div>

            {(competition.judging_criteria_ko ||
              competition.judging_criteria_en ||
              competition.judging_criteria_ja ||
              competition.judging_criteria) && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8">
                <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/70">
                  {locale === "ko" ? "심사 방법" : locale === "ja" ? "審査方法" : "Judging Criteria"}
                </h2>
                <p className="text-[14px] leading-relaxed text-white/60 whitespace-pre-wrap">
                  {getText(
                    competition.judging_criteria_ko,
                    competition.judging_criteria_en,
                    competition.judging_criteria_ja,
                    competition.judging_criteria ?? "",
                  )}
                </p>
              </div>
            )}

            {(competition.submission_guidelines_ko ||
              competition.submission_guidelines_en ||
              competition.submission_guidelines_ja ||
              competition.submission_guidelines) && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8">
                <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/70">
                  {locale === "ko" ? "출품 가이드라인" : locale === "ja" ? "応募ガイドライン" : "Submission Guidelines"}
                </h2>
                <p className="text-[14px] leading-relaxed text-white/60 whitespace-pre-wrap">
                  {getText(
                    competition.submission_guidelines_ko,
                    competition.submission_guidelines_en,
                    competition.submission_guidelines_ja,
                    competition.submission_guidelines ?? "",
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Side info */}
          <div className="space-y-4">
            {/* Prize breakdown */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/70">
                {t("competition.detail.prizePool")}
              </h2>
              <div className="text-3xl font-extrabold text-[#C8963E]">{prizeDisplay}</div>
              <p className="mt-1 text-[12px] text-white/30">{prizeText}</p>
              {[
                { labelKey: "competition.detail.grandPrizeShare", value: "50%", icon: "🥇" },
                { labelKey: "competition.detail.runnerUpShare", value: "30%", icon: "🥈" },
                { labelKey: "competition.detail.thirdShare", value: "20%", icon: "🥉" },
              ].map((tier) => (
                <div key={tier.labelKey} className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-3">
                  <span className="text-[13px] text-white/50">
                    {tier.icon} {t(tier.labelKey)}
                  </span>
                  <span className="text-[13px] font-semibold text-white/70">{tier.value}</span>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/70">
                {t("competition.detail.timelineTitle")}
              </h2>
              <div className="space-y-4">
                {[
                  { label: t("competition.detail.submissionDeadline"), date: deadlineLabel, icon: Calendar, active: isOpen },
                  { label: t("competition.detail.votingEnds"), date: voteEndLabel, icon: Star, active: false },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                      item.active ? "border-[#534AB7]/50 bg-[#534AB7]/10" : "border-white/10 bg-white/5"
                    }`}>
                      <item.icon size={13} className={item.active ? "text-[#7F77DD]" : "text-white/30"} />
                    </div>
                    <div>
                      <p className="text-[12px] text-white/40">{item.label}</p>
                      <p className="text-[13px] font-semibold text-white/70">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sponsor */}
            {competition.sponsor && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/70">
                  {t("competition.detail.presentedBy")}
                </h2>
                <p className="text-[15px] font-bold text-white">{competition.sponsor}</p>
              </div>
            )}

            {/* Eligibility */}
            {(competition.eligibility_ko ||
              competition.eligibility_en ||
              competition.eligibility_ja ||
              competition.eligibility) && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/70">
                  {t("competition.detail.eligibilityTitle")}
                </h2>
                <p className="text-[13px] leading-relaxed text-white/50">
                  {getText(
                    competition.eligibility_ko,
                    competition.eligibility_en,
                    competition.eligibility_ja,
                    competition.eligibility ?? "",
                  )}
                </p>
              </div>
            )}

            {(competition.announcement_ko ||
              competition.announcement_en ||
              competition.announcement_ja ||
              competition.announcement) && (
              <div className="rounded-2xl border border-[#7F77DD]/20 bg-[#534AB7]/10 p-6">
                <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/70">공지사항</h2>
                <p className="text-[13px] leading-relaxed text-white/60 whitespace-pre-wrap">
                  {getText(
                    competition.announcement_ko,
                    competition.announcement_en,
                    competition.announcement_ja,
                    competition.announcement ?? "",
                  )}
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/70">
                {locale === "ko" ? "환율 안내" : locale === "ja" ? "為替レートについて" : "Exchange Rate Notice"}
              </h2>
              <p className="text-[13px] leading-relaxed text-white/40">
                {locale === "ko"
                  ? `표시된 금액은 공모전 시작 시점의 고정 환율(1 USD = ₩${(competition.exchange_rate_usd_krw ?? 1350).toLocaleString()}, ¥${competition.exchange_rate_usd_jpy ?? 148})을 기준으로 합니다. 실제 지급 시 당일 환율이 적용될 수 있습니다.`
                  : locale === "ja"
                    ? `表示金額は、コンペ開始時点の固定為替レート（1 USD = ₩${(competition.exchange_rate_usd_krw ?? 1350).toLocaleString()}、¥${competition.exchange_rate_usd_jpy ?? 148}）に基づいています。実際の支払い時には当日の為替レートが適用される場合があります。`
                    : `Amounts shown are based on the fixed exchange rate at the start of the competition (1 USD = ₩${(competition.exchange_rate_usd_krw ?? 1350).toLocaleString()}, ¥${competition.exchange_rate_usd_jpy ?? 148}). Actual payment may be subject to the exchange rate at the time of disbursement.`}
              </p>
            </div>
          </div>
        </div>

        {/* Entries section */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/70">
                {t("competition.detail.submissionsEyebrow")}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white">
                {t("competition.detail.entriesHeading")}
                <span className="ml-2 text-[16px] font-normal text-white/30">({videos.length})</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Sort */}
              <div className="flex gap-1">
                {[
                  { key: "views", label: t("competition.detail.sortMostViewed") },
                  { key: "newest", label: t("competition.detail.sortNewest") },
                  { key: "award", label: t("competition.detail.sortAwardShort") },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSortBy(s.key as typeof sortBy)}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                      sortBy === s.key
                        ? "bg-[#534AB7] text-white"
                        : "border border-white/10 text-white/40 hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {/* View toggle */}
              <div className="flex rounded-lg border border-white/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex h-8 w-8 items-center justify-center transition ${
                    viewMode === "grid" ? "bg-[rgba(83,74,183,0.5)] text-white" : "bg-white/5 text-white/40 hover:text-white"
                  }`}
                >
                  <Grid size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex h-8 w-8 items-center justify-center transition ${
                    viewMode === "list" ? "bg-[rgba(83,74,183,0.5)] text-white" : "bg-white/5 text-white/40 hover:text-white"
                  }`}
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
              <h3 className="text-lg font-semibold text-white/50">{t("competition.detail.noEntriesTitle")}</h3>
              <p className="mt-2 text-sm text-white/30">{t("competition.detail.noEntriesHint")}</p>
              {isOpen && (
                <Link
                  href="/upload"
                  className="mt-6 flex items-center gap-2 rounded-lg bg-[#534AB7] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#6B5FD4]"
                >
                  <Upload size={14} />
                  {t("competition.detail.submitNow")}
                </Link>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {sortedVideos.map((video) => {
                const thumb = video.thumbnail_url || null;
                return (
                  <Link
                    key={video.id}
                    href={`/watch/${video.id}`}
                    className="group/card relative block shrink-0 overflow-hidden rounded-xl border border-white/[0.08] transition-all duration-300 hover:border-[rgba(127,119,221,0.5)] hover:shadow-[0_0_0_1px_rgba(127,119,221,0.4),0_0_20px_rgba(127,119,221,0.2)] hover:scale-[1.02]"
                    style={{ background: "rgba(15,13,36,0.9)" }}
                  >
                    <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#1a1547] to-[#0f0d24]" />
                      )}

                      {/* 하단 그라데이션 */}
                      <div
                        className="absolute inset-x-0 bottom-0 z-[1]"
                        style={{
                          height: "70%",
                          background:
                            "linear-gradient(to top, rgba(8,6,24,1) 0%, rgba(8,6,24,0.92) 25%, rgba(8,6,24,0.5) 55%, transparent 100%)",
                          transformOrigin: "bottom center",
                        }}
                      />

                      {video.genre && (
                        <div className="absolute left-2 top-2 z-[2]">
                          <span
                            className="text-[10px] font-semibold text-white/90 px-2 py-0.5 rounded"
                            style={{
                              background: "linear-gradient(135deg, rgba(83,74,183,0.7) 0%, rgba(39,33,92,0.5) 100%)",
                              backdropFilter: "blur(4px)",
                              border: "1px solid rgba(127,119,221,0.25)",
                            }}
                          >
                            {mainGenreLabel(video.genre, locale)}
                          </span>
                        </div>
                      )}

                      {/* 수상 배지 */}
                      {video.award && (
                        <div className="absolute right-2 top-2 z-[2] flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-sm border border-yellow-500/20">
                          <Trophy size={9} className="text-yellow-400" />
                          <span className="text-[9px] font-bold text-yellow-400">{video.award}</span>
                        </div>
                      )}

                      {/* 하단 텍스트 */}
                      <div className="absolute bottom-0 left-0 right-0 z-[2] px-3 pb-3">
                        <h3 className="line-clamp-1 text-[13px] font-bold text-white">{video.title}</h3>
                        {video.profiles?.display_name && (
                          <p className="mt-0.5 text-[11px] text-white/60">{video.profiles.display_name}</p>
                        )}
                        {video.description && (
                          <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-white/50">{video.description}</p>
                        )}
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[11px] text-white/40">
                            {video.view_count
                              ? video.view_count >= 1000
                                ? `${(video.view_count / 1000).toFixed(1)}K ${t("feed.views")}`
                                : `${video.view_count} ${t("feed.views")}`
                              : ""}
                          </span>
                          {/* 플레이 버튼 */}
                          <div className="opacity-0 group-hover/card:opacity-100 transition-all duration-300 flex items-center justify-center shrink-0">
                            <div className="relative flex items-center justify-center">
                              <img
                                src="/genova-play1.png"
                                alt="play"
                                className="h-[34px] w-[34px] object-contain opacity-50"
                              />
                              <svg
                                className="absolute h-[12px] w-[12px]"
                                viewBox="0 0 24 24"
                                fill="white"
                                style={{ marginLeft: "1px" }}
                              >
                                <polygon points="6,3 20,12 6,21" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedVideos.map((video, idx) => {
                const thumb = video.thumbnail_url || `https://picsum.photos/seed/${video.id}/400/225`;
                return (
                  <Link
                    key={video.id}
                    href={`/watch/${video.id}`}
                    className="group flex items-center gap-4 rounded-xl border border-white/[0.07] bg-[#0f0d24] p-3 transition hover:border-[rgba(127,119,221,0.3)] hover:bg-white/[0.04]"
                  >
                    <span className="w-6 shrink-0 text-center text-[13px] font-bold text-white/20">{idx + 1}</span>
                    <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg">
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 text-[14px] font-semibold text-white">{video.title}</h3>
                      <p className="text-[12px] text-white/40">
                        {video.view_count
                          ? `${video.view_count >= 1000 ? (video.view_count / 1000).toFixed(1) + "K" : video.view_count} ${t("feed.views")}`
                          : t("competition.detail.noViewsYet")}
                      </p>
                    </div>
                    {video.award && (
                      <span className="flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-[11px] font-bold text-yellow-400">
                        <Trophy size={10} />
                        {video.award}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
