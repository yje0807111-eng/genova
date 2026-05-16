"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/genova/language-provider";
import { cn } from "@/lib/utils/cn";
import type { Video } from "@/lib/types";

interface Props {
  related: Video[];
  currentVideoId: string;
}

/**
 * Server component — first canary of the Phase B.2 useI18n server
 * migration.  Renders the "Up next" thumbnail rail beside the player
 * with a localized "now playing" badge.  Composed into the watch page
 * via `WatchDesktopFlexRow#upNextSlot` so the parent client component
 * stays a server-rendered subtree.
 */
export function UpNextMiniRail({ related, currentVideoId }: Props) {
  const { t } = useI18n();

  return (
    <>
      {/* 모바일 전용 — 제목이 썸네일 위. 데스크톱 썸네일 전용 레일과 분리. */}
      <div className="flex flex-col gap-4 md:hidden">
        {related.map((v) => (
          <Link key={`m-${v.id}`} href={`/watch/${v.id}`} className="block">
            <div className="mb-1.5 flex items-center gap-2">
              {v.id === currentVideoId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#7F77DD] px-1.5 py-0.5">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-white" />
                  <span className="text-[8px] font-bold uppercase tracking-wider text-white">
                    {t("watch.now", "재생 중")}
                  </span>
                </span>
              )}
              <p className="line-clamp-1 text-[14px] font-bold text-white">{v.title}</p>
            </div>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/[0.06]">
              {v.thumbnailUrl ? (
                <Image
                  src={v.thumbnailUrl}
                  alt={v.title}
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-white/[0.04]" />
              )}
              {v.runtime && (
                <div className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
                  {v.runtime}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* 데스크톱 — 기존 썸네일 전용 레일 */}
      <div className="hidden flex-col gap-1.5 md:flex">
      {related.map((v) => (
        <Link
          key={v.id}
          href={`/watch/${v.id}`}
          title={v.title}
          className={cn(
            "group relative block aspect-video w-full shrink-0 overflow-hidden rounded-md ring-2 transition",
            v.id === currentVideoId
              ? "ring-[#7F77DD]"
              : "ring-transparent hover:ring-white/30",
          )}
        >
          {v.thumbnailUrl ? (
            <Image
              src={v.thumbnailUrl}
              alt={v.title}
              fill
              sizes="(max-width: 1024px) 50vw, 200px"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-white/[0.04]" />
          )}

          {v.id === currentVideoId && (
            <div className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-[#7F77DD] px-1 py-0.5">
              <span className="h-1 w-1 animate-pulse rounded-full bg-white" />
              <span className="text-[7px] font-bold uppercase tracking-wider text-white">
                {t("watch.now", "재생 중")}
              </span>
            </div>
          )}

          {v.runtime && (
            <div className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 py-px text-[8px] font-bold tabular-nums text-white">
              {v.runtime}
            </div>
          )}
        </Link>
      ))}
      </div>
    </>
  );
}
