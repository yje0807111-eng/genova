"use client";

import { AnimateIn } from "@/components/animate-in";
import { useI18n } from "@/components/genova/language-provider";
import { VideoCardFromVideo } from "@/components/genova/video-card";
import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeToMainGenre } from "@/lib/constants/genres";
import type { Video } from "@/lib/types";

type SortMode = "latest" | "popular" | "finalist";

export function FeedYoutubeLayout({ videos, hideSidebar, defaultGenre }: { videos: Video[]; hideSidebar?: boolean; defaultGenre?: string }) {
  const { t } = useI18n();
  const SORT_OPTIONS: { key: SortMode; label: string }[] = [
    { key: "latest", label: t("feed.sortLatest", "Latest") },
    { key: "popular", label: t("feed.sortPopular", "Popular") },
    { key: "finalist", label: t("feed.sortAwardWinners", "Award Winners") },
  ];
  const SIDEBAR_ITEMS: { key: string; label: string }[] = [
    { key: "", label: "All" },
    { key: "film", label: "Film" },
    { key: "animation", label: "Animation" },
    { key: "music", label: "Music" },
    { key: "daily", label: "Daily" },
    { key: "art", label: "Art" },
  ];
  const [mainGenre, setMainGenre] = useState(defaultGenre ?? "");
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);

  const filteredSorted = useMemo(() => {
    let list = videos;
    if (mainGenre) {
      list = list.filter((v) => normalizeToMainGenre(v.genre) === mainGenre);
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

  useEffect(() => {
    setMainGenre(defaultGenre ?? "");
  }, [defaultGenre]);

  const currentSortLabel = SORT_OPTIONS.find((s) => s.key === sortMode)?.label ?? t("feed.sortLatest", "Latest");

  const sidebarNav = (
    <nav className="flex flex-row gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-col md:gap-0 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden" aria-label="Genre filters">
      {SIDEBAR_ITEMS.map((item) => {
        const active = mainGenre === item.key;
        return (
          <button
            key={item.key || "all"}
            type="button"
            onClick={() => setMainGenre(item.key)}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm transition md:px-3 md:py-2.5 ${
              active
                ? "border-b-2 border-[#8b5cf6] font-semibold text-[#8b5cf6] md:rounded-r-lg md:border-b-0 md:border-l-2 md:border-[#8b5cf6] md:bg-[#534AB7]/15"
                : "border-b-2 border-transparent text-[#AFA9EC] hover:bg-white/5 hover:text-[#EEEDFE]"
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
      {!hideSidebar ? (
        <AnimateIn delay={0.1} className="lg:sticky lg:top-20 lg:w-52 lg:shrink-0 lg:self-start lg:border-r lg:border-white/10 lg:pr-6">
          <p className="typo-sidebar-heading mb-3 hidden text-[#b6abf6]/90 md:block">{t("sidebar.genres", "GENRES")}</p>
          {sidebarNav}
        </AnimateIn>
      ) : null}

      <div className="min-w-0 flex-1 space-y-6">
        {!hideSidebar && (
          <AnimateIn delay={0.15}>
            <div className="flex items-center justify-end gap-3">
              <div ref={sortRef} className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((v) => !v)}
                  className="typo-sidebar-link relative rounded-lg border border-[var(--border-white-12)] bg-[rgba(255,255,255,0.05)] px-3 py-2 pr-9 text-[13px] font-medium text-[#EEEDFE] transition hover:border-[rgba(127,119,221,0.45)]"
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                >
                  {t("feed.sortLabel", "Sort")}: {currentSortLabel}
                  <span className="typo-sidebar-tag pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#AFA9EC]">▾</span>
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
                        className={`typo-sidebar-link flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[13px] transition ${
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
          </AnimateIn>
        )}

        {filteredSorted.length === 0 ? (
          <p className="py-12 text-center text-[#AFA9EC]">
            {t("feed.noFilmsInCategory", "No films in this category yet.")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSorted.map((video, idx) => (
              <AnimateIn key={video.id} delay={0.1 + idx * 0.04}>
                <VideoCardFromVideo video={video} />
              </AnimateIn>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
