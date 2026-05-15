"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
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

function CompetitionCard({ c, participantCount }: { c: Competition; participantCount: number }) {
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
  const isClosed = !isOpen && !isUpcoming;
  const urgent = isOpen && d >= 0 && d <= 3;
  const prize = formatPrizeWithConversion(
    c.prize_info_ko,
    c.prize_info_en,
    c.prize_info_ja,
    c.prize_info,
    locale,
    c.base_currency,
    c.exchange_rate_usd_krw ?? 1350,
    c.exchange_rate_usd_jpy ?? 148,
  );

  return (
    <Link
      href={`/competition/${c.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.10] bg-[#0e0e14] shadow-[0_2px_12px_rgba(0,0,0,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(127,119,221,0.5)] hover:shadow-[0_10px_30px_rgba(83,74,183,0.28)]"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        {thumb ? (
          <Image
            src={thumb}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(127,119,221,0.20) 0%, #0a0a0a 70%)" }}
          >
            <Image src="/genova-logo.png" alt="Genova" width={88} height={88} className="h-16 w-16 object-contain opacity-[0.12]" />
          </div>
        )}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{ background: "linear-gradient(180deg, transparent 0%, rgba(14,14,20,0.85) 100%)" }}
        />
        <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          <span className="rounded-md border border-white/15 bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/85 backdrop-blur-md">
            {c.genre && c.genre !== "전체" ? genreUiLabel(c.genre, locale) : t("competition.allGenres")}
          </span>
          {!isClosed && (
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-black tabular-nums backdrop-blur-md ${
                urgent
                  ? "border border-red-400/40 bg-red-500/30 text-red-100"
                  : "border border-white/15 bg-black/55 text-white"
              }`}
            >
              D-{d}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="line-clamp-1 text-[15px] font-bold text-white">
          {getLangText(locale, c.title_ko, c.title_en, c.title_ja, c.title)}
        </h3>
        <p className="truncate text-[15px] font-black text-[#F5D182]">{prize}</p>
        <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-white/40">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isOpen ? "animate-pulse bg-emerald-400" : isUpcoming ? "bg-sky-400" : "bg-white/25"
              }`}
            />
            <span
              className={
                isOpen ? "font-semibold text-emerald-300" : isUpcoming ? "font-semibold text-sky-300" : "text-white/35"
              }
            >
              {isOpen ? t("competition.statusOpen") : isUpcoming ? t("competition.statusUpcoming") : t("competition.statusClosed")}
            </span>
            <span className="text-white/20">·</span>
            <span>{deadlineLabel}</span>
          </span>
          {participantCount > 0 ? (
            <span className="shrink-0 tabular-nums text-white/45">
              {participantCount.toLocaleString()}
              <span className="ml-0.5 text-white/30">{t("competition.peopleUnit")}</span>
            </span>
          ) : null}
        </div>
      </div>
    </Link>
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
          : "linear-gradient(to bottom, var(--border-white-02) 0%, rgba(255,255,255,0.01) 100%)",
        opacity: isClosed ? 0.6 : 1,
        filter: isClosed ? "grayscale(0.4)" : "none",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: "linear-gradient(to bottom, var(--tint-accent-06) 0%, rgba(83,74,183,0.03) 100%)" }}
      />
      <div className="relative z-10 h-[85px] w-44 shrink-0 overflow-hidden rounded-md">
        {thumb ? (
          <Image src={thumb} alt="" fill sizes="176px" className="object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1547] to-[#1a1a1a]">
            <Image src="/genova-logo.png" alt="Genova" width={80} height={80} className="h-20 w-20 object-contain opacity-15" />
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
          <p className="line-clamp-1 text-[12px] text-white/35">{c.description}</p>
        )}

        {/* Genre + sponsor tags */}
        <div className="mt-0.5 flex items-center gap-1.5">
          {c.genre && c.genre !== "전체" && (
            <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/55">
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
        <p className="text-[13px] font-medium text-white/55">{participantCount}<span className="ml-0.5 text-[11px] text-white/35">{t("competition.peopleUnit")}</span></p>
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
  const [gridMode, setGridMode] = useState<"grid" | "list">("grid");
  const [sortOpen, setSortOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  void now;

  const allCompetitions = useMemo(() => [...active, ...upcoming, ...closed], [active, upcoming, closed]);

  const SORT_OPTIONS = useMemo(
    () => [
      { key: "deadline", label: t("competition.sortDeadlineSoon") },
      { key: "prize", label: t("competition.sortHighestPrize") },
      { key: "participants", label: t("competition.sortMostParticipants") },
    ],
    [t],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byTab = allCompetitions.filter((c) => {
      if (activeTab === "open" && !active.some((a) => a.id === c.id)) return false;
      if (activeTab === "upcoming" && !upcoming.some((u) => u.id === c.id)) return false;
      if (activeTab === "closed" && !closed.some((cl) => cl.id === c.id)) return false;
      if (q) {
        const hay = [
          c.title,
          c.title_ko,
          c.title_en,
          c.title_ja,
          c.sponsor,
          c.id,
        ]
          .filter((s): s is string => Boolean(s))
          .some((s) => s.toLowerCase().includes(q));
        if (!hay) return false;
      }
      return true;
    });

    return byTab.sort((a, b) => {
      const statusOrder = (c: Competition) => {
        if (["Open", "접수중", "In Review", "Voting"].includes(c.status)) return 0;
        if (["Upcoming", "예정"].includes(c.status)) return 1;
        return 2;
      };
      const statusDiff = statusOrder(a) - statusOrder(b);
      if (statusDiff !== 0) return statusDiff;

      if (sortMode === "deadline")
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (sortMode === "prize")
        return (
          (parseInt(b.prize_info.replace(/[^0-9]/g, "")) || 0) -
          (parseInt(a.prize_info.replace(/[^0-9]/g, "")) || 0)
        );
      // participants — 실제 참가자 수 기준 (이전엔 미구현이라 정렬 무동작)
      if (sortMode === "participants")
        return (
          (participantCounts?.[b.id] ?? 0) - (participantCounts?.[a.id] ?? 0)
        );
      return 0;
    });
  }, [
    allCompetitions,
    activeTab,
    sortMode,
    search,
    active,
    upcoming,
    closed,
    participantCounts,
  ]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
          <span>◆</span>
          {t("competition.allLabel", "ALL CONTESTS")}
        </p>
        <h2 className="mt-1.5 text-[24px] font-black tracking-tight text-white sm:text-[28px]">
          {t("competition.allSectionTitle", "전체 공모전")}
        </h2>
      </div>

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
              className={`-mb-px flex items-center gap-1 border-b-2 px-4 py-2.5 text-[13px] font-medium transition ${activeTab === tab.key ? "border-[#7F77DD] text-white" : "border-transparent text-white/35 hover:text-white/70"}`}
            >
              {tab.label}
              <span className="text-[11px] font-medium text-white/35">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 pb-2">
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("competition.searchPlaceholder", "공모전 검색")}
            className="h-8 w-[160px] rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#7F77DD]/40 focus:bg-white/[0.06] sm:w-[200px]"
          />
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
                      background: sortMode === s.key ? "var(--tint-accent-25)" : "transparent",
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
            <button type="button" onClick={() => setGridMode("list")} className={`flex h-8 w-8 items-center justify-center transition ${gridMode === "list" ? "bg-white/10 text-white" : "text-white/35 hover:text-white/70"}`}>
              <List size={14} />
            </button>
            <button type="button" onClick={() => setGridMode("grid")} className={`flex h-8 w-8 items-center justify-center transition ${gridMode === "grid" ? "bg-white/10 text-white" : "text-white/35 hover:text-white/70"}`}>
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {gridMode === "list" ? (
        <div className="mt-0 overflow-hidden rounded-xl border border-white/[0.08]">
          <div className="flex items-center gap-8 border-b border-white/[0.08] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/35" style={{ background: "rgba(255,255,255,0.04)" }}>
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
          {paginated.map((c) => <CompetitionCard key={c.id} c={c} participantCount={participantCounts[c.id] ?? 0} />)}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] py-16 text-center">
          <p className="text-[13px] text-white/45">
            {search.trim()
              ? t("competition.noSearchResults", "검색 결과가 없습니다")
              : t("competition.noResults", "표시할 공모전이 없습니다")}
          </p>
        </div>
      ) : null}

      <div
        className="relative mt-12 overflow-hidden rounded-3xl border border-white/[0.1] p-10 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(135deg, var(--tint-purple-12) 0%, var(--tint-accent-06) 50%, rgba(10,10,10,0.6) 100%)",
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
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-medium transition ${page === p ? "bg-[#534AB7] text-white" : "border border-white/10 text-white/35 hover:text-white"}`}
            >
              {p}
            </button>
          ))}
          {totalPages > 5 && (
            <>
              <span className="text-white/30">...</span>
              <button type="button" onClick={() => setPage(totalPages)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-[13px] font-medium text-white/35 transition hover:text-white">
                {totalPages}
              </button>
              <button type="button" onClick={() => setPage(Math.min(page + 1, totalPages))} className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-[12px] font-medium text-white/35 transition hover:text-white">
                {t("competition.nextPage")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

