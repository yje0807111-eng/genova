"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LayoutGrid, List, Star } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import type { Locale } from "@/lib/i18n/translations";
import { intlDateLocale } from "@/lib/i18n/browser-locale";
import { formatPrizeWithConversion } from "@/lib/utils/format-prize";

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
  description?: string | null;
  thumbnail_url?: string | null;
  exchange_rate_usd_krw?: number | null;
  exchange_rate_usd_jpy?: number | null;
  base_currency?: string | null;
  is_featured?: boolean | null;
};

function getLangText(
  locale: string,
  ko: string | null | undefined,
  en: string | null | undefined,
  ja: string | null | undefined,
  fallback: string,
): string {
  if (locale === "ko") return ko || en || ja || fallback;
  if (locale === "ja") return ja || en || ko || fallback;
  return en || ko || ja || fallback;
}

function dDay(deadline: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
}

function formatPrize(prizeInfo: string, _t: (key: string, fallback?: string) => string): string {
  const base = prizeInfo.split("+")[0].trim();
  const cleaned = base
    .replace("총 상금", "")
    .replace("상금", "")
    .trim();

  const wonMatch = cleaned.match(/([0-9,]+)만원/);
  if (wonMatch) {
    const manwon = parseInt(wonMatch[1].replace(/,/g, ""));
    const krw = manwon * 10000;
    if (krw >= 10000000) return `₩${(krw / 10000000).toFixed(0)}M`;
    if (krw >= 1000000) return `₩${(krw / 1000000).toFixed(0)}00K`;
    return `₩${krw.toLocaleString()}`;
  }

  if (cleaned.includes("$")) return cleaned;
  return cleaned;
}

function genreUiLabel(genre: string | undefined | null, locale: Locale): string {
  if (!genre || genre === "전체") return "";
  return locale !== "en" ? genre : formatGenreLabel(genre);
}

function formatGenreLabel(genre: string): string {
  const map: Record<string, string> = {
    "전체": "All Genres",
    "드라마": "Drama",
    "로맨스": "Romance",
    "스릴러": "Thriller",
    "판타지": "Fantasy",
    "코미디": "Comedy",
    "액션": "Action",
    "공포": "Horror",
    "SF": "Sci-Fi",
    "다큐멘터리": "Documentary",
    "애니메이션": "Animation",
    "뮤직비디오": "Music Video",
    "광고": "Commercial",
    "단편": "Short Film",
  };
  return map[genre] ?? genre;
}

