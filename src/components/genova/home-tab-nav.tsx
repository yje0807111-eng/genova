"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useI18n } from "@/components/genova/language-provider";

export type MainTab = "recommended" | "films";
export type SubGenre = "all" | "film" | "animation" | "music" | "art" | "daily" | "trending" | "awards";
export type SortKey = "latest" | "liked" | "viewed";

export interface HomeTabNavProps {
  activeMainTab: MainTab;
  activeSubGenre: SubGenre;
  activeSort: SortKey;
  searchQuery: string;
  onMainTabChange: (tab: MainTab) => void;
  onSubGenreChange: (genre: SubGenre) => void;
  onSortChange: (sort: SortKey) => void;
  onSearchChange: (query: string) => void;
}

const MAIN_TABS: MainTab[] = ["recommended", "films"];

const mainTabKeys: Record<MainTab, string> = {
  recommended: "homeTab.recommended",
  films: "homeTab.films",
};

const subGenreFilmsKeys: Record<string, string> = {
  all: "homeTab.subGenre.all",
  film: "homeTab.subGenre.film",
  animation: "homeTab.subGenre.animation",
  music: "homeTab.subGenre.music",
  art: "homeTab.subGenre.art",
  daily: "homeTab.subGenre.daily",
};

const subGenreRecKeys: Record<string, string> = {
  all: "homeTab.subRec.all",
  trending: "homeTab.subRec.trending",
  new: "homeTab.subRec.new",
  popular: "homeTab.subRec.popular",
  awards: "homeTab.subRec.awards",
};

export function HomeTabNav({
  activeMainTab,
  activeSubGenre,
  activeSort,
  searchQuery,
  onMainTabChange,
  onSubGenreChange,
  onSortChange,
  onSearchChange,
}: HomeTabNavProps) {
  const { t } = useI18n();
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "latest", label: t("homeTab.sort.latest", "최신순") },
    { key: "liked", label: t("homeTab.sort.liked", "좋아요순") },
    { key: "viewed", label: t("homeTab.sort.viewed", "조회수순") },
  ];

  const subOptions = useMemo((): SubGenre[] => {
    switch (activeMainTab) {
      case "recommended":
        return ["all", "trending", "awards"];
      case "films":
        return ["all", "film", "animation", "music", "art", "daily"];
      default:
        return [];
    }
  }, [activeMainTab]);

  const subKeys = activeMainTab === "recommended" ? subGenreRecKeys : subGenreFilmsKeys;

  return (
    <div className="relative z-[60]">
      {/* Main tab row */}
      <div className="w-full px-6 py-3 sm:px-8 flex items-center gap-6">
        <div className="flex shrink-0 items-center gap-2">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => onMainTabChange(tab)}
              className={cn(
                activeMainTab === tab
                  ? "rounded-lg px-4 py-1.5 text-[14px] font-bold text-white bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition"
                  : "rounded-lg px-4 py-1.5 text-[14px] font-semibold text-white/45 hover:text-white/80 hover:bg-white/[0.03] transition"
              )}
            >
              {t(mainTabKeys[tab])}
            </button>
          ))}
        </div>

        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => setSortOpen((prev) => !prev)}
            className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-[12px] font-semibold text-white/70 transition hover:border-white/[0.12] hover:bg-white/[0.04]"
          >
            {sortOptions.find((o) => o.key === activeSort)?.label}
            <ChevronDown className="h-3 w-3" />
          </button>
          {sortOpen && (
            <div className="absolute left-0 top-full z-[100] mt-1 w-32 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-xl">
              {sortOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    onSortChange(opt.key);
                    setSortOpen(false);
                  }}
                  className={cn(
                    "block w-full px-3 py-2 text-left text-[12px] font-semibold transition",
                    activeSort === opt.key
                      ? "bg-white/[0.04] text-white"
                      : "text-white/55 hover:bg-white/[0.03] hover:text-white/80",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex flex-1 items-center max-w-[600px]">
          <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-white/40" aria-hidden />
          <input
            type="text"
            placeholder={t("homeTab.searchPlaceholder", "검색")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] pl-9 pr-3 text-[13px] text-white placeholder:text-white/30 outline-none transition focus:border-[#7F77DD]/40 focus:bg-white/[0.04]"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Sub-filter row */}
      {subOptions.length > 0 && !searchQuery.trim() && (
        <div className="px-6 sm:px-8 mt-1">
          <div className="flex flex-wrap gap-4">
            {subOptions.map((option) => (
              <button
                key={option}
                onClick={() => onSubGenreChange(option)}
                className={cn(
                  "text-[13px] font-semibold transition",
                  activeSubGenre === option
                    ? "text-white"
                    : "text-white/40 hover:text-white/70",
                )}
              >
                {t(subKeys[option])}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
