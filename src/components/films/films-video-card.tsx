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
      className="group relative block w-full overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
    >
      <div className={`relative w-full overflow-hidden ${aspect}`}>
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a1547] to-[#0f0d24]" />
        )}

        {/* 기본 상태: 얇은 하단 그라데이션 + 제목만 */}
        <div
          className="absolute inset-x-0 bottom-0 z-[1] transition-opacity duration-300 group-hover:opacity-0"
          style={{
            height: "45%",
            background: "linear-gradient(to top, rgba(8,6,24,0.92) 0%, rgba(8,6,24,0.5) 50%, transparent 100%)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 z-[2] px-3 pb-2.5 transition-opacity duration-300 group-hover:opacity-0">
          <h3 className="line-clamp-1 text-[12px] font-semibold text-white/90">{video.title}</h3>
        </div>

        {/* 런타임 — 기본 표시 */}
        {video.runtime && (
          <div className="absolute bottom-2 right-2 z-[4] transition-opacity duration-300 group-hover:opacity-0">
            <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              {video.runtime}
            </span>
          </div>
        )}

        {/* hover 오버레이 */}
        <div
          className="absolute inset-0 z-[3] flex flex-col justify-between p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: "linear-gradient(to top, rgba(8,6,24,0.97) 0%, rgba(8,6,24,0.7) 45%, rgba(8,6,24,0.15) 100%)",
          }}
        >
          {/* 상단: 어워드 배지 or 장르 */}
          <div>
            {awardLabel ? (
              <span className="rounded-md border border-[#FFD700]/30 bg-black/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[#FFD700] backdrop-blur-sm">
                🏆 {awardLabel}
              </span>
            ) : (
              <span
                className="rounded px-2 py-0.5 text-[10px] font-semibold text-white/90"
                style={{
                  background: "linear-gradient(135deg, rgba(83,74,183,0.7) 0%, rgba(39,33,92,0.5) 100%)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(127,119,221,0.25)",
                }}
              >
                {formatGenreDisplay(video.genre, video.subGenre, locale)}
              </span>
            )}
          </div>

          {/* 중앙: 플레이 버튼 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition group-hover:bg-white/20">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "2px" }}>
                <polygon points="6,3 20,12 6,21" />
              </svg>
            </div>
          </div>

          {/* 하단: 제목 + 크리에이터 + 메타 */}
          <div>
            <h3 className="mb-1.5 line-clamp-2 text-[13px] font-bold leading-snug text-white">{video.title}</h3>
            <p className="text-[11px] font-medium text-white/60">{creator}</p>
            {video.viewCount ? (
              <p className="mt-1 text-[10px] text-white/35">
                {video.viewCount >= 1000
                  ? `${(video.viewCount / 1000).toFixed(1)}K views`
                  : `${video.viewCount} views`}
              </p>
            ) : null}
          </div>
        </div>
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
