"use client";

import Link from "next/link";
import { useI18n } from "@/components/genova/language-provider";
import { formatViewCountShort } from "@/lib/view-count";
import type { Video } from "@/lib/types";

/**
 * Series tab body — groups the videos by `seriesName`, renders one
 * horizontally-scrollable row per series with episodes sorted by
 * `episodeNumber`.  Falls back to a placeholder line when nothing
 * matches.
 *
 * Renders nothing-but-placeholder when the user has no series episodes,
 * so the parent doesn't need to gate the render beyond
 * `activeTab === "Series"`.
 */
export function ProfileSeriesView({ videos }: { videos: Video[] }) {
  const { t } = useI18n();

  const seriesMap = new Map<string, Video[]>();
  for (const v of videos.filter((v) => v.seriesName)) {
    const key = v.seriesName!;
    if (!seriesMap.has(key)) seriesMap.set(key, []);
    seriesMap.get(key)!.push(v);
  }
  const groups = Array.from(seriesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  if (groups.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-white/30">{t("profile.seriesEmptyHint")}</p>
    );
  }

  return (
    <div className="mt-4 space-y-8">
      {groups.map(([seriesTitle, episodes]) => (
        <div key={seriesTitle}>
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-lg font-bold text-white">{seriesTitle}</h3>
            <span className="rounded-full border border-[#7F77DD]/30 bg-[#534AB7]/20 px-2.5 py-0.5 text-xs text-[#AFA9EC]">
              {t("profile.episodesTotal").replace("{n}", String(episodes.length))}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {episodes
              .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
              .map((video) => {
                const thumb =
                  video.thumbnailUrl?.trim() || `https://picsum.photos/seed/${video.id}/400/225`;
                const views = formatViewCountShort(video.viewCount ?? 0);
                return (
                  <Link
                    key={video.id}
                    href={`/watch/${video.id}`}
                    className="group/card relative shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/[0.08] transition-all duration-300 hover:scale-[1.03] hover:border-[#7F77DD]/40 w-[220px]"
                  >
                    <div className="relative w-full overflow-hidden aspect-video">
                      {/* eslint-disable-next-line @next/next/no-img-element -- picsum fallback URL pattern; thumbnail is dynamic-user from Supabase; next/image fill mode is overkill for a 220x124 below-fold thumb */}
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                      />
                      <div
                        className="absolute inset-x-0 bottom-0 z-[1] h-[70%]"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.8) 40%, transparent 100%)",
                        }}
                      />
                      {video.episodeNumber ? (
                        <span className="absolute left-2 top-2 z-[2] rounded-full border border-[#7F77DD]/30 bg-[#534AB7]/40 px-2 py-0.5 text-[10px] font-bold text-[#AFA9EC] backdrop-blur-sm">
                          EP {video.episodeNumber}
                        </span>
                      ) : null}
                      {video.runtime ? (
                        <span className="absolute bottom-[36px] right-2 z-[2] rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                          {video.runtime}
                        </span>
                      ) : null}
                      <div className="absolute bottom-0 left-0 right-0 z-[3] px-2.5 pb-2">
                        <h3 className="line-clamp-1 text-[12px] font-bold text-white">{video.title}</h3>
                        <p className="text-[10px] text-white/35">
                          {views} {t("profile.viewsSuffix")}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
