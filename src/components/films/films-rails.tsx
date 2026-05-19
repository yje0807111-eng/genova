"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Trophy, PlayCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import type { ContinueWatchingVideo } from "@/lib/queries/films-rails";
import type { Video } from "@/lib/types";

interface FilmsRailsProps {
  awardWinners: Video[];
  continueWatching: ContinueWatchingVideo[];
}

/**
 * F4: Films Beta 2 horizontal rails — Series, Award Winners,
 * Continue Watching.  Composed as a slot from page.tsx into the
 * client home shell.
 *
 * Server-rendered: receives already-fetched arrays from page.tsx
 * (composed there via Promise.all alongside the existing prefetch)
 * and resolves locale-aware section titles via useI18n.  Empty
 * arrays are skipped silently — the slot collapses to nothing when
 * the user has no Continue Watching rows or the catalog has no
 * series/awards.
 *
 * Order per CLAUDE.md "베타 2 오픈 시" spec: Series / Award Winners
 * stack ABOVE Continue Watching so newcomers see the curated content
 * first; returning viewers' resume queue is right below.
 */
export function FilmsRails({
  awardWinners,
  continueWatching,
}: FilmsRailsProps) {
  const { t } = useI18n();

  // Nothing to render — collapse the whole slot.  (시리즈 레일은
  // 별도 '시리즈' 서브탭으로 분리되어 발견 화면에서는 제외.)
  if (awardWinners.length === 0 && continueWatching.length === 0) {
    return null;
  }

  return (
    <div className="space-y-10">
      {continueWatching.length > 0 && (
        <FilmsRailRow
          icon={<PlayCircle className="h-4 w-4 text-[#AFA9EC]" />}
          title={t("films.continueWatching", "Continue Watching")}
          videos={continueWatching}
          showProgress
        />
      )}
      {awardWinners.length > 0 && (
        <FilmsRailRow
          icon={<Trophy className="h-4 w-4 text-[#FFD700]" />}
          title={t("films.awardWinners", "Award Winners")}
          videos={awardWinners}
        />
      )}
    </div>
  );
}

interface FilmsRailRowProps {
  icon: React.ReactNode;
  title: string;
  videos: (Video | ContinueWatchingVideo)[];
  showProgress?: boolean;
}

function FilmsRailRow({ icon, title, videos, showProgress }: FilmsRailRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, videos.length]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <section className="group/rail">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-[15px] font-bold text-white">{title}</h2>
      </div>
      {/* Netflix식 좌/우 화살표 — 스크롤바 대신. 끝에 닿으면 숨김,
          레일 hover 시에만 노출(데스크톱). */}
      <div className="relative">
        {canLeft && (
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollByDir(-1)}
            className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.12] bg-black/60 text-white opacity-0 backdrop-blur-md transition hover:bg-black/80 group-hover/rail:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div
          ref={scrollerRef}
          className="hide-scrollbar flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
        >
          {videos.map((v) => (
            <FilmsRailCard
              key={v.id}
              video={v}
              progressRatio={
                showProgress
                  ? (v as ContinueWatchingVideo).progressRatio
                  : undefined
              }
            />
          ))}
        </div>
        {canRight && (
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollByDir(1)}
            className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.12] bg-black/60 text-white opacity-0 backdrop-blur-md transition hover:bg-black/80 group-hover/rail:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </section>
  );
}

function FilmsRailCard({
  video,
  progressRatio,
}: {
  video: Video;
  progressRatio?: number;
}) {
  const creator =
    video.creatorName?.trim() ||
    video.uploaderDisplayName?.trim() ||
    "Creator";
  const pct =
    typeof progressRatio === "number"
      ? Math.min(100, Math.max(0, progressRatio * 100))
      : null;

  return (
    <Link
      href={`/watch/${video.id}`}
      className="group relative block aspect-video w-[260px] shrink-0 snap-start overflow-hidden rounded-lg border border-white/[0.08] transition hover:border-white/25 hover:shadow-[0_0_24px_rgba(127,119,221,0.18)]"
      title={video.title}
    >
      {video.thumbnailUrl ? (
        <Image
          src={video.thumbnailUrl}
          alt=""
          fill
          sizes="260px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1547] via-[#15102E] to-[#1a1a1a]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      <div
        className={`absolute inset-x-0 bottom-0 p-2.5 ${pct !== null ? "pb-3" : ""}`}
      >
        <h3 className="line-clamp-1 text-[13px] font-bold text-white">
          {video.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-white/60">
          {creator}
        </p>
      </div>

      {pct !== null && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15">
          <div
            className="h-full rounded-r-full"
            style={{
              width: `${pct}%`,
              background:
                "linear-gradient(to right, #7F77DD, #AFA9EC)",
            }}
          />
        </div>
      )}
    </Link>
  );
}
