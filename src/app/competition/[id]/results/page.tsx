import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerLocale, getServerT } from "@/lib/i18n/server";
import { fetchVideoById } from "@/lib/queries";
import {
  fetchCompetitionEntryCounts,
  fetchCompetitionWinners,
  fetchLatestDrawingLog,
  type LotteryWinner,
} from "@/lib/queries/lottery-queries";
import { fetchPublicProfileById, type Profile } from "@/lib/queries/profile-queries";
import { profileHandle } from "@/lib/profile-handle";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { intlDateLocale } from "@/lib/i18n/browser-locale";

export const dynamic = "force-dynamic";

async function fetchCompetitionRow(id: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();
  return (data as Record<string, unknown> | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [competition, locale] = await Promise.all([
    fetchCompetitionRow(id),
    getServerLocale(),
  ]);
  if (!competition) return { title: "Competition results not found" };

  const t = getServerT(locale);
  const titleKey = locale === "ko" ? "title_ko" : locale === "ja" ? "title_ja" : "title_en";
  const base = (competition[titleKey] as string | null) ?? (competition.title as string);
  const heading = t("lottery.results.title", "Winners");
  return {
    title: `${heading} | ${base ?? "Competition"} | Genova`,
    robots: { index: true, follow: true },
  };
}

// ============================================================
// Winner card — server component, one per prize tier (5 total).
// Pulls the winner's display profile + the winning video in
// parallel.  Falls back gracefully if either is missing (video
// deleted, account deactivated, public_profiles row missing).
// ============================================================

async function WinnerCard({
  winner,
  prizeAmount,
  locale,
  t,
}: {
  winner: LotteryWinner;
  prizeAmount: number;
  locale: "en" | "ko" | "ja";
  t: (key: string, fallback?: string) => string;
}) {
  const [profile, video] = await Promise.all([
    fetchPublicProfileById(winner.userId),
    winner.videoId ? fetchVideoById(winner.videoId) : Promise.resolve(null),
  ]);

  const claimStatusKey = `lottery.results.claimStatus.${winner.claimStatus}`;
  const claimStatusCopy = t(claimStatusKey, winner.claimStatus);

  return (
    <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] transition hover:border-[#7F77DD]/40">
      {/* Tier header */}
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#7F77DD]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#AFA9EC]">
            {t("lottery.results.tier", "Tier {n}").replace("{n}", String(winner.prizeTier))}
          </span>
          <span className="text-[12px] font-bold tabular-nums text-amber-300">
            {t("lottery.results.prize", "${amount} USD").replace("{amount}", String(prizeAmount))}
          </span>
        </div>
        <ClaimStatusBadge status={winner.claimStatus} copy={claimStatusCopy} />
      </header>

      {/* Video thumbnail (or fallback) */}
      <div className="relative aspect-video bg-black">
        {video?.thumbnailUrl ? (
          <Link href={`/watch/${video.id}`} className="block h-full w-full">
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 hover:scale-[1.02]"
            />
          </Link>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[12px] text-white/35">
            {t("lottery.results.videoMissing", "Video no longer available")}
          </div>
        )}
      </div>

      {/* Creator row */}
      <footer className="flex items-center gap-3 px-4 py-3">
        <CreatorChip profile={profile} userId={winner.userId} />
        {video ? (
          <Link
            href={`/watch/${video.id}`}
            className="ml-auto rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[11px] font-semibold text-white/70 transition hover:border-white/[0.18] hover:text-white"
          >
            {video.title.length > 30 ? `${video.title.slice(0, 30)}…` : video.title}
          </Link>
        ) : null}
      </footer>
    </article>
  );
}

function CreatorChip({
  profile,
  userId,
}: {
  profile: Profile | null;
  userId: string;
}) {
  const displayName = profile?.displayName?.trim() || `user_${userId.slice(0, 8)}`;
  const handle = profileHandle(displayName, userId);
  const avatarUrl = profile?.avatarUrl?.trim() || "/default-avatar.png";

  return (
    <Link href={`/profile/${userId}`} className="flex min-w-0 items-center gap-2">
      <Image
        src={avatarUrl}
        alt={displayName}
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-full border border-white/[0.06] object-cover"
      />
      <div className="min-w-0">
        <div className="truncate text-[13px] font-bold text-white">{displayName}</div>
        <div className="truncate text-[11px] text-white/45">@{handle}</div>
      </div>
    </Link>
  );
}

function ClaimStatusBadge({ status, copy }: { status: string; copy: string }) {
  const tone =
    status === "paid"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : status === "confirmed"
      ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
      : status === "submitted"
      ? "border-[#7F77DD]/30 bg-[#7F77DD]/10 text-[#AFA9EC]"
      : status === "expired"
      ? "border-red-400/30 bg-red-400/10 text-red-300"
      : "border-white/[0.08] bg-white/[0.02] text-white/55";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${tone}`}
    >
      {copy}
    </span>
  );
}

// ============================================================
// Page
// ============================================================

export default async function CompetitionResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getServerLocale();
  const t = getServerT(locale);

  const [competition, winners, drawingLog, entryCounts] = await Promise.all([
    fetchCompetitionRow(id),
    fetchCompetitionWinners(id),
    fetchLatestDrawingLog(id),
    fetchCompetitionEntryCounts(id),
  ]);

  if (!competition) notFound();

  const heading = t("lottery.results.heading", "Lottery winners");
  const titleKey =
    locale === "ko" ? "title_ko" : locale === "ja" ? "title_ja" : "title_en";
  const compTitle =
    (competition[titleKey] as string | null) ?? (competition.title as string) ?? "Competition";

  const dateFmt = new Intl.DateTimeFormat(intlDateLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const drawnAtCopy = drawingLog
    ? t("lottery.results.drawnAt", "Drawn on {date}").replace(
        "{date}",
        dateFmt.format(new Date(drawingLog.drawnAt)),
      )
    : null;

  const totalEntriesCopy = drawingLog
    ? t("lottery.results.totalEntries", "{n} entries across {users} creators")
        .replace("{n}", String(drawingLog.eligibleEntryCount))
        .replace("{users}", String(drawingLog.eligibleUserCount))
    : entryCounts.eligibleCount > 0
    ? t("lottery.entryCount", "Total entries: {n}").replace(
        "{n}",
        String(entryCounts.eligibleCount),
      )
    : null;

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-10 text-white sm:px-8">
      <header className="mb-8">
        <Link
          href={`/competition/${id}`}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/45 transition hover:text-white"
        >
          ← {compTitle}
        </Link>
        <h1 className="mt-2 text-[28px] font-black tracking-tight md:text-[34px]">
          {heading}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-white/55">
          {drawnAtCopy ? <span>{drawnAtCopy}</span> : null}
          {totalEntriesCopy ? <span>{totalEntriesCopy}</span> : null}
        </p>
      </header>

      {winners.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-12 text-center text-[14px] text-white/45">
          {t("lottery.results.empty", "No draw has been held for this competition yet.")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {winners.map((w) => (
            <WinnerCard
              key={w.id}
              winner={w}
              prizeAmount={w.prizeAmountUsd}
              locale={locale}
              t={t}
            />
          ))}
        </div>
      )}
    </main>
  );
}
