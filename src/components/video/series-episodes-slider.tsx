"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { intlDateLocale } from "@/lib/i18n/browser-locale";
import { formatViewCountShort } from "@/lib/view-count";
import { cn } from "@/lib/utils/cn";
import type { Video } from "@/lib/types";

export type Season = { season: number; episodes: Video[] };

const CARD_WIDTH = 180;
const VISIBLE = 5;
const STEP = 2;

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
  const episodeBadge = (n: number) => t("series.episodeShort").replace("{n}", String(n));
  const [offset, setOffset] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [activeSeason, setActiveSeason] = useState(1);
  const maxOffset = Math.max(0, episodes.length - VISIBLE);
  const canNext = offset < maxOffset;
  const modalEpisodes =
    seasons.length > 0 ? (seasons.find((s) => s.season === activeSeason)?.episodes ?? episodes) : episodes;

  useEffect(() => {
    if (!showAll) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [showAll]);

  return (
    <section className="mt-4 rounded-xl border border-white/10 bg-[#0F0D1E] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
            {t("series.sectionLabel")}
          </p>
          <p className="text-sm font-semibold text-white">{seriesTitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="flex items-center gap-1 text-xs text-white/40 transition hover:text-purple-400"
        >
          {t("series.viewAllEpisodes")}
        </button>
      </div>

      <div className="relative">
        {/* Cards container */}
        <div className="overflow-hidden">
          <div
            className="flex gap-3 transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${offset * (CARD_WIDTH + 12)}px)` }}
          >
            {episodes.map((ep) => (
              <Link
                key={ep.id}
                href={`/watch/${ep.id}`}
                className={`group relative flex-shrink-0 overflow-hidden rounded-xl border transition duration-200 ${
                  ep.id === currentVideoId
                    ? "border-[#7F77DD] ring-1 ring-[#7F77DD]/35"
                    : "border-white/10 hover:border-[#7F77DD]/60"
                }`}
                style={{ width: `${CARD_WIDTH}px` }}
              >
                <div className="relative overflow-hidden bg-black/40" style={{ aspectRatio: "16/9" }}>
                  <img
                    src={ep.thumbnailUrl || `https://picsum.photos/seed/${ep.id}/400/225`}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-bold text-purple-400 backdrop-blur-sm">
                    {episodeBadge(ep.episodeNumber ?? 0)}
                  </div>
                  <div className="absolute bottom-2 left-2 scale-75 opacity-0 transition-all duration-200 group-hover:scale-90 group-hover:opacity-100">
                    <div className="relative flex h-8 w-8 items-center justify-center">
                      <img src="/genova-play.png" alt="" className="h-full w-full" aria-hidden />
                      <svg className="absolute h-3 w-3" viewBox="0 0 24 24" fill="white" aria-hidden>
                        <polygon points="6,3 20,12 6,21" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-[#0A0A18]/90 p-2">
                  <p className="line-clamp-1 text-xs font-semibold leading-snug text-white">{ep.title}</p>
                  <p className="mt-0.5 text-[11px] text-white/40">
                    {formatViewCountShort(ep.viewCount ?? 0)} {t("feed.views")} · {ep.runtime ?? ""}
                  </p>
                  {ep.description ? (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/40">
                      {ep.description}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Arrow OUTSIDE overflow-hidden */}
        {canNext ? (
          <button
            type="button"
            onClick={() => setOffset((o) => Math.min(maxOffset, o + STEP))}
            className="absolute -right-3 top-[40%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#1A1535] text-white/70 shadow-lg transition hover:bg-white/10 hover:text-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : null}

        {offset > 0 ? (
          <button
            type="button"
            onClick={() => setOffset((o) => Math.max(0, o - STEP))}
            className="absolute -left-3 top-[40%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#1A1535] text-white/70 shadow-lg transition hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {showAll ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowAll(false)}>
          <div
            className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0F0D1E] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="shrink-0 border-b border-white/10 px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                    {t("series.sectionLabel")}
                  </p>
                  <h2 className="mt-0.5 text-xl font-bold text-white">{seriesTitle}</h2>
                  <p className="mt-1 text-sm font-medium text-white/60">{t("series.genrePlaceholder")}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{t("series.modalBlurb")}</p>
                  <p className="mt-3 text-xs text-white/40">
                    {t("series.seasonEpisodesYear")
                      .replace("{season}", String(activeSeason))
                      .replace("{count}", String(modalEpisodes.length))
                      .replace(
                        "{year}",
                        String(new Date(modalEpisodes[0]?.createdAt ?? Date.now()).getFullYear()),
                      )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAll(false)}
                  className="ml-4 shrink-0 rounded-lg p-2 text-white/60 transition hover:bg-white/5 hover:text-white"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              {seasons.length > 1 ? (
                <div className="mt-3 flex gap-2">
                  {seasons.map((s) => (
                    <button
                      key={s.season}
                      type="button"
                      onClick={() => setActiveSeason(s.season)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition",
                        activeSeason === s.season
                          ? "border border-primary/40 bg-primary/20 text-primary"
                          : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      {t("series.seasonTab").replace("{n}", String(s.season))}
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">{s.episodes.length}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Episodes list - scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {modalEpisodes.map((ep) => (
                  <Link
                    key={ep.id}
                    href={`/watch/${ep.id}`}
                    onClick={() => setShowAll(false)}
                    className={`group flex gap-4 rounded-xl border p-4 transition ${
                      ep.id === currentVideoId
                        ? "border-[#7F77DD] bg-[#534AB7]/10"
                        : "border-white/8 bg-white/[0.02] hover:border-[#7F77DD]/40 hover:bg-white/5"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-lg bg-black/40">
                      <img
                        src={ep.thumbnailUrl || `https://picsum.photos/seed/${ep.id}/400/225`}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      {/* Runtime bottom right */}
                      <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                        {formatRuntime(ep.runtime)}
                      </div>
                      {/* Play button bottom left on hover */}
                      <div className="absolute bottom-2 left-2 scale-75 opacity-0 transition-all duration-200 group-hover:scale-90 group-hover:opacity-100">
                        <div className="relative flex h-8 w-8 items-center justify-center">
                          <img src="/genova-play.png" alt="" className="h-full w-full" aria-hidden />
                          <svg className="absolute h-3 w-3" viewBox="0 0 24 24" fill="white" aria-hidden>
                            <polygon points="6,3 20,12 6,21" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1 py-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-purple-400">EP.{ep.episodeNumber}</span>
                        {ep.id === currentVideoId ? (
                          <span className="rounded-full bg-[#534AB7]/40 px-2 py-0.5 text-[9px] font-semibold text-white/60">
                            Now Playing
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-white">{ep.title}</p>
                      <p className="mt-0.5 text-[10px] text-white/40">
                        {new Date(ep.createdAt).toLocaleDateString(dateLocale, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        {" · "}
                        {formatViewCountShort(ep.viewCount ?? 0)} {t("feed.views")}
                      </p>
                      {ep.description ? (
                        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/40">
                          {ep.description}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
