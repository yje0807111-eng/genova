"use client";

import Link from "next/link";
import { useI18n } from "@/components/genova/language-provider";
import type { Video } from "@/lib/types";

function formatDurationLabel(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function parseRuntimeToSeconds(runtime: string | null | undefined): number {
  if (!runtime) return 0;
  const raw = runtime.trim();
  if (!raw) return 0;

  const colonParts = raw.split(":").map((p) => Number(p));
  if (colonParts.length === 2 && colonParts.every(Number.isFinite)) {
    return Math.max(0, colonParts[0] * 60 + colonParts[1]);
  }
  if (colonParts.length === 3 && colonParts.every(Number.isFinite)) {
    return Math.max(0, colonParts[0] * 3600 + colonParts[1] * 60 + colonParts[2]);
  }

  return 0;
}

export function VideoCard({
  video,
  rank,
  showRank = false,
  showLikes = true,
  showMadeWith = true,
  showDuration = true,
  showViews = true,
}: {
  video: Video;
  rank?: number;
  showRank?: boolean;
  showLikes?: boolean;
  showMadeWith?: boolean;
  showDuration?: boolean;
  showViews?: boolean;
}) {
  const { t } = useI18n();
  const aiTools = ((video as Video & { aiTools?: string[] | null }).aiTools ?? []) as string[];
  const videoWithDuration = video as Video & {
    durationSeconds?: number | null;
    duration_seconds?: number | null;
    duration?: number | null;
  };
  const durationSecondsRaw =
    videoWithDuration.durationSeconds ??
    videoWithDuration.duration_seconds ??
    videoWithDuration.duration ??
    parseRuntimeToSeconds(video.runtime);
  const durationSeconds = Number.isFinite(durationSecondsRaw) ? Math.max(0, Number(durationSecondsRaw)) : 0;
  const creator =
    video.creatorName?.trim() || video.uploaderDisplayName?.trim() || "Creator";

  return (
    <Link
      href={`/watch/${video.id}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-xl border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-[1.02] hover:border-white/25 hover:shadow-[0_0_40px_rgba(127,119,221,0.2)]"
    >
      {video.thumbnailUrl ? (
        <div className="absolute inset-0">
          <img
            src={video.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 brightness-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1547] via-[#15102E] to-[#1a1a1a] shadow-[inset_0_0_40px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl text-white/[0.08]">✦</span>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />

      <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: "rgba(10,10,10,0.7)",
            border: "1px solid rgba(175,169,236,0.5)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 0 24px rgba(127,119,221,0.5)",
          }}
        >
          <svg className="ml-0.5 h-5 w-5" viewBox="0 0 24 24" fill="white">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        </div>
      </div>

      {showRank && typeof rank === "number" ? (
        <div className="absolute left-3 top-3 z-10">
          <p
            className="text-xs font-mono font-semibold tracking-wider text-white/70"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}
          >
            {String(rank).padStart(2, "0")}
          </p>
        </div>
      ) : null}

      {showLikes && (video.likeCount ?? 0) > 0 ? (
        <div className="absolute right-3 top-3 z-10">
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{
              background: "rgba(10,10,10,0.65)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <svg className="h-3 w-3 text-[#FF6B9D]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="text-[10px] font-black tabular-nums text-white">
              {(video.likeCount ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      ) : null}

      {showDuration && durationSeconds > 0 ? (
        <div className="absolute bottom-3 right-3 z-20">
          <span className="rounded border border-white/10 bg-[#0a0a0a]/90 px-2 py-0.5 text-[11px] font-mono font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)] backdrop-blur-md">
            {formatDurationLabel(durationSeconds)}
          </span>
        </div>
      ) : null}

      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black via-black/80 to-transparent p-4">
        {showMadeWith && aiTools.length > 0 ? (
          <div className="mb-2 max-h-0 translate-y-2 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-h-[40px] group-hover:translate-y-0 group-hover:opacity-100">
            <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
              {t("home.madeWith", "Made With")}
            </p>
            <p className="line-clamp-1 text-xs text-white/70">{aiTools.slice(0, 3).join(" · ")}</p>
          </div>
        ) : null}

        <h3 className="line-clamp-1 text-base font-bold text-white">{video.title}</h3>
        <p className="mt-1 text-xs text-white/50">
          {creator}
          {showViews && typeof video.viewCount === "number" ? (
            <span className="text-white/35">
              {" "}
              · {video.viewCount.toLocaleString()} {t("video.viewsDot")}
            </span>
          ) : null}
        </p>
      </div>
    </Link>
  );
}