function FeaturedCard({ c }: { c: Competition }) {
  const { t, locale } = useI18n();
  const dateLocale = intlDateLocale(locale);
  const d = dDay(c.deadline);
  const thumb = c.thumbnail_url || null;

  return (
    <Link
      href={`/competition/${c.id}`}
      className="group relative block h-[270px] w-[480px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#080618]/40 text-inherit no-underline backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:shadow-[0_0_40px_rgba(127,119,221,0.15)]"
    >
      <div className="relative h-full w-full overflow-hidden rounded-xl">
        {thumb ? (
          <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#15102E] via-[#080618] to-[#0A0617]">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-white/[0.08]" fill="currentColor" aria-hidden="true">
              <path d="M9 4.5a1 1 0 0 0-.8.4L7 6.5H4.5A2.5 2.5 0 0 0 2 9v8a2.5 2.5 0 0 0 2.5 2.5h15A2.5 2.5 0 0 0 22 17V9a2.5 2.5 0 0 0-2.5-2.5H17l-1.2-1.6a1 1 0 0 0-.8-.4H9zm3 4.25a4.25 4.25 0 1 1 0 8.5 4.25 4.25 0 0 1 0-8.5z" />
            </svg>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">이미지 준비 중</p>
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,6,24,1) 0%, rgba(8,6,24,1) 15%, rgba(8,6,24,0.85) 35%, rgba(8,6,24,0.3) 55%, rgba(8,6,24,0) 75%)" }} />
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(83,74,183,0.15) 0%, transparent 70%)" }}
        />

        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/70 backdrop-blur-md">
            {c.sponsor ? (
              `Sponsored by ${c.sponsor}`
            ) : (
              <>
                <Star size={11} className="shrink-0 fill-[#AFA9EC] text-[#AFA9EC]" aria-hidden />
                {t("competition.featuredStar")}
              </>
            )}
          </span>
        </div>

        <div className="absolute right-4 top-4 z-10">
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white/90 backdrop-blur-sm"
          style={{
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          D-{d}
        </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-0">
        <h3 className="mb-0.5 line-clamp-1 text-[17px] font-extrabold text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
          {getLangText(locale, c.title_ko, c.title_en, c.title_ja, c.title)}
        </h3>
        {c.description && (
          <p className="mb-1 line-clamp-1 text-[12px] text-white/55" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            {c.description}
          </p>
        )}
        <p className="mb-3 text-[13px] font-extrabold text-[#F5D182]" style={{ textShadow: "0 0 12px rgba(200,150,62,0.4)" }}>
          {formatPrizeWithConversion(c.prize_info_ko, c.prize_info_en, c.prize_info_ja, c.prize_info, locale, c.base_currency, c.exchange_rate_usd_krw ?? 1350, c.exchange_rate_usd_jpy ?? 148)}
        </p>
        <div className="flex items-center gap-4">
          <div
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 py-2 text-[12px] font-bold text-white/80 backdrop-blur-md transition-all duration-200 hover:bg-white/10 hover:text-white"
            style={{
              backdropFilter: "blur(8px)",
            }}
          >
            {t("competition.viewDetails")}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/60">
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3 opacity-60" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
              </svg>
              {new Date(c.deadline).toLocaleDateString(dateLocale, {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })}
              <span className="text-white/40">{t("competition.deadline")}</span>
            </span>
          </div>
        </div>
        </div>
      </div>
    </Link>
  );
}

function CompetitionCard({ c }: { c: Competition }) {
  const { t, locale } = useI18n();
  const dateLocale = intlDateLocale(locale);
  const d = dDay(c.deadline);
  const thumb = c.thumbnail_url || null;
  const deadlineLabel = new Date(c.deadline).toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const isOpen = ["Open", "접수중", "In Review", "Voting"].includes(c.status);
  const isUpcoming = ["Upcoming", "예정"].includes(c.status);

  return (
    <div className="gradient-border-card group overflow-hidden rounded-xl border border-white/[0.09] bg-[#111118] transition-all duration-200 hover:-translate-y-[2px] hover:border-[rgba(127,119,221,0.3)] hover:shadow-[0_8px_32px_rgba(83,74,183,0.2)]">
      <div className="gradient-border-card-inner">
      <Link href={`/competition/${c.id}`} className="block p-3 pb-0">
        <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: "16/9" }}>
          {thumb ? (
            <img src={thumb} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1547] to-[#0f0d24]">
              <img src="/genova-logo.png" alt="Genova" className="h-28 w-28 object-contain opacity-15" />
            </div>
          )}
          <div className="absolute left-[10px] top-[10px]">
            <span className="rounded-md border border-white/10 bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              {c.genre && c.genre !== "전체" ? genreUiLabel(c.genre, locale) : t("competition.allGenres")}
            </span>
          </div>
          <div className="absolute bottom-[10px] right-[12px]">
            <span className="rounded-md bg-black/60 px-2 py-0.5 text-[12px] font-bold text-white backdrop-blur-sm">D-{d}</span>
          </div>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-[10px] p-[16px_18px]">
        <Link href={`/competition/${c.id}`}>
          <h3 className="line-clamp-1 text-[17px] font-bold text-white">
            {getLangText(locale, c.title_ko, c.title_en, c.title_ja, c.title)}
          </h3>
        </Link>
        <p className="text-[15px] font-semibold text-[#C8963E]">
          {formatPrizeWithConversion(c.prize_info_ko, c.prize_info_en, c.prize_info_ja, c.prize_info, locale, c.base_currency, c.exchange_rate_usd_krw ?? 1350, c.exchange_rate_usd_jpy ?? 148)}
        </p>
        <div className="flex items-center justify-between text-[12px] text-white/40">
          <span>{deadlineLabel}</span>
        </div>
        <span className={`inline-flex w-fit rounded-full px-2 py-1 text-[11px] font-bold ${
          isOpen ? "bg-green-500/15 text-green-400" : isUpcoming ? "bg-blue-500/15 text-blue-400" : "bg-white/5 text-white/30"
        }`}>
          {isOpen ? t("competition.statusOpen") : isUpcoming ? t("competition.statusUpcoming") : t("competition.statusClosed")}
        </span>
      </div>
      </div>
    </div>
  );
}

