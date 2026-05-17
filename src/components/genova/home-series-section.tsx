"use client";

import { useMemo } from "react";
import { Film } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { HoverPreviewCard } from "@/components/genova/hover-preview-card";
import type { Video } from "@/lib/types";

/**
 * Films → "시리즈" sub-view: groups the catalog by `seriesName` and
 * renders one panel per series (horizontal episode scroll), so users
 * can browse series-by-series. Mirrors the profile Series panel tone.
 */
export function HomeSeriesSection({ videos }: { videos: Video[] }) {
  const { t } = useI18n();

  const groups = useMemo(() => {
    const map = new Map<string, Video[]>();
    for (const v of videos) {
      const name = v.seriesName?.trim();
      if (!name) continue;
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(v);
    }
    return Array.from(map.entries())
      .map(([name, eps]) => ({
        name,
        episodes: eps.sort(
          (a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0),
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [videos]);

  if (groups.length === 0) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
        <Film className="h-10 w-10 text-white/15" />
        <p className="mt-3 text-sm text-white/35">
          {t("home.series.empty", "No series yet.")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section
          key={g.name}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-4 sm:p-5"
          style={{ boxShadow: "inset 0 1px 0 rgba(127,119,221,0.06)" }}
        >
          <div className="mb-4 flex items-center gap-3">
            <span
              className="h-7 w-1 shrink-0 rounded-full"
              style={{
                background:
                  "linear-gradient(180deg, #7F77DD 0%, #534AB7 100%)",
              }}
              aria-hidden
            />
            <h3 className="text-lg font-bold tracking-tight text-white">
              {g.name}
            </h3>
            <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white/45">
              {t("profile.episodesTotal", "{n} episodes").replace(
                "{n}",
                String(g.episodes.length),
              )}
            </span>
          </div>
          <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-1">
            {g.episodes.map((v) => (
              <div key={v.id} className="w-[240px] shrink-0">
                <HoverPreviewCard video={v} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
