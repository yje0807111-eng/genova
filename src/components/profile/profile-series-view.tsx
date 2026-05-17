"use client";

import Link from "next/link";
import { ListVideo } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { formatViewCountShort } from "@/lib/view-count";
import type { Video } from "@/lib/types";

/**
 * Series tab body — groups the videos by `seriesName`, renders one
 * horizontally-scrollable row per series with episodes sorted by
 * `episodeNumber`.  Each episode card mirrors the site-wide VideoCard
 * hover behaviour (default thumb → hover overlay with play + meta).
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
    <div className="mt-4 space-y-9">
      {groups.map(([seriesTitle, episodes]) => (
        <div key={seriesTitle}>
          <div className="mb-3.5 flex items-center gap-2.5">
            <h3 className="text-lg font-bold tracking-tight text-white">
              {seriesTitle}
            </h3>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] py-0.5 pl-2 pr-2.5 text-[11px] font-semibold text-white/45">
              <ListVideo className="h-3 w-3 text-[#AFA9EC]" />
              <span className="tabular-nums text-[#AFA9EC]">
                {episodes.length}
              </span>
              {t("profile.episodesUnit", "EP")}
            </span>
          </div>
          <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2">
            {episodes
              .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
              .map((video) => {
                const thumb =
                  video.thumbnailUrl?.trim() ||
                  `https://picsum.photos/seed/${video.id}/400/225`;
                const views = formatViewCountShort(video.viewCount ?? 0);
                return (
                  <Link
                    key={video.id}
                    href={`/watch/${video.id}`}
                    className="group/card relative w-[220px] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/[0.10] transition-all duration-300 hover:scale-[1.03] hover:border-white/20 hover:shadow-[0_16px_40px_rgba(0,0,0,0.45),0_0_40px_rgba(83,74,183,0.10)]"
                  >
                    <div className="relative aspect-video w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element -- picsum fallback URL pattern; thumbnail is dynamic-user from Supabase */}
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                      />

                      {/* glow border on hover */}
                      <div
                        className="pointer-events-none absolute inset-0 z-[10] rounded-xl opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
                        style={{
                          boxShadow:
                            "inset 0 0 0 1px rgba(127,119,221,0.30), 0 0 24px rgba(83,74,183,0.10)",
                        }}
                      />

                      {/* EP 배지 — 상시 노출, 고대비 솔리드 */}
                      {video.episodeNumber ? (
                        <span
                          className="absolute left-2.5 top-2.5 z-[5] rounded-md bg-[#534AB7] px-2 py-1 text-[10px] font-black uppercase leading-none tracking-wider text-white ring-1 ring-white/20"
                          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.55)" }}
                        >
                          EP {video.episodeNumber}
                        </span>
                      ) : null}

                      {/* 기본 상태: 하단 그라데이션 + 제목/조회수 */}
                      <div
                        className="absolute inset-x-0 bottom-0 z-[1] h-[60%] transition-opacity duration-300 group-hover/card:opacity-0"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.55) 45%, transparent 100%)",
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 z-[2] px-3 pb-2.5 transition-opacity duration-300 group-hover/card:opacity-0">
                        <h3 className="line-clamp-1 text-[13px] font-bold text-white">
                          {video.title}
                        </h3>
                        <p className="mt-0.5 text-[10px] text-white/40">
                          {views} {t("feed.views", "views")}
                        </p>
                        {video.runtime ? (
                          <span className="absolute bottom-2.5 right-3 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                            {video.runtime}
                          </span>
                        ) : null}
                      </div>

                      {/* hover 오버레이 — 사이트 VideoCard 와 동일 톤 */}
                      <div
                        className="absolute inset-0 z-[3] flex flex-col justify-end p-3 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.6) 45%, rgba(10,10,10,0.1) 100%)",
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/genova-play1.png"
                              alt=""
                              className="h-[40px] w-[40px] object-contain opacity-50"
                              aria-hidden
                            />
                            <svg
                              className="absolute h-[14px] w-[14px]"
                              viewBox="0 0 24 24"
                              fill="white"
                              style={{ marginLeft: "1px" }}
                              aria-hidden
                            >
                              <polygon points="6,3 20,12 6,21" />
                            </svg>
                          </div>
                        </div>

                        <div>
                          <h3 className="mb-1 line-clamp-2 text-[13px] font-bold leading-snug text-white">
                            {video.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                            <span>
                              {views} {t("feed.views", "views")}
                            </span>
                            {video.runtime ? (
                              <>
                                <span>·</span>
                                <span>{video.runtime}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
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
