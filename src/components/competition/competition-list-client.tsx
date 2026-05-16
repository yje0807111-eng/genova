"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, LayoutGrid, List } from "lucide-react";
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

function isVoting(c: Competition): boolean {
  return ["Voting", "투표중"].includes(c.status);
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
  const votingState = isVoting(c);
  const isOpen = !votingState && ["Open", "접수중", "In Review"].includes(c.status);
  const isUpcoming = ["Upcoming", "예정"].includes(c.status);
  const isClosed = !isOpen && !isUpcoming && !votingState;
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
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="rounded-full border border-white/25 bg-black/55 px-4 py-1.5 text-[12px] font-bold text-white backdrop-blur-md">
            {t("competition.viewDetails", "자세히 보기")}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 min-h-[2.6em] text-[15px] font-bold leading-snug text-white">
          {getLangText(locale, c.title_ko, c.title_en, c.title_ja, c.title)}
        </h3>
        {c.sponsor ? (
          <p className="mt-1 truncate text-[11px] text-white/40">
            {t("competition.sponsoredBy", "주최")} <span className="text-white/65">{c.sponsor}</span>
          </p>
        ) : null}
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">
              {t("competition.colPrize")}
            </p>
            <p className="truncate text-[16px] font-black text-[#F5D182]">{prize}</p>
          </div>
          {participantCount > 0 ? (
            <span className="shrink-0 pb-0.5 text-[11px] tabular-nums text-white/45">
              {participantCount.toLocaleString()}
              <span className="ml-0.5 text-white/30">{t("competition.peopleUnit")}</span>
            </span>
          ) : null}
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 border-t border-white/[0.06] pt-2 text-[11px] text-white/40">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              votingState
                ? "animate-pulse bg-[#7F77DD]"
                : isOpen
                  ? "animate-pulse bg-emerald-400"
                  : isUpcoming
                    ? "bg-sky-400"
                    : "bg-white/25"
            }`}
          />
          <span
            className={
              votingState
                ? "font-semibold text-[#AFA9EC]"
                : isOpen
                  ? "font-semibold text-emerald-300"
                  : isUpcoming
                    ? "font-semibold text-sky-300"
                    : "text-white/35"
            }
          >
            {votingState
              ? t("competition.statusVoting", "투표중")
              : isOpen
                ? t("competition.statusOpenShort")
                : isUpcoming
                  ? t("competition.statusUpcoming")
                  : t("competition.statusClosed")}
          </span>
          <span className="text-white/30">{deadlineLabel}</span>
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
  const votingState = isVoting(c);
  const isOpen = !votingState && ["Open", "접수중", "In Review"].includes(c.status);
  const isUpcoming = ["Upcoming", "예정"].includes(c.status);
  const isClosed = !isOpen && !isUpcoming && !votingState;
  const deadlineLabel = new Date(c.deadline).toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  void idx;
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
  const urgent = isOpen && d >= 0 && d <= 3;
  // "₩150,000 (약 ₩1,368,243)" → 원금 / 환산 두 줄로 분리.
  const prizeMatch = prize.match(/^(.*?)\s*\((.*)\)\s*$/);
  const prizeMain = prizeMatch ? prizeMatch[1] : prize;
  const prizeSub = prizeMatch ? prizeMatch[2] : null;

  return (
    <Link
      href={`/competition/${c.id}`}
      className="group relative flex items-center gap-4 px-4 py-2.5 transition-colors duration-150 hover:bg-white/[0.03]"
      style={{ opacity: isClosed ? 0.55 : 1 }}
    >
      <div className="relative h-[58px] w-[104px] shrink-0 overflow-hidden rounded-md">
        {thumb ? (
          <Image
            src={thumb}
            alt=""
            fill
            sizes="104px"
            className={`object-cover transition duration-300 group-hover:scale-105 ${isClosed ? "grayscale" : ""}`}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(127,119,221,0.20) 0%, #0a0a0a 70%)" }}
          >
            <Image src="/genova-logo.png" alt="Genova" width={48} height={48} className="h-9 w-9 object-contain opacity-[0.15]" />
          </div>
        )}
        {!isClosed && (
          <span
            className={`absolute right-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-black tabular-nums backdrop-blur-md ${
              urgent ? "bg-red-500/35 text-red-100" : "bg-black/60 text-white"
            }`}
          >
            D-{d}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[14px] font-bold text-white">
            {getLangText(locale, c.title_ko, c.title_en, c.title_ja, c.title)}
          </h3>
          <span
            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
              votingState
                ? "bg-[#7F77DD]/20 text-[#AFA9EC]"
                : isOpen
                  ? "bg-emerald-500/20 text-emerald-300"
                  : isUpcoming
                    ? "bg-sky-500/20 text-sky-300"
                    : "bg-white/[0.08] text-white/40"
            }`}
          >
            <span
              className={`h-1 w-1 rounded-full ${
                votingState
                  ? "animate-pulse bg-[#7F77DD]"
                  : isOpen
                    ? "animate-pulse bg-emerald-400"
                    : isUpcoming
                      ? "bg-sky-400"
                      : "bg-white/30"
              }`}
            />
            {votingState
              ? t("competition.statusVoting", "투표중")
              : isOpen
                ? t("competition.statusOpenShort")
                : isUpcoming
                  ? t("competition.statusUpcoming")
                  : t("competition.statusClosed")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-white/35">
          {c.genre && c.genre !== "전체" && (
            <span className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-white/55">
              {genreUiLabel(c.genre, locale)}
            </span>
          )}
          {c.sponsor && (
            <span className="rounded border border-[rgba(127,119,221,0.25)] bg-[rgba(127,119,221,0.10)] px-1.5 py-0.5 text-[#AFA9EC]/85">
              {c.sponsor}
            </span>
          )}
          <span className="truncate">{deadlineLabel}</span>
          {/* sm 미만에서 상금 인라인 노출(우측 컬럼 숨김 보완) */}
          <span className="shrink-0 font-bold text-[#F5D182] sm:hidden">· {prizeMain}</span>
        </div>
      </div>

      <div className="hidden w-36 shrink-0 text-right sm:block">
        <p className="truncate text-[13px] font-black text-[#F5D182]">{prizeMain}</p>
        {prizeSub && <p className="truncate text-[10px] text-white/40">{prizeSub}</p>}
      </div>
      <div className="hidden w-24 shrink-0 text-center md:block">
        <p className="text-[12px] font-medium text-white/65">{deadlineLabel}</p>
        <p className="text-[10px] text-white/40">D-{d}</p>
      </div>
      <div className="hidden w-16 shrink-0 text-center text-[12px] tabular-nums text-white/55 lg:block">
        {participantCount > 0 ? (
          <>
            {participantCount.toLocaleString()}
            <span className="ml-0.5 text-[10px] text-white/30">{t("competition.peopleUnit")}</span>
          </>
        ) : (
          <span className="text-white/20">—</span>
        )}
      </div>
      <ChevronRight size={16} className="w-6 shrink-0 text-white/25 transition-colors group-hover:text-[#AFA9EC]" />
    </Link>
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
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"all" | "open" | "voting" | "upcoming" | "closed">("all");
  const [sortMode, setSortMode] = useState<"deadline" | "prize" | "participants">("deadline");
  const [gridMode, setGridMode] = useState<"grid" | "list">("grid");
  const [sortOpen, setSortOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  void now;

  const allCompetitions = useMemo(() => [...active, ...upcoming, ...closed], [active, upcoming, closed]);
  const votingCount = useMemo(() => allCompetitions.filter(isVoting).length, [allCompetitions]);

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
      if (activeTab === "open" && (!active.some((a) => a.id === c.id) || isVoting(c))) return false;
      if (activeTab === "voting" && !isVoting(c)) return false;
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
            { key: "open", label: t("competition.nowOpen"), count: active.filter((a) => !isVoting(a)).length },
            { key: "voting", label: t("competition.statusVoting", "투표중"), count: votingCount },
            { key: "upcoming", label: t("competition.upcoming"), count: upcoming.length },
            { key: "closed", label: t("competition.past"), count: closed.length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setActiveTab(tab.key as "all" | "open" | "voting" | "upcoming" | "closed"); setPage(1); }}
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
            <button type="button" aria-label="Grid view" onClick={() => setGridMode("grid")} className={`flex h-8 w-8 items-center justify-center transition ${gridMode === "grid" ? "bg-white/10 text-white" : "text-white/35 hover:text-white/70"}`}>
              <LayoutGrid size={14} />
            </button>
            <button type="button" aria-label="List view" onClick={() => setGridMode("list")} className={`flex h-8 w-8 items-center justify-center transition ${gridMode === "list" ? "bg-white/10 text-white" : "text-white/35 hover:text-white/70"}`}>
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {gridMode === "list" ? (
        <div className="mt-0 overflow-hidden rounded-xl border border-white/[0.08]">
          <div className="flex items-center gap-4 border-b border-white/[0.08] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/30" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="w-[104px] shrink-0" />
            <div className="min-w-0 flex-1 text-left">{t("competition.colCompetition")}</div>
            <div className="hidden w-36 shrink-0 text-right sm:block">{t("competition.colPrize")}</div>
            <div className="hidden w-24 shrink-0 text-center md:block">{t("competition.colDeadline")}</div>
            <div className="hidden w-16 shrink-0 text-center lg:block">{t("competition.colParticipants")}</div>
            <div className="w-6 shrink-0" />
          </div>
          <div className="divide-y divide-white/[0.05]">
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
              {t("competition.brandCtaTitle", "Launch a contest with your brand")}
            </h2>
            <p className="mt-2 text-[13px] text-white/55">
              {t(
                "competition.brandCtaDesc",
                "Genova handles everything from planning to payout. Get connected within 24 hours.",
              )}
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
            {t("competition.brandCtaButton", "Fill out the form")}
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

