"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FEED_GENRE_KEYS, FEED_GENRE_LABELS, mainGenreLabel, normalizeMainGenreKey } from "@/lib/constants/genres";
import { formatViewCountShort } from "@/lib/view-count";
import type { Video } from "@/lib/types";

type SortMode = "latest" | "popular" | "finalist";

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: "latest", label: "Latest" },
  { key: "popular", label: "Popular" },
  { key: "finalist", label: "Award Winners" },
];

const SIDEBAR_ITEMS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  ...FEED_GENRE_KEYS.map((k) => ({ key: k, label: FEED_GENRE_LABELS[k] })),
];

function displayCreator(v: Video): string {
  if (v.creatorName) return v.creatorName;
  if (v.uploaderDisplayName) return v.uploaderDisplayName;
  return "Creator";
}

function avatarForVideo(v: Video): string | null {
  if (v.creatorId && v.creatorAvatarUrl) return v.creatorAvatarUrl;
  return v.uploaderAvatarUrl ?? null;
}

function formatFeedUploadDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 365) return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function FeedCard({ video }: { video: Video }) {
  const name = displayCreator(video);
  const av = avatarForVideo(video);
  const views = formatViewCountShort(video.viewCount);
  const dateStr = formatFeedUploadDate(video.createdAt);
  const genreTag = mainGenreLabel(video.genre);

  return (
    <article className="group min-w-0">
      <Link href={`/watch/${video.id}`} className="block">
        <div className="ui-card ui-card-hover relative aspect-video w-full overflow-hidden rounded-[2px]">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover transition duration-200 group-hover:brightness-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#0F0D24] text-xs text-[rgba(255,255,255,0.5)]">
              No thumbnail
            </div>
          )}
        </div>
      </Link>

      <div className="mt-3 flex gap-3">
        <Link
          href={`/watch/${video.id}`}
          className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#26215C] ring-1 ring-white/10"
          aria-label={`${name} — open video`}
        >
          {av ? (
            <img src={av} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#AFA9EC]">{name.slice(0, 1)}</div>
          )}
        </Link>
        <div className="min-w-0 flex-1 space-y-1.5">
          <Link href={`/watch/${video.id}`}>
            <h3 className="line-clamp-2 text-[14px] font-medium leading-snug text-white transition group-hover:text-white">{video.title}</h3>
          </Link>
          <p className="line-clamp-1 text-[12px] text-[rgba(255,255,255,0.5)]">{name}</p>
          <p className="text-[11px] leading-relaxed text-[rgba(255,255,255,0.25)]">
            {views} views · {dateStr}
          </p>
          <span className="ui-badge-genre inline-flex px-2 py-0.5 font-medium">
            {genreTag}
          </span>
        </div>
      </div>
    </article>
  );
}

export function FeedYoutubeLayout({ videos }: { videos: Video[] }) {
  const [mainGenre, setMainGenre] = useState("");
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

  const currentSortLabel = SORT_OPTIONS.find((s) => s.key === sortMode)?.label ?? "Latest";

  const sidebarNav = (
    <nav className="flex flex-row gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-col md:gap-0 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden" aria-label="Genre filters">
      {SIDEBAR_ITEMS.map((item) => {
        const active = mainGenre === item.key;
        return (
          <button
            key={item.key || "all"}
            type="button"
            onClick={() => setMainGenre(item.key)}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm transition md:rounded-none md:px-3 md:py-2.5 ${
              active
                ? "border-b-2 border-[#7F77DD] font-semibold text-[#7F77DD] md:border-b-0 md:border-l-[3px] md:border-[#7F77DD] md:font-semibold"
                : "border-b-2 border-transparent text-[#AFA9EC] hover:bg-white/[0.04] hover:text-[#EEEDFE] md:border-l-[3px] md:border-transparent md:hover:border-white/10"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
      <aside className="lg:sticky lg:top-20 lg:w-52 lg:shrink-0 lg:self-start lg:border-r lg:border-white/10 lg:pr-6">
        <p className="mb-3 hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7F77DD]/80 md:block">Genres</p>
        {sidebarNav}
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex items-center justify-end gap-3">
          <div ref={sortRef} className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              className="relative rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-3 py-2 pr-9 text-[13px] font-medium text-[#EEEDFE] transition hover:border-[rgba(127,119,221,0.45)]"
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
            >
              Sort: {currentSortLabel}
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#AFA9EC]">▾</span>
            </button>
            {sortOpen ? (
              <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[180px] rounded-lg border border-[rgba(127,119,221,0.25)] bg-[#141228] p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
                {SORT_OPTIONS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      setSortMode(s.key);
                      setSortOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[13px] transition ${
                      sortMode === s.key
                        ? "bg-[rgba(83,74,183,0.35)] text-[#EEEDFE]"
                        : "text-[#C7C2F4] hover:bg-[rgba(83,74,183,0.2)] hover:text-[#EEEDFE]"
                    }`}
                  >
                    <span>{s.label}</span>
                    <span className={sortMode === s.key ? "opacity-100" : "opacity-0"}>✓</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {filteredSorted.length === 0 ? (
          <p className="py-12 text-center text-[#AFA9EC]">No films in this category yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredSorted.map((video) => (
              <FeedCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
