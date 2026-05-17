"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { intlDateLocale } from "@/lib/i18n/browser-locale";
import { formatViewCountShort } from "@/lib/view-count";
import { cn } from "@/lib/utils/cn";
import type { Video } from "@/lib/types";

export type Season = { season: number; episodes: Video[] };

function formatRuntime(runtime: string | null | undefined): string {
  if (!runtime) return "";
  if (/^\d+:\d{2}(:\d{2})?$/.test(runtime.trim())) return runtime.trim();
  const minMatch = runtime.match(/(\d+)\s*(min|분)/);
  if (minMatch) {
    const mins = parseInt(minMatch[1]);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:00`;
    return `${m}:00`;
  }
  return runtime;
}

/** Brand accent bar reused in header + modal for visual grouping. */
function AccentBar({ className }: { className?: string }) {
  return (
    <span
      className={cn("w-1 shrink-0 rounded-full", className)}
      style={{ background: "linear-gradient(180deg, #7F77DD 0%, #534AB7 100%)" }}
      aria-hidden
    />
  );
}

export function SeriesEpisodesSlider({
  episodes,
  currentVideoId,
  seriesTitle,
  seasons = [],
}: {
  episodes: Video[];
  currentVideoId: string;
  seriesTitle: string;
  seasons?: Season[];
}) {
  const { locale, t } = useI18n();
  const dateLocale = intlDateLocale(locale);
  const epLabel = (n: number | null | undefined) =>
    t("series.episodeShort", "EP.{n}").replace("{n}", String(n ?? 0));

  const [showAll, setShowAll] = useState(false);
  const [activeSeason, setActiveSeason] = useState(1);
  const railRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const modalEpisodes =
    seasons.length > 0
      ? (seasons.find((s) => s.season === activeSeason)?.episodes ?? episodes)
      : episodes;

  // Year range from real createdAt — no fabricated season/genre/blurb.
  const years = episodes
    .map((e) => new Date(e.createdAt).getFullYear())
    .filter((y) => Number.isFinite(y));
  const minYear = years.length ? Math.min(...years) : null;
  const maxYear = years.length ? Math.max(...years) : null;
  const yearLabel =
    minYear == null
      ? ""
      : minYear === maxYear
        ? String(minYear)
        : `${minYear}–${maxYear}`;
  const countLabel = t("series.totalEpisodes", "{n} episodes").replace(
    "{n}",
    String(episodes.length),
  );

  const syncArrows = () => {
    const el = railRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    syncArrows();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", syncArrows, { passive: true });
    window.addEventListener("resize", syncArrows);
    return () => {
      el.removeEventListener("scroll", syncArrows);
      window.removeEventListener("resize", syncArrows);
    };
  }, [episodes.length]);

  useEffect(() => {
    if (!showAll) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showAll]);

  const scrollByCards = (dir: 1 | -1) => {
    railRef.current?.scrollBy({ left: dir * 560, behavior: "smooth" });
  };

  return (
    <section
      className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.015] p-4 sm:p-5"
      style={{ boxShadow: "inset 0 1px 0 rgba(127,119,221,0.06)" }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <AccentBar className="h-8" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#AFA9EC]">
            {t("series.sectionLabel", "Series")}
          </p>
          <h3 className="mt-0.5 truncate text-[15px] font-bold text-white">
            {seriesTitle}
          </h3>
        </div>
        <span className="hidden shrink-0 rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white/45 sm:inline-block">
          {countLabel}
        </span>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="shrink-0 rounded-full border border-white/[0.1] bg-white/[0.03] px-3.5 py-1.5 text-[12px] font-semibold text-white/65 transition hover:border-[#7F77DD]/40 hover:text-white"
        >
          {t("series.viewAll", "View all")}
        </button>
      </div>

      {/* Episode rail */}
      <div className="group/rail relative">
        <div
          ref={railRef}
          className="hide-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-1"
        >
          {episodes.map((ep) => {
            const isCurrent = ep.id === currentVideoId;
            return (
              <Link
                key={ep.id}
                href={`/watch/${ep.id}`}
                aria-current={isCurrent ? "true" : undefined}
                className={cn(
                  "group/card relative w-[230px] shrink-0 overflow-hidden rounded-xl border transition-all duration-200",
                  isCurrent
                    ? "border-[#7F77DD] ring-1 ring-[#7F77DD]/40"
                    : "border-white/[0.08] hover:-translate-y-0.5 hover:border-[#7F77DD]/50",
                )}
              >
                <div className="relative aspect-video overflow-hidden bg-black/40">
                  <Image
                    src={
                      ep.thumbnailUrl ||
                      `https://picsum.photos/seed/${ep.id}/400/225`
                    }
                    alt=""
                    fill
                    sizes="230px"
                    className="object-cover transition duration-500 group-hover/card:scale-105"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.15) 45%, transparent 100%)",
                    }}
                  />
                  <span
                    className="absolute left-2 top-2 rounded-md bg-[#534AB7] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white ring-1 ring-white/20"
                    style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.55)" }}
                  >
                    {epLabel(ep.episodeNumber)}
                  </span>
                  {ep.runtime ? (
                    <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                      {formatRuntime(ep.runtime)}
                    </span>
                  ) : null}
                  {isCurrent ? (
                    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-[#7F77DD] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      <Play className="h-2.5 w-2.5 fill-white" />
                      {t("series.nowPlaying", "Now Playing")}
                    </span>
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 ring-1 ring-white/25 backdrop-blur-sm">
                        <Play className="h-4 w-4 fill-white text-white" />
                      </span>
                    </span>
                  )}
                </div>
                <div className="bg-[#0b0b14] px-3 py-2.5">
                  <p className="line-clamp-1 text-[12.5px] font-bold text-white">
                    {ep.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/35">
                    {formatViewCountShort(ep.viewCount ?? 0)}{" "}
                    {t("feed.views", "views")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {canLeft ? (
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollByCards(-1)}
            className="absolute -left-3 top-[42%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#15131f]/95 text-white/70 opacity-0 shadow-lg backdrop-blur transition hover:text-white group-hover/rail:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : null}
        {canRight ? (
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollByCards(1)}
            className="absolute -right-3 top-[42%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#15131f]/95 text-white/70 opacity-0 shadow-lg backdrop-blur transition hover:text-white group-hover/rail:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {/* Full-list modal */}
      {showAll ? (
        <div
          className="anim-scrim fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setShowAll(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="anim-modal flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0b14] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — only real data */}
            <div className="relative shrink-0 border-b border-white/[0.07] px-6 py-5">
              <div className="flex items-start gap-3 pr-10">
                <AccentBar className="mt-0.5 h-12" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#AFA9EC]">
                    {t("series.sectionLabel", "Series")}
                  </p>
                  <h2 className="mt-1 text-[22px] font-black tracking-tight text-white">
                    {seriesTitle}
                  </h2>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-white/45">
                    <span className="font-semibold tabular-nums text-white/65">
                      {countLabel}
                    </span>
                    {yearLabel ? (
                      <>
                        <span className="text-white/20">·</span>
                        <span className="tabular-nums">{yearLabel}</span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/55 transition hover:border-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              {seasons.length > 1 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {seasons.map((s) => (
                    <button
                      key={s.season}
                      type="button"
                      onClick={() => setActiveSeason(s.season)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition",
                        activeSeason === s.season
                          ? "border border-[#7F77DD]/40 bg-[#7F77DD]/[0.15] text-[#C7C2F0]"
                          : "border border-white/[0.1] bg-white/[0.03] text-white/55 hover:text-white",
                      )}
                    >
                      {t("series.seasonTab", "Season {n}").replace(
                        "{n}",
                        String(s.season),
                      )}
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] tabular-nums">
                        {s.episodes.length}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Episode list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="space-y-2">
                {modalEpisodes.map((ep) => {
                  const isCurrent = ep.id === currentVideoId;
                  return (
                    <Link
                      key={ep.id}
                      href={`/watch/${ep.id}`}
                      onClick={() => setShowAll(false)}
                      className={cn(
                        "group flex gap-4 rounded-xl border p-3 transition",
                        isCurrent
                          ? "border-[#7F77DD]/60 bg-[#534AB7]/[0.12]"
                          : "border-white/[0.06] bg-white/[0.015] hover:border-[#7F77DD]/35 hover:bg-white/[0.04]",
                      )}
                    >
                      <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-black/40">
                        <Image
                          src={
                            ep.thumbnailUrl ||
                            `https://picsum.photos/seed/${ep.id}/400/225`
                          }
                          alt=""
                          fill
                          sizes="160px"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                        {ep.runtime ? (
                          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {formatRuntime(ep.runtime)}
                          </span>
                        ) : null}
                        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 ring-1 ring-white/25 backdrop-blur-sm">
                            <Play className="h-4 w-4 fill-white text-white" />
                          </span>
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[12px] font-black tracking-wide text-[#AFA9EC]">
                            {epLabel(ep.episodeNumber)}
                          </span>
                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#7F77DD] px-2 py-0.5 text-[9px] font-bold text-white">
                              <Play className="h-2 w-2 fill-white" />
                              {t("series.nowPlaying", "Now Playing")}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 line-clamp-1 text-[14px] font-bold text-white">
                          {ep.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-white/40">
                          {new Date(ep.createdAt).toLocaleDateString(
                            dateLocale,
                            { year: "numeric", month: "short", day: "numeric" },
                          )}
                          {" · "}
                          {formatViewCountShort(ep.viewCount ?? 0)}{" "}
                          {t("feed.views", "views")}
                        </p>
                        {ep.description ? (
                          <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-snug text-white/40">
                            {ep.description}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
