"use client";

import Link from "next/link";
import { ArrowRight, PlayCircle, Calendar, Users } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { LotteryWinnersButton } from "@/components/lottery/lottery-winners-button";

type HeroCompetition = {
  title?: string | null;
  titleKo?: string | null;
  titleEn?: string | null;
  titleJa?: string | null;
} | null;

type Props = {
  // 관리자 '홈 배너 공모전'에서 선택된 공모전. 로케일별 번역 제목을
  // 히어로 eyebrow에 노출(없으면 i18n 기본 eyebrow로 폴백).
  competition: HeroCompetition;
  stats: {
    activeCount: number;
    totalPrizeUSD: number;
    participantCount: number;
  };
};

/**
 * Client component.  Was a server component (B.2-8a) for bundle size,
 * but a server-rendered hero only re-localizes after `router.refresh()`
 * (a network round-trip), so on language switch its title/subtitle/
 * stats visibly lagged ~0.5–1s behind every client `useI18n()` string.
 * Reading the locale from `useI18n()` makes the above-the-fold hero
 * flip instantly and in sync with the rest of the UI.  `competition`
 * and `stats` are still resolved on the server and passed as props.
 */
export function HomeCompetitionBanner({ competition, stats }: Props) {
  const { t, locale } = useI18n();

  const localizedCompTitle = competition
    ? (locale === "ko"
        ? competition.titleKo
        : locale === "ja"
          ? competition.titleJa
          : competition.titleEn) ||
      competition.title ||
      null
    : null;

  return (
    <section className="relative w-full overflow-hidden border-b border-white/[0.06] bg-[#0a0a0a]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url('/hero-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "70% 30%",
          opacity: 0.5,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(90deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.6) 30%, rgba(10,10,10,0.25) 50%, rgba(10,10,10,0.1) 70%, transparent 90%)",
        }}
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(10,10,10,0.85) 100%)",
        }}
      />

      <div className="pointer-events-auto absolute right-4 top-12 z-20 hidden lg:block xl:right-12 xl:top-14">
        <div className="flex w-[240px] flex-col gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 backdrop-blur-md">
          <InfoRow
            icon={PlayCircle}
            title={t("competition.aiOnly", "AI-Generated Only")}
            subtitle={t("competition.aiOnlySub", "AI-generated videos only")}
          />
          <div className="h-px w-full bg-white/[0.05]" />
          <InfoRow
            icon={Calendar}
            title={t("competition.noSubmitLimit", "Unlimited Submissions")}
            subtitle={t("competition.noSubmitLimitSub", "No submission limit")}
          />
          <div className="h-px w-full bg-white/[0.05]" />
          <InfoRow
            icon={Users}
            title={t("competition.openWorldwide", "Open Worldwide")}
            subtitle={t("competition.openWorldwideSub", "Anyone worldwide can join")}
          />
        </div>
      </div>

      <div className="relative z-10 w-full px-6 py-12 sm:px-8 lg:px-10 lg:py-14">
        <div className="flex flex-col gap-6 lg:max-w-[calc(100%-300px)] xl:max-w-[calc(100%-320px)]">

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/90 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {localizedCompTitle ?? t("home.hero.eyebrow", "AI FILM CONTEST · NOW LIVE")}
          </div>

          <div>
            <h1
              className="text-[32px] font-black leading-[1.05] tracking-[-0.03em] text-white whitespace-nowrap sm:text-[38px] md:text-[46px] lg:text-[52px] xl:text-[56px]"
              style={{ textShadow: "0 2px 16px rgba(0,0,0,0.6)" }}
            >
              {t("home.hero.titlePart1", "Showcasing the")}{" "}
              <span className="bg-gradient-to-r from-[#AFA9EC] via-[#7F77DD] to-[#534AB7] bg-clip-text text-transparent">
                {t("home.hero.titlePart2", "possibilities of AI")}
              </span>
            </h1>
            <p
              className="mt-4 max-w-[640px] text-[14px] leading-relaxed text-white/65 md:text-[15px] lg:text-[16px]"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
            >
              {t(
                "home.hero.subtitle",
                "A film competition platform where AI creators worldwide compete with their work",
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/competition"
              className="group inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-[13px] font-bold text-[#0a0a0a] transition hover:bg-white/90"
            >
              {t("home.hero.cta.primary", "Join the competition")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <LotteryWinnersButton />
          </div>

          <div className="grid max-w-[680px] grid-cols-3 gap-3 pt-4 sm:gap-3.5">
            <StatCard
              label={t("home.hero.stat.activeLabel", "NOW LIVE")}
              value={stats.activeCount.toLocaleString()}
              description={t("home.hero.stat.activeDesc", "competitions live")}
              accent="purple"
              icon="pulse"
            />
            <StatCard
              label={t("home.hero.stat.prizeLabel", "TOTAL PRIZE")}
              value={`$${stats.totalPrizeUSD.toLocaleString()}`}
              description={t("home.hero.stat.prizeDesc", "total prize")}
              accent="gold"
              icon="star"
            />
            <StatCard
              label={t("home.hero.stat.creatorsLabel", "JOINED")}
              value={stats.participantCount.toLocaleString()}
              description={t("home.hero.stat.creatorsDesc", "creators joined")}
              accent="emerald"
              icon="dot"
            />
          </div>

        </div>
      </div>
    </section>
  );
}

type StatAccent = "purple" | "gold" | "emerald";

const accentStyles: Record<StatAccent, {
  border: string;
  glow: string;
  labelColor: string;
  valueColor: string;
  iconColor: string;
  dotColor: string;
}> = {
  purple: {
    border: "border-[#7F77DD]/25",
    glow: "rgba(127,119,221,0.25)",
    labelColor: "text-[#AFA9EC]/80",
    valueColor: "text-white",
    iconColor: "text-[#AFA9EC]",
    dotColor: "bg-[#7F77DD]",
  },
  gold: {
    border: "border-amber-400/30",
    glow: "rgba(251,191,36,0.2)",
    labelColor: "text-amber-300/80",
    valueColor: "text-amber-300",
    iconColor: "text-amber-300",
    dotColor: "bg-amber-400",
  },
  emerald: {
    border: "border-emerald-400/25",
    glow: "rgba(52,211,153,0.2)",
    labelColor: "text-emerald-300/80",
    valueColor: "text-white",
    iconColor: "text-emerald-300",
    dotColor: "bg-emerald-400",
  },
};

function StatCard({
  label,
  value,
  description,
  accent,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  accent: StatAccent;
  icon: "pulse" | "star" | "dot";
}) {
  const styles = accentStyles[accent];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border ${styles.border} bg-[#0a0a0a]/70 px-4 py-3.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 sm:px-5 sm:py-4`}
      style={{
        boxShadow: `0 0 0 1px var(--border-white-02), 0 8px 32px ${styles.glow}`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-70"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${styles.glow} 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-1.5">
          {icon === "pulse" && (
            <span className={`h-1.5 w-1.5 rounded-full ${styles.dotColor} animate-pulse`} />
          )}
          {icon === "star" && (
            <span className={`text-[10px] ${styles.iconColor}`}>★</span>
          )}
          {icon === "dot" && (
            <span className={`h-1.5 w-1.5 rounded-full ${styles.dotColor}`} />
          )}
          <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${styles.labelColor}`}>
            {label}
          </span>
        </div>

        <div className={`mt-1.5 text-[25px] font-black leading-none tabular-nums tracking-tight ${styles.valueColor} sm:text-[28px]`}>
          {value}
        </div>

        <p className="mt-1 text-[11px] font-medium text-white/55">
          {description}
        </p>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#AFA9EC]/70" />
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-white/85">{title}</p>
        <p className="mt-0.5 text-[10px] text-white/45">{subtitle}</p>
      </div>
    </div>
  );
}
