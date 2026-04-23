"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { TrophyRow } from "@/lib/queries/trophies-queries";
import {
  competitionAwardAccent,
  formatWeekRange,
  genreLabel,
  weeklyRankLabel,
  weeklyTrophyAccent,
} from "@/lib/trophies-display";

const COMPETITION_AWARD_ORDER = ["대상", "금상", "은상", "입선", "장려상"] as const;

function TrophyCup({ fill, grand }: { fill: string; grand?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 72"
      className={`h-12 w-12 ${grand ? "drop-shadow-[0_0_14px_rgba(127,119,221,0.65)]" : "drop-shadow-md"}`}
      aria-hidden
    >
      <path
        fill={fill}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.2"
        d="M14 12h36v10a20 20 0 01-20 20 20 20 0 01-20-20V12zm6 40h24v8H20v-8zm-8 12h40l4 10H16l4-10z"
      />
      <ellipse cx="32" cy="14" rx="18" ry="4" fill="rgba(255,255,255,0.12)" />
    </svg>
  );
}

function trophyVisual(t: TrophyRow) {
  if (t.type === "weekly_genre" && t.rank != null) {
    const accent = weeklyTrophyAccent(t.rank);
    return <TrophyCup fill={accent} />;
  }
  if (t.type === "competition" && t.award) {
    if (t.award === "대상") {
      return <TrophyCup fill="#9B8CFF" grand />;
    }
    const accent = competitionAwardAccent(t.award);
    return <TrophyCup fill={accent} />;
  }
  return <TrophyCup fill="#AFA9EC" />;
}

function tooltipLines(t: TrophyRow): string[] {
  if (t.type === "weekly_genre" && t.rank != null && t.genre && t.weekStart) {
    return [
      `${genreLabel(t.genre)} · ${weeklyRankLabel(t.rank)}`,
      `Week: ${formatWeekRange(t.weekStart)}`,
      "Top uploads in this genre for the week, ranked by views.",
    ];
  }
  if (t.type === "competition" && t.award) {
    const title = t.competitionTitle ?? t.competitionId ?? "Competition";
    return [`${title}`, `Award: ${t.award}`, "Competition trophy"];
  }
  return ["Trophy"];
}

function primaryLabel(t: TrophyRow): string {
  if (t.type === "weekly_genre" && t.genre && t.rank != null) {
    return `${genreLabel(t.genre)} · ${weeklyRankLabel(t.rank)}`;
  }
  if (t.type === "competition" && t.award) {
    return `${t.competitionTitle ?? "Competition"} · ${t.award}`;
  }
  return "Trophy";
}

function TrophyCard({ t }: { t: TrophyRow }) {
  const lines = tooltipLines(t);
  const primary = primaryLabel(t);

  return (
    <li className="group relative">
      <div className="flex w-[140px] flex-col items-center gap-2 rounded-xl border border-white/10 bg-[#1A1535]/80 px-3 py-4 transition duration-300 group-hover:scale-105 group-hover:border-[#7F77DD]/40">
        {trophyVisual(t)}
        <p className="line-clamp-2 text-center text-[11px] font-semibold leading-snug text-[#F8F7FF]">{primary}</p>
      </div>
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-56 -translate-x-1/2 rounded-lg border border-white/15 bg-[#0f0d24]/95 px-3 py-2 text-[11px] leading-snug text-[#E8E4FF] opacity-0 shadow-xl ring-1 ring-[#534AB7]/30 transition duration-200 group-hover:opacity-100"
      >
        {lines.map((line, i) => (
          <p key={`${t.id}-${i}`} className={i === 0 ? "font-semibold text-[#F8F7FF]" : "text-[#AFA9EC]"}>
            {line}
          </p>
        ))}
        <p className="mt-1 text-[10px] text-[#7F77DD]/90">
          {new Date(t.createdAt).toLocaleString("en-US", { dateStyle: "medium" })}
        </p>
      </div>
    </li>
  );
}

function sortCompetitionTrophies(list: TrophyRow[]): TrophyRow[] {
  return [...list].sort((a, b) => {
    const ai = COMPETITION_AWARD_ORDER.indexOf(a.award as (typeof COMPETITION_AWARD_ORDER)[number]);
    const bi = COMPETITION_AWARD_ORDER.indexOf(b.award as (typeof COMPETITION_AWARD_ORDER)[number]);
    const as = ai === -1 ? 99 : ai;
    const bs = bi === -1 ? 99 : bi;
    if (as !== bs) return as - bs;
    return (a.competitionTitle ?? "").localeCompare(b.competitionTitle ?? "");
  });
}

function sortWeeklyTrophies(list: TrophyRow[]): TrophyRow[] {
  return [...list].sort((a, b) => {
    const wa = a.weekStart ?? "";
    const wb = b.weekStart ?? "";
    if (wa !== wb) return wb.localeCompare(wa);
    return (a.rank ?? 0) - (b.rank ?? 0);
  });
}

export function ProfileTrophiesSection({ trophies }: { trophies: TrophyRow[] }) {
  const { competition, weekly } = useMemo(() => {
    const competitionRaw = trophies.filter((t) => t.type === "competition");
    const weeklyRaw = trophies.filter((t) => t.type === "weekly_genre");
    return {
      competition: sortCompetitionTrophies(competitionRaw),
      weekly: sortWeeklyTrophies(weeklyRaw),
    };
  }, [trophies]);

  return (
    <div className="space-y-8" aria-labelledby="trophies-heading">
      <h3 id="trophies-heading" className="text-lg font-bold text-[#F8F7FF]">
        Trophies
      </h3>
      <p className="-mt-4 text-sm text-[#AFA9EC]">Platform trophies (competition results & weekly genre ranks)</p>

      <div className="space-y-3">
        <div className="flex flex-col gap-1 border-b border-white/10 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7F77DD]">Competition</p>
          <p className="text-sm text-[#AFA9EC]">Awards from official competitions</p>
        </div>
        {competition.length > 0 ? (
          <ul className="flex flex-wrap gap-4">
            {competition.map((t) => (
              <TrophyCard key={t.id} t={t} />
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-white/15 bg-[#1A1535]/50 px-6 py-8 text-center">
            <p className="text-sm text-[#F8F7FF]">No competition trophies yet.</p>
            <p className="mt-2 text-sm text-[#AFA9EC]">
              Enter a competition to win your first trophy — results appear here when awarded.
            </p>
            <Link
              href="/competition"
              className="mt-4 inline-flex rounded-[6px] border border-white/20 bg-transparent px-4 py-2 text-sm font-semibold text-[#EEEDFE] transition hover:border-[#7F77DD]/50"
            >
              Browse competitions
            </Link>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-1 border-b border-white/10 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7F77DD]">Weekly genre</p>
          <p className="text-sm text-[#AFA9EC]">Weekly top creators by genre (gold, silver, bronze)</p>
        </div>
        {weekly.length > 0 ? (
          <ul className="flex flex-wrap gap-4">
            {weekly.map((t) => (
              <TrophyCard key={t.id} t={t} />
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-white/15 bg-[#1A1535]/50 px-6 py-8 text-center">
            <p className="text-sm text-[#F8F7FF]">No weekly genre trophies yet.</p>
            <p className="mt-2 text-sm text-[#AFA9EC]">Publish public films and climb the weekly leaderboard by genre.</p>
            <Link
              href="/upload"
              className="mt-4 inline-flex rounded-[6px] bg-[#534AB7] px-4 py-2 text-sm font-semibold text-[#EEEDFE] transition hover:bg-[#655cd0]"
            >
              Upload a film
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
