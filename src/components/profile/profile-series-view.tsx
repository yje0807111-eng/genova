"use client";

import { useI18n } from "@/components/genova/language-provider";
import { ProfileVideoCard } from "@/components/profile/profile-video-card";
import type { Video } from "@/lib/types";

/**
 * Series tab body — groups the videos by `seriesName`, renders one
 * horizontally-scrollable row per series with episodes sorted by
 * `episodeNumber`.  Each episode uses the shared ProfileVideoCard so
 * it matches the Videos grid exactly (on-hover Mux preview included).
 *
 * Renders nothing-but-placeholder when the user has no series episodes.
 */
export function ProfileSeriesView({ videos }: { videos: Video[] }) {
  const { t } = useI18n();

  const seriesMap = new Map<string, Video[]>();
  for (const v of videos.filter((v) => v.seriesName)) {
    const key = v.seriesName!;
    if (!seriesMap.has(key)) seriesMap.set(key, []);
    seriesMap.get(key)!.push(v);
  }
  const groups = Array.from(seriesMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  if (groups.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-white/30">
        {t("profile.seriesEmptyHint")}
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-5">
      {groups.map(([seriesTitle, episodes]) => (
        <section
          key={seriesTitle}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-4 transition-colors hover:border-[#7F77DD]/25 sm:p-5"
          style={{
            boxShadow: "inset 0 1px 0 rgba(127,119,221,0.06)",
          }}
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
              {seriesTitle}
            </h3>
            <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white/45">
              {t("profile.episodesTotal", "{n} episodes").replace(
                "{n}",
                String(episodes.length),
              )}
            </span>
          </div>
          <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-1">
            {episodes
              .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
              .map((video) => (
                <div key={video.id} className="w-[260px] shrink-0">
                  <ProfileVideoCard
                    video={video}
                    t={t}
                    episodeNumber={video.episodeNumber ?? null}
                  />
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
