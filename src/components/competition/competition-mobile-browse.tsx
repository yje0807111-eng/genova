"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/genova/language-provider";
import { formatPrizeWithConversion } from "@/lib/utils/format-prize";

// 모바일 전용 공모전 브라우즈 — 데스크톱의 440px 크로스페이드
// 캐러셀 + 밀집 툴바 대신: 피처 1카드 + 상태 칩 + 세로 리스트.
// md:hidden 분기(데스크톱은 기존 FeaturedHeroCarousel+List 유지).

type Comp = any;

function intlLocale(l: string) {
  return l === "ko" ? "ko-KR" : l === "ja" ? "ja-JP" : "en-US";
}
function dDay(deadline: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
}
function isVoting(c: Comp) {
  return ["Voting", "투표중"].includes(c.status);
}
function isOpenStatus(c: Comp) {
  return !isVoting(c) && ["Open", "접수중", "In Review"].includes(c.status);
}
function isUpcomingStatus(c: Comp) {
  return ["Upcoming", "예정"].includes(c.status);
}

type Filter = "all" | "open" | "voting" | "upcoming" | "closed";

export function CompetitionMobileBrowse({
  active,
  upcoming,
  closed,
  participantCounts,
}: {
  active: Comp[];
  upcoming: Comp[];
  closed: Comp[];
  participantCounts: Record<string, number>;
}) {
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");

  const getTitle = (c: Comp) =>
    (locale === "ko"
      ? c.title_ko
      : locale === "ja"
        ? c.title_ja
        : c.title_en) || c.title;

  const prizeOf = (c: Comp) =>
    formatPrizeWithConversion(
      c.prize_info_ko,
      c.prize_info_en,
      c.prize_info_ja,
      c.prize_info,
      locale,
      c.base_currency,
      c.exchange_rate_usd_krw ?? 1350,
      c.exchange_rate_usd_jpy ?? 148,
    );

  const all: Comp[] = [...active, ...upcoming, ...closed];
  const featured: Comp | undefined = active.find((c) => c.is_featured) ?? active[0];

  const list = all.filter((c) => {
    if (filter === "all") return true;
    if (filter === "open") return isOpenStatus(c);
    if (filter === "voting") return isVoting(c);
    if (filter === "upcoming") return isUpcomingStatus(c);
    return !isOpenStatus(c) && !isVoting(c) && !isUpcomingStatus(c);
  });

  const statusLabel = (c: Comp) =>
    isVoting(c)
      ? t("competition.statusVoting", "Voting")
      : isOpenStatus(c)
        ? t("competition.statusOpenShort", "Open")
        : isUpcomingStatus(c)
          ? t("competition.statusUpcoming", "Upcoming")
          : t("competition.statusClosed", "Closed");

  const statusDot = (c: Comp) =>
    isVoting(c)
      ? "bg-[#7F77DD]"
      : isOpenStatus(c)
        ? "bg-emerald-400"
        : isUpcomingStatus(c)
          ? "bg-sky-400"
          : "bg-white/30";

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: t("competition.filterAll", "All") },
    { key: "open", label: t("competition.statusOpenShort", "Open") },
    { key: "voting", label: t("competition.statusVoting", "Voting") },
    { key: "upcoming", label: t("competition.statusUpcoming", "Upcoming") },
    { key: "closed", label: t("competition.statusClosed", "Closed") },
  ];

  return (
    <div className="md:hidden px-4 pb-10 pt-4">
      {/* 피처 1카드 (캐러셀 X) */}
      {featured ? (
        <Link
          href={`/competition/${featured.id}`}
          className="relative mb-5 block overflow-hidden rounded-2xl border border-white/[0.08]"
        >
          <div className="relative aspect-[16/10] w-full">
            {featured.thumbnail_url ? (
              <Image
                src={featured.thumbnail_url}
                alt=""
                fill
                sizes="100vw"
                priority
                className="object-cover"
              />
            ) : (
              <div
                className="h-full w-full"
                style={{ background: "linear-gradient(135deg, rgba(83,74,183,0.25) 0%, #0a0a0a 70%)" }}
              />
            )}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, transparent 35%, rgba(10,10,10,0.55) 65%, #0a0a0a 100%)" }}
            />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/80 backdrop-blur-sm">
                <span className={"h-1.5 w-1.5 rounded-full " + statusDot(featured)} />
                {statusLabel(featured)}
              </span>
              <h2 className="line-clamp-2 text-[18px] font-black leading-tight text-white">
                {getTitle(featured)}
              </h2>
              <div className="mt-1.5 flex items-center gap-3 text-[12px]">
                <span className="font-bold tabular-nums text-[#F5D182]">{prizeOf(featured)}</span>
                {isOpenStatus(featured) ? (
                  <span className="font-bold text-[#AFA9EC]">D-{dDay(featured.deadline)}</span>
                ) : null}
              </div>
            </div>
          </div>
        </Link>
      ) : null}

      {/* 상태 필터 칩 — 가로 스크롤 */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((ch) => (
          <button
            key={ch.key}
            type="button"
            onClick={() => setFilter(ch.key)}
            className={
              "shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors " +
              (filter === ch.key
                ? "bg-white text-[#0a0a0a]"
                : "border border-white/[0.10] bg-white/[0.03] text-white/60")
            }
          >
            {ch.label}
          </button>
        ))}
      </div>

      {/* 세로 리스트 */}
      <div className="flex flex-col gap-3">
        {list.map((c) => (
          <Link
            key={c.id}
            href={`/competition/${c.id}`}
            className="flex gap-3 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e0e14] p-2.5"
          >
            <div className="relative h-[68px] w-[112px] shrink-0 overflow-hidden rounded-lg">
              {c.thumbnail_url ? (
                <Image src={c.thumbnail_url} alt="" fill sizes="112px" className="object-cover" />
              ) : (
                <div
                  className="h-full w-full"
                  style={{ background: "linear-gradient(135deg, rgba(83,74,183,0.20) 0%, #0a0a0a 70%)" }}
                />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <span className="mb-1 inline-flex w-fit items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">
                <span className={"h-1.5 w-1.5 rounded-full " + statusDot(c)} />
                {statusLabel(c)}
                {isOpenStatus(c) ? (
                  <span className="text-[#AFA9EC]">· D-{dDay(c.deadline)}</span>
                ) : null}
              </span>
              <h3 className="line-clamp-1 text-[14px] font-bold text-white">{getTitle(c)}</h3>
              <div className="mt-0.5 flex items-center gap-2 text-[12px]">
                <span className="truncate font-bold tabular-nums text-[#F5D182]">{prizeOf(c)}</span>
                {participantCounts[c.id] ? (
                  <span className="shrink-0 text-white/35">· {participantCounts[c.id]}</span>
                ) : null}
              </div>
            </div>
          </Link>
        ))}
        {list.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-white/35">
            {t("competition.emptyState", "No competitions")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
