"use client";

import Link from "next/link";
import { useI18n } from "@/components/genova/language-provider";
import { formatGenreDisplay } from "@/lib/constants/genres";
import type { Video } from "@/lib/types";

type Size = "hero" | "large" | "medium";

export function FilmsVideoCard({
  video,
  size = "medium",
  awardLabel,
}: {
  video: Video;
  size?: Size;
  awardLabel?: string | null;
}) {
  const { locale, t } = useI18n();
  const aspect =
    size === "hero"
      ? "aspect-[21/9]"
      : size === "large"
        ? "aspect-[16/10]"
        : "aspect-video";

  const creator =
    video.creatorName?.trim() ||
    video.uploaderDisplayName?.trim() ||
    t("video.creatorFallback", "Creator");

  return (
    <Link
      href={`/watch/${video.id}`}
      className="group relative block w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f0d24] transition-all duration-200 hover:-translate-y-[2px] hover:border-[rgba(127,119,221,0.3)] hover:shadow-[0_8px_32px_rgba(83,74,183,0.2)]"
    >
      <div className={`relative w-full overflow-hidden ${aspect}`}>
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-90"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a1547] to-[#0f0d24]" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Award badge */}
        {awardLabel ? (
          <span className="typo-stat-xs absolute left-3 top-3 rounded-md border border-[#FFD700]/30 bg-black/60 px-2.5 py-1 uppercase tracking-[0.12em] text-[#FFD700] backdrop-blur-sm">
            🏆 {awardLabel}
          </span>
        ) : null}

        {/* Runtime if available */}
        {video.runtime ? (
          <span className="typo-overlay-duration absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-white backdrop-blur-sm">
            {video.runtime}
          </span>
        ) : null}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="typo-filmstrip-title line-clamp-2 text-white transition group-hover:text-[#AFA9EC]">
          {video.title}
        </h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="typo-sidebar-tag text-white/45">{formatGenreDisplay(video.genre, video.subGenre, locale)}</span>
          <span className="typo-card-meta truncate text-right text-white/35">{creator}</span>
        </div>
        {video.viewCount ? (
          <p className="typo-card-meta mt-1 text-white/30">
            {video.viewCount >= 1000
              ? `${(video.viewCount / 1000).toFixed(1)}K views`
              : `${video.viewCount} views`}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function FilmsComingSoon({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <div
      className={`flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center ${className}`}
    >
      <p className="typo-sidebar-heading text-[#7F77DD]/65">{t("meta.brand", "Genova")}</p>
      <p className="mt-3 text-lg font-semibold text-white">{t("films.comingSoonTitle", "Coming Soon")}</p>
      <p className="mt-2 max-w-sm text-sm text-white/40">
        {t("films.comingSoonLineup", "This lineup is being curated. Check back shortly.")}
      </p>
    </div>
  );
}
