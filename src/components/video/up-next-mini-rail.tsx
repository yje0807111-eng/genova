"use client";

import Link from "next/link";
import { useI18n } from "@/components/genova/language-provider";
import { cn } from "@/lib/utils/cn";
import type { Video } from "@/lib/types";

interface Props {
  related: Video[];
  currentVideoId: string;
}

export function UpNextMiniRail({ related, currentVideoId }: Props) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-1.5">
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
            <img
              src={v.thumbnailUrl}
              alt={v.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
  );
}