function CompetitionTableRow({ c, idx, participantCount }: { c: Competition; idx: number; participantCount: number }) {
  const { t, locale } = useI18n();
  const dateLocale = intlDateLocale(locale);
  const d = dDay(c.deadline);
  const thumb = c.thumbnail_url || null;
  const isOpen = ["Open", "접수중", "In Review", "Voting"].includes(c.status);
  const isUpcoming = ["Upcoming", "예정"].includes(c.status);
  const isClosed = !isOpen && !isUpcoming;
  const deadlineLabel = new Date(c.deadline).toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  void idx;

  return (
    <div
      className="group relative flex items-center gap-8 px-6 py-4 transition-all duration-200 hover:bg-white/[0.02]"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: isClosed
          ? "linear-gradient(to bottom, rgba(255,255,255,0.01) 0%, rgba(0,0,0,0.1) 100%)"
          : "linear-gradient(to bottom, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)",
        opacity: isClosed ? 0.6 : 1,
        filter: isClosed ? "grayscale(0.4)" : "none",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: "linear-gradient(to bottom, rgba(83,74,183,0.06) 0%, rgba(83,74,183,0.03) 100%)" }}
      />
      <div className="relative z-10 h-[85px] w-44 shrink-0 overflow-hidden rounded-md">
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1547] to-[#0f0d24]">
            <img src="/genova-logo.png" alt="Genova" className="h-20 w-20 object-contain opacity-15" />
          </div>
        )}
      </div>
      <div className="relative z-10 flex min-w-0 flex-1 min-w-[300px] flex-col gap-1">
        {/* Title + status */}
        <div className="flex items-center gap-2">
          <h3 className="line-clamp-1 text-[14px] font-bold text-white">
            {getLangText(locale, c.title_ko, c.title_en, c.title_ja, c.title)}
          </h3>
          {isOpen && (
            <span className="shrink-0 rounded-full border border-green-500/30 bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-300">
              {t("competition.statusOpenShort")}
            </span>
          )}
          {isUpcoming && (
            <span className="shrink-0 rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
              {t("competition.statusUpcoming")}
            </span>
          )}
        </div>

        {/* One-line description */}
        {c.description && (
          <p className="line-clamp-1 text-[12px] text-white/40">{c.description}</p>
        )}

        {/* Genre + sponsor tags */}
        <div className="mt-0.5 flex items-center gap-1.5">
          {c.genre && c.genre !== "전체" && (
            <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60">
              {genreUiLabel(c.genre, locale)}
            </span>
          )}
          {c.sponsor && (
            <span className="rounded border border-[#534AB7]/20 bg-[#534AB7]/10 px-1.5 py-0.5 text-[10px] text-[#AFA9EC]/80">
              {c.sponsor}
            </span>
          )}
        </div>
      </div>
      <div className="relative z-10 w-36 shrink-0 text-center">
        <span className="text-[13px] font-bold text-[#F5D182]">
          {formatPrizeWithConversion(c.prize_info_ko, c.prize_info_en, c.prize_info_ja, c.prize_info, locale, c.base_currency, c.exchange_rate_usd_krw ?? 1350, c.exchange_rate_usd_jpy ?? 148)}
        </span>
      </div>
      <div className="relative z-10 w-40 shrink-0 text-center">
        <p className="text-[13px] font-medium text-white/70">{deadlineLabel}</p>
        <p className="text-center text-[11px] text-white/50">D-{d}</p>
      </div>
      <div className="relative z-10 w-28 shrink-0 text-center">
        <p className="text-[13px] font-medium text-white/60">{participantCount}<span className="ml-0.5 text-[11px] text-white/40">{t("competition.peopleUnit")}</span></p>
      </div>
      <div className="relative z-10 w-32 shrink-0 text-center">
        {isOpen ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            <span className="text-emerald-400/90">●</span>
            {t("competition.statusOpenShort")}
          </span>
        ) : isUpcoming ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-sky-300/80">
            <span className="text-sky-300/70">●</span>
            {t("competition.statusUpcoming")}
          </span>
        ) : (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
            {t("competition.statusClosed")}
          </span>
        )}
      </div>
      <div className="relative z-10 w-36 shrink-0 text-center">
        <Link href={`/competition/${c.id}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white">
          {t("competition.viewDetails")}
        </Link>
      </div>
    </div>
  );
}

export function CompetitionListClient({
  active,
  upcoming,
  closed,
  now,
  participantCounts = {},
}: {
  active: Competition[];
  upcoming: Competition[];
  closed: Competition[];
  now: string;
  participantCounts?: Record<string, number>;
}) {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<"all" | "open" | "upcoming" | "closed">("all");
  const [sortMode, setSortMode] = useState<"deadline" | "prize" | "participants">("deadline");
  const [gridMode, setGridMode] = useState<"grid" | "list">("list");
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [featuredPage, setFeaturedPage] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");
  const PER_PAGE = 10;
  const FEATURED_PER_PAGE = 4;
  void now;

  const allCompetitions = useMemo(() => [...active, ...upcoming, ...closed], [active, upcoming, closed]);
  const featuredComps = useMemo(
    () => active.filter((c) => Boolean(c.is_featured)),
    [active],
  );
  const featuredTotal = Math.ceil(featuredComps.length / FEATURED_PER_PAGE);
  const featuredSlice = featuredComps.slice(
    featuredPage * FEATURED_PER_PAGE,
    (featuredPage + 1) * FEATURED_PER_PAGE,
  );

  useEffect(() => {
    const maxIdx = Math.max(0, featuredTotal - 1);
    setFeaturedPage((p) => Math.min(p, maxIdx));
  }, [featuredTotal]);
  const goToFeaturedPage = (next: number, dir: "left" | "right") => {
    if (sliding) return;
    setSlideDir(dir);
    setSliding(true);
    setTimeout(() => {
      setFeaturedPage(next);
      setSliding(false);
    }, 350);
  };
  const SORT_OPTIONS = useMemo(
    () => [
      { key: "deadline", label: t("competition.sortDeadlineSoon") },
      { key: "prize", label: t("competition.sortHighestPrize") },
      { key: "participants", label: t("competition.sortMostParticipants") },
    ],
    [t],
  );

  const filtered = useMemo(() => {
    const byTab = allCompetitions.filter((c) => {
      if (activeTab === "open") return active.some((a) => a.id === c.id);
      if (activeTab === "upcoming") return upcoming.some((u) => u.id === c.id);
      if (activeTab === "closed") return closed.some((cl) => cl.id === c.id);
      return true;
    });

    return byTab
      .filter(() => true)
      .sort((a, b) => {
        const statusOrder = (c: Competition) => {
          if (["Open", "접수중", "In Review", "Voting"].includes(c.status)) return 0;
          if (["Upcoming", "예정"].includes(c.status)) return 1;
          return 2;
        };
        const statusDiff = statusOrder(a) - statusOrder(b);
        if (statusDiff !== 0) return statusDiff;

        if (sortMode === "deadline") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        if (sortMode === "prize") return (parseInt(b.prize_info.replace(/[^0-9]/g, "")) || 0) - (parseInt(a.prize_info.replace(/[^0-9]/g, "")) || 0);
        return 0;
      });
  }, [allCompetitions, activeTab, sortMode, active, upcoming, closed]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-4">
      {featuredComps.length > 0 && (
        <section id="competition-featured" className="pt-8">

          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#AFA9EC" />
                    <stop offset="100%" stopColor="#534AB7" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="none"
                  stroke="url(#starGradient)"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
              <h2 className="text-[18px] font-extrabold tracking-tight text-white">
                {t("competition.featuredSectionTitle")}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab("open");
                setPage(1);
                setTimeout(() => {
                  const el = document.getElementById("competition-list-section");
                  if (el) {
                    const top = el.getBoundingClientRect().top + window.scrollY - 80;
                    window.scrollTo({ top, behavior: "smooth" });
                  }
                }, 50);
              }}
              className="text-[12px] font-medium text-[#7F77DD] transition hover:text-[#AFA9EC]"
            >
              {t("competition.viewAllFeatured")}
            </button>
          </div>

          <div className="relative">
            <div
              className="flex gap-4"
              style={{
                animation: sliding
                  ? slideDir === "right"
                    ? "slideOutLeft 0.35s ease-in-out forwards"
                    : "slideOutRight 0.35s ease-in-out forwards"
                  : slideDir === "right"
                    ? "slideInFromRight 0.35s ease-in-out forwards"
                    : "slideInFromLeft 0.35s ease-in-out forwards",
              }}
            >
              {featuredSlice.map((c) => <FeaturedCard key={c.id} c={c} />)}
            </div>

            {featuredPage > 0 && (
              <button
                type="button"
                onClick={() => goToFeaturedPage(featuredPage - 1, "left")}
                className="absolute -left-14 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0f0d24]/90 text-white backdrop-blur-sm transition hover:border-[#534AB7] hover:bg-[#534AB7]/20 hover:text-[#AFA9EC]"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            {featuredPage < featuredTotal - 1 && (
              <button
                type="button"
                onClick={() => goToFeaturedPage(featuredPage + 1, "right")}
                className="absolute -right-9 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0f0d24]/90 text-white backdrop-blur-sm transition hover:border-[#534AB7] hover:bg-[#534AB7]/20 hover:text-[#AFA9EC]"
              >
                <ChevronRight size={18} />
              </button>
            )}

            {featuredTotal > 1 && (
              <div className="mt-4 flex justify-center gap-1.5">
                {Array.from({ length: featuredTotal }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToFeaturedPage(i, i > featuredPage ? "right" : "left")}
                    className={`rounded-full transition-all duration-300 ${
                      i === featuredPage
                        ? "h-1.5 w-4 bg-[#534AB7]"
                        : "h-1.5 w-1.5 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <div id="competition-list-section" className="flex items-center justify-between border-b border-white/[0.08] pb-0 scroll-mt-20">
        <div className="flex gap-1">
          {[
            { key: "all", label: t("competition.allCompetitions"), count: allCompetitions.length },
            { key: "open", label: t("competition.nowOpen"), count: active.length },
            { key: "upcoming", label: t("competition.upcoming"), count: upcoming.length },
            { key: "closed", label: t("competition.past"), count: closed.length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setActiveTab(tab.key as "all" | "open" | "upcoming" | "closed"); setPage(1); }}
              className={`-mb-px flex items-center gap-1 border-b-2 px-4 py-2.5 text-[13px] font-medium transition ${activeTab === tab.key ? "border-[#7F77DD] text-white" : "border-transparent text-white/40 hover:text-white/70"}`}
            >
              {tab.label}
              <span className="text-[11px] font-medium text-white/40">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 pb-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => { setSortOpen((v) => !v); }}
              className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/70 backdrop-blur-md transition hover:bg-white/[0.08] hover:text-white"
            >
              <span>{SORT_OPTIONS.find((s) => s.key === sortMode)?.label ?? t("competition.sortDeadlineSoon")}</span>
              <svg className={`h-3 w-3 transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {sortOpen && (
              <div
                className="absolute right-0 top-[calc(100%+6px)] z-[200] min-w-[180px] rounded-xl p-1.5"
                style={{
                  background: "rgba(13,11,31,0.97)",
                  border: "1px solid rgba(127,119,221,0.15)",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(83,74,183,0.1)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {SORT_OPTIONS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => { setSortMode(s.key as "deadline" | "prize" | "participants"); setSortOpen(false); setPage(1); }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12px] transition-all duration-150"
                    style={{
                      color: sortMode === s.key ? "white" : "rgba(255,255,255,0.45)",
                      background: sortMode === s.key ? "rgba(83,74,183,0.25)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (sortMode !== s.key) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      if (sortMode !== s.key) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>{s.label}</span>
                    {sortMode === s.key && (
                      <svg className="h-3 w-3 text-[#7F77DD]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
            <button type="button" onClick={() => setGridMode("list")} className={`flex h-8 w-8 items-center justify-center transition ${gridMode === "list" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>
              <List size={14} />
            </button>
            <button type="button" onClick={() => setGridMode("grid")} className={`flex h-8 w-8 items-center justify-center transition ${gridMode === "grid" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {gridMode === "list" ? (
        <div className="mt-0 overflow-hidden rounded-xl border border-white/[0.08]">
          <div className="flex items-center gap-8 border-b border-white/[0.08] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/40" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="w-44 shrink-0" />
            <div className="flex-1 min-w-[300px] text-left">{t("competition.colCompetition")}</div>
            <div className="w-36 shrink-0 text-center">{t("competition.colPrize")}</div>
            <div className="w-40 shrink-0 text-center">{t("competition.colDeadline")}</div>
            <div className="w-28 shrink-0 text-center">{t("competition.colParticipants")}</div>
            <div className="w-32 shrink-0 text-center">{t("competition.colStatus")}</div>
            <div className="w-36 shrink-0 text-center">{t("competition.colActions")}</div>
          </div>
          <div>
            {paginated.map((c, idx) => <CompetitionTableRow key={c.id} c={c} idx={(page - 1) * PER_PAGE + idx} participantCount={participantCounts[c.id] ?? 0} />)}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((c) => <CompetitionCard key={c.id} c={c} />)}
        </div>
      )}

      <div
        className="relative mt-12 overflow-hidden rounded-3xl border border-white/[0.1] p-10 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(127,119,221,0.12) 0%, rgba(83,74,183,0.06) 50%, rgba(8,6,24,0.6) 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(127,119,221,0.25) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <span className="text-[10px] text-[#7F77DD]">✦</span>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7F77DD]/75">
                For Brands & Creators
              </p>
            </div>
            <h2
              className="text-[24px] font-black leading-tight text-white md:text-[28px]"
              style={{ letterSpacing: "-0.02em" }}
            >
              당신의 제품으로 공모전을 열어보세요
            </h2>
            <p className="mt-2 text-[13px] text-white/55">
              Genova가 기획부터 정산까지 전담합니다. 24시간 내 상담 연결.
            </p>
          </div>
          <Link
            href="/business"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-[13px] font-bold text-white transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
              boxShadow: "0 8px 32px rgba(83,74,183,0.5)",
            }}
          >
            폼 작성하기
            <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-medium transition ${page === p ? "bg-[#534AB7] text-white" : "border border-white/10 text-white/40 hover:text-white"}`}
            >
              {p}
            </button>
          ))}
          {totalPages > 5 && (
            <>
              <span className="text-white/30">...</span>
              <button type="button" onClick={() => setPage(totalPages)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-[13px] font-medium text-white/40 transition hover:text-white">
                {totalPages}
              </button>
              <button type="button" onClick={() => setPage(Math.min(page + 1, totalPages))} className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-[12px] font-medium text-white/40 transition hover:text-white">
                {t("competition.nextPage")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
