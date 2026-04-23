"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { VideoCard } from "@/components/video-card";
import { FEED_GENRE_KEYS, FEED_GENRE_LABELS, formatGenreDisplay, normalizeMainGenreKey } from "@/lib/constants/genres";
import type { Video } from "@/lib/types";

type SortMode = "latest" | "popular" | "finalist";

type Props = {
  videos: Video[];
  /** home: genre only / feed|watch: includes sort (watch is legacy alias for feed) */
  variant?: "home" | "watch" | "feed";
};

const feedLike = (v: Props["variant"]) => v === "watch" || v === "feed";

export function GenreFilteredVideoFeed({ videos, variant = "feed" }: Props) {
  const [mainGenre, setMainGenre] = useState<string>("");
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);

  const filteredSorted = useMemo(() => {
    let list = videos;
    if (mainGenre) {
      list = list.filter((v) => normalizeMainGenreKey(v.genre) === mainGenre);
    }
    if (sortMode === "finalist") {
      list = list.filter((v) => v.isFinalist);
    }

    const sorted = [...list];
    if (sortMode === "latest" || sortMode === "finalist") {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      sorted.sort((a, b) => {
        const vc = (b.viewCount ?? 0) - (a.viewCount ?? 0);
        if (vc !== 0) return vc;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
    return sorted;
  }, [videos, mainGenre, sortMode]);

  const genreChips = [{ key: "", label: "All" }, ...FEED_GENRE_KEYS.map((k) => ({ key: k, label: FEED_GENRE_LABELS[k] }))];

  const sortOptions: { key: SortMode; label: string }[] = [
    { key: "latest", label: "Latest" },
    { key: "popular", label: "Popular" },
    { key: "finalist", label: "Award Winners" },
  ];

  useEffect(() => {
    if (!sortOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!sortRef.current || (target && sortRef.current.contains(target))) return;
      setSortOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [sortOpen]);

  const currentSortLabel = sortOptions.find((s) => s.key === sortMode)?.label ?? "Latest";

  return (
    <>
      <section className="space-y-4 pt-2">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-[#7F77DD]">GENRE</p>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2.5">
              {genreChips.map((c) => (
                <button
                  key={c.key || "all"}
                  type="button"
                  onClick={() => setMainGenre(c.key)}
                  className={`border-b-2 px-[14px] py-[6px] text-sm transition-all ${
                    mainGenre === c.key
                      ? "border-[#7F77DD] text-[#EEEDFE]"
                      : "border-transparent text-[rgba(238,237,254,0.4)] hover:text-[rgba(238,237,254,0.7)]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {feedLike(variant) && (
              <div ref={sortRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setSortOpen((v) => !v)}
                  className="relative rounded-[6px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-[10px] py-[5px] pr-[28px] text-[12px] text-[#EEEDFE] transition hover:border-[rgba(127,119,221,0.45)]"
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                >
                  {currentSortLabel}
                  <span className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-[11px] text-[#AFA9EC]">▾</span>
                </button>
                {sortOpen ? (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[164px] rounded-[8px] border border-[rgba(127,119,221,0.2)] bg-[#1A1535] p-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
                    {sortOptions.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => {
                          setSortMode(s.key);
                          setSortOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[12px] transition ${
                          sortMode === s.key
                            ? "bg-[rgba(83,74,183,0.3)] text-[#EEEDFE]"
                            : "text-[#C7C2F4] hover:bg-[rgba(83,74,183,0.2)] hover:text-[#EEEDFE]"
                        }`}
                      >
                        <span>{s.label}</span>
                        <span className={`${sortMode === s.key ? "opacity-100" : "opacity-0"} text-[12px]`}>✓</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
          {feedLike(variant) ? (
            <div className="mt-3 border-t border-white/10 pt-0.5">
              <span className="sr-only">Sort options are in the right dropdown.</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className={`mt-2 border-t border-white/8 pt-8 grid gap-x-5 gap-y-7 md:grid-cols-2 ${variant === "home" ? "lg:grid-cols-4" : "lg:grid-cols-3 xl:grid-cols-4"}`}>
        {filteredSorted.length === 0 ? (
          <p className="col-span-full text-[#AFA9EC]">No films yet.</p>
        ) : (
          filteredSorted.map((video) => (
            <div key={video.id} className={feedLike(variant) ? "space-y-3" : ""}>
              {feedLike(variant) ? (
                <article className="space-y-2">
                  <Link
                    href={`/watch/${video.id}`}
                    className="group relative block aspect-video overflow-hidden rounded-xl border border-white/12 bg-[#0F0D1E] shadow-[0_6px_26px_rgba(4,3,11,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7F77DD]/45"
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="h-full w-full object-cover transition duration-300 ease-out group-hover:scale-[1.035] group-hover:brightness-72"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white">
                        <svg className="h-4 w-4 translate-x-[1px]" viewBox="0 0 12 12" fill="none" aria-hidden>
                          <polygon points="2,1 11,6 2,11" fill="currentColor" />
                        </svg>
                      </span>
                    </div>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="line-clamp-1 text-sm font-semibold text-[#EEEDFE]">{video.title}</p>
                      <p className="mt-0.5 text-[11px] text-[#C9C4F4]">{formatGenreDisplay(video.genre, video.subGenre)}</p>
                    </div>
                  </Link>
                  <p className="line-clamp-1 text-sm font-semibold tracking-tight text-[#EEEDFE]">{video.title}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-[#AFA9EC]">
                    <span className="rounded-full border border-white/20 bg-black/25 px-2 py-1">{formatGenreDisplay(video.genre, video.subGenre)}</span>
                  </div>
                </article>
              ) : (
                <VideoCard video={video} />
              )}
            </div>
          ))
        )}
      </section>
    </>
  );
}
