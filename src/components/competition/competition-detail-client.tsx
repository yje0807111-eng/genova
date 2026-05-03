"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/components/genova/language-provider";
import { intlDateLocale } from "@/lib/i18n/browser-locale";
import {
  Trophy, Calendar, Users, Clock, ChevronLeft,
  Upload, Star, Play, Grid, List
} from "lucide-react";

type Competition = {
  id: string;
  title: string;
  genre: string;
  status: string;
  deadline: string;
  vote_end: string;
  prize_info: string;
  sponsor: string | null;
  description: string | null;
  rules: string | null;
  thumbnail_url: string | null;
  banner_url: string | null;
  concept: string | null;
  eligibility: string | null;
};

type Video = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number | null;
  uploaded_by: string | null;
  created_at: string;
  award: string | null;
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

const RULE_FALLBACK_EN = [
  "All submitted videos must be AI-generated. Human-captured footage is not permitted.",
  "Maximum runtime: 90 seconds for short films, 4 minutes for music videos.",
  "You must tag all AI tools used during production at the time of upload.",
  "Each participant may submit up to 3 entries per competition.",
  "Submitted works must be original and must not infringe on third-party IP.",
  "Voting is open to all registered Genova members during the voting period.",
  "Final winners will be selected: 50% audience votes + 50% jury score.",
] as const;

const MOCK_CONCEPT_EN =
  "Push the boundaries of AI filmmaking. We're looking for bold, original works that showcase the unique creative possibilities of artificial intelligence — from surreal visuals to emotionally resonant narratives. Show us what only AI can imagine.";

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

  const d = dDay(competition.deadline);
  const isOpen = ["Open", "접수중", "In Review", "Voting"].includes(competition.status);
  const isUpcoming = ["Upcoming", "예정"].includes(competition.status);
  const isClosed = !isOpen && !isUpcoming;

  const bannerImage = competition.banner_url || competition.thumbnail_url ||
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1400&q=80";

  const concept = competition.concept || t("competition.detail.mockConcept", MOCK_CONCEPT_EN);
  const rules = competition.rules
    ? competition.rules.split("\n").filter(Boolean)
    : RULE_FALLBACK_EN.map((fb, i) => t(`competition.detail.rule${i + 1}`, fb));

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
        <img src={bannerImage} alt="" className="h-full w-full object-cover" />
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
            {competition.title}
          </h1>

          {/* Stats row */}
          <div className="mt-4 flex flex-wrap items-center gap-6 text-[13px] text-white/60">
            <div className="flex items-center gap-1.5">
              <Trophy size={14} className="text-[#C8963E]" />
              <span className="font-bold text-[#C8963E] text-[15px]">{formatPrize(competition.prize_info)}</span>
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
                href="/upload"
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
              <p className="text-[15px] leading-relaxed text-white/70">{concept}</p>

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
            </div>
          </div>

          {/* Side info */}
          <div className="space-y-4">
            {/* Prize breakdown */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/70">
                {t("competition.detail.prizePool")}
              </h2>
              <div className="text-3xl font-extrabold text-[#C8963E]">{formatPrize(competition.prize_info)}</div>
              <p className="mt-1 text-[12px] text-white/30">{competition.prize_info}</p>
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
            {competition.eligibility && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/70">
                  {t("competition.detail.eligibilityTitle")}
                </h2>
                <p className="text-[13px] leading-relaxed text-white/50">{competition.eligibility}</p>
              </div>
            )}
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
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {sortedVideos.map((video, idx) => {
                const thumb = video.thumbnail_url || `https://picsum.photos/seed/${video.id}/400/225`;
                return (
                  <Link
                    key={video.id}
                    href={`/watch/${video.id}`}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-[#0f0d24] transition-all duration-200 hover:-translate-y-1 hover:border-[rgba(127,119,221,0.3)] hover:shadow-[0_8px_24px_rgba(83,74,183,0.25)]"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img src={thumb} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90" />
                      {/* Rank badge */}
                      {idx < 3 && (
                        <div className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                          idx === 0 ? "bg-[#FFD700] text-black" :
                          idx === 1 ? "bg-[#C0C0C0] text-black" :
                          "bg-[#CD7F32] text-black"
                        }`}>
                          {idx + 1}
                        </div>
                      )}
                      {video.award && (
                        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                          <Trophy size={10} className="text-yellow-400" />
                          <span className="text-[9px] font-bold text-white">{video.award}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                          <Play size={16} fill="white" className="ml-0.5 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="line-clamp-1 text-[13px] font-semibold text-white">{video.title}</h3>
                      <p className="mt-0.5 text-[11px] text-white/40">
                        {(() => {
                          const vc = video.view_count ?? 0;
                          if (!vc) return "";
                          const num =
                            vc >= 1000 ? `${(vc / 1000).toFixed(1)}K` : String(vc);
                          return `${num} ${t("feed.views")}`;
                        })()}
                      </p>
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
