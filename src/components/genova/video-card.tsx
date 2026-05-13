"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/genova/language-provider";
import { mainGenreLabel } from "@/lib/constants/genres";
import { formatUploadedRelative } from "@/lib/format-uploaded-relative";
import type { Locale } from "@/lib/i18n/translations";
import { translate } from "@/lib/i18n/translations";
import { formatViewCountShort } from "@/lib/view-count";
import type { Video } from "@/lib/types";

export interface VideoCardProps {
  id: string;
  title: string;
  creator: string;
  genre: string;
  /** English (or canonical) label for chip palette lookup when `genre` is localized. */
  genreColorKey?: string;
  thumbnail: string;
  duration: string;
  views: string;
  avatar?: string;
  createdAt?: string | Date;
}

function formatRuntime(runtime: string | null | undefined): string {
  if (!runtime) return "";

  // Already in time format like "1:23" or "1:23:45"
  if (/^\d+:\d{2}(:\d{2})?$/.test(runtime.trim())) return runtime.trim();

  // Format like "5 min" or "90 min"
  const minMatch = runtime.match(/(\d+)\s*min/);
  if (minMatch) {
    const totalMinutes = parseInt(minMatch[1]);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:00`;
    }
    return `${minutes}:00`;
  }

  // Format like "5분" (Korean)
  const korMatch = runtime.match(/(\d+)분/);
  if (korMatch) {
    const totalMinutes = parseInt(korMatch[1]);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:00`;
    }
    return `${minutes}:00`;
  }

  return runtime;
}

const genreColors: Record<string, string> = {
  "Short Film": "bg-purple-500/55 text-white border-purple-400/60",
  "Feature Film": "bg-purple-500/55 text-white border-purple-400/60",
  "Music Video": "bg-emerald-500/55 text-white border-emerald-400/60",
  Commercial: "bg-amber-500/55 text-white border-amber-400/60",
  Documentary: "bg-blue-500/55 text-white border-blue-400/60",
  Animation: "bg-pink-500/55 text-white border-pink-400/60",
  Experimental: "bg-cyan-500/55 text-white border-cyan-400/60",
  Series: "bg-violet-500/55 text-white border-violet-400/60",
  Horror: "bg-red-500/55 text-white border-red-400/60",
  Romance: "bg-rose-500/55 text-white border-rose-400/60",
  "Sci-Fi": "bg-indigo-500/55 text-white border-indigo-400/60",
  Action: "bg-orange-500/55 text-white border-orange-400/60",
  Trailer: "bg-teal-500/55 text-white border-teal-400/60",
  "Art Film": "bg-violet-500/55 text-white border-violet-400/60",
  Fantasy: "bg-fuchsia-500/55 text-white border-fuchsia-400/60",
  Cyberpunk: "bg-sky-500/55 text-white border-sky-400/60",
  Landscape: "bg-green-500/55 text-white border-green-400/60",
  "Landscape/Nature": "bg-green-500/55 text-white border-green-400/60",
  "City/Architecture": "bg-slate-500/55 text-white border-slate-400/60",
  "Daily Life": "bg-yellow-500/55 text-white border-yellow-400/60",
  Travel: "bg-lime-500/55 text-white border-lime-400/60",
  Food: "bg-orange-600/55 text-white border-orange-500/60",
  Sports: "bg-red-600/55 text-white border-red-500/60",
  Tutorial: "bg-slate-600/55 text-white border-slate-500/60",
  "Cinematic/Emotional": "bg-purple-600/55 text-white border-purple-500/60",
  Soundscape: "bg-teal-600/55 text-white border-teal-500/60",
  "Shocking/Viral": "bg-red-500/55 text-white border-red-400/60",
  "Dynamic/Speed": "bg-orange-500/55 text-white border-orange-400/60",
  "Funny/Meme": "bg-yellow-500/55 text-white border-yellow-400/60",
  Twist: "bg-violet-500/55 text-white border-violet-400/60",
  "ASMR/Healing": "bg-green-500/55 text-white border-green-400/60",
  "Pets/Animals": "bg-lime-500/55 text-white border-lime-400/60",
  Gaming: "bg-indigo-500/55 text-white border-indigo-400/60",
  "Fashion/Beauty": "bg-pink-500/55 text-white border-pink-400/60",
  Drama: "bg-blue-500/55 text-white border-blue-400/60",
  Comedy: "bg-amber-500/55 text-white border-amber-400/60",
};

function genreStyleForLabelInner(label: string): string {
  if (genreColors[label]) return genreColors[label];
  const key = label.split("/")[0]?.trim() ?? "";
  if (key && genreColors[key]) return genreColors[key];
  return genreColors["Short Film"] ?? "bg-purple-500/55 text-white border-purple-400/60";
}

function displayCreator(v: Video, locale: Locale): string {
  const raw = v.creatorName ?? v.uploaderDisplayName;
  if (raw?.trim()) return raw.trim();
  return translate(locale, "video.creatorFallback", "Creator");
}

export function videoToCardProps(video: Video, locale: Locale = "en"): VideoCardProps {
  const thumb = video.thumbnailUrl?.trim();
  const avatar = (video.creatorAvatarUrl ?? video.uploaderAvatarUrl)?.trim() || undefined;
  return {
    id: video.id,
    title: video.title,
    creator: displayCreator(video, locale),
    genre: mainGenreLabel(video.genre, locale),
    genreColorKey: mainGenreLabel(video.genre, "en"),
    thumbnail:
      thumb ||
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop",
    duration: video.runtime ?? "",
    views: formatViewCountShort(video.viewCount ?? 0),
    avatar,
    createdAt: video.createdAt,
  };
}

export function VideoCardFromVideo({ video }: { video: Video }) {
  const { locale } = useI18n();
  return <VideoCard {...videoToCardProps(video, locale)} />;
}

export function VideoCard({
  id,
  title,
  creator,
  genre,
  thumbnail,
  duration,
  views,
  avatar,
  createdAt,
  genreColorKey,
}: VideoCardProps) {
  const { locale, t } = useI18n();
  const timeRaw =
    createdAt !== undefined && createdAt !== ""
      ? formatUploadedRelative(
          typeof createdAt === "string" ? createdAt : createdAt.toISOString(),
          locale,
        )
      : translate(locale, "feed.yesterday", "Yesterday");

  return (
    <>
      <style>{`
        @keyframes borderGlow {
          0% { box-shadow: inset 0 0 0 1.5px rgba(127,119,221,0.6), 0 0 15px rgba(83,74,183,0.4), 0 0 30px rgba(83,74,183,0.15); }
          50% { box-shadow: inset 0 0 0 1.5px rgba(175,169,236,1), 0 0 25px rgba(83,74,183,0.7), 0 0 50px rgba(83,74,183,0.3); }
          100% { box-shadow: inset 0 0 0 1.5px rgba(127,119,221,0.6), 0 0 15px rgba(83,74,183,0.4), 0 0 30px rgba(83,74,183,0.15); }
        }
      `}</style>
      <Link
        href={`/watch/${id}`}
        className="group/card relative block w-full min-w-0 cursor-pointer overflow-hidden rounded-xl border border-white/[0.18] transition-all duration-300 hover:scale-[1.03] hover:border-transparent hover:shadow-[0_0_30px_rgba(83,74,183,0.5),0_0_60px_rgba(83,74,183,0.2)]"
      >
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3/4" }}>
          {/* Animated glow border on hover */}
          <div
            className="pointer-events-none absolute inset-0 z-[10] rounded-xl opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
            style={{
              boxShadow: "inset 0 0 0 1.5px rgba(127,119,221,0.8), 0 0 20px rgba(83,74,183,0.5), 0 0 40px rgba(83,74,183,0.2)",
              animation: "borderGlow 2s ease-in-out infinite",
            }}
          />
          <Image
            src={thumbnail}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
          />

          {/* 기본 상태: 하단 얇은 그라데이션 + 제목만 */}
          <div
            className="absolute inset-x-0 bottom-0 z-[1] transition-opacity duration-300 group-hover/card:opacity-0"
            style={{
              height: "45%",
              background: "linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.5) 50%, transparent 100%)",
            }}
          />
          {/* 장르 배지 — 기본 상태 */}
          <div className="absolute left-2.5 top-2.5 z-[2] transition-opacity duration-300 group-hover/card:opacity-0">
            <span
              className={`rounded-md border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md ${genreStyleForLabelInner(genreColorKey ?? genre)}`}
              style={{
                letterSpacing: "0.02em",
                textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}
            >
              {genre}
            </span>
          </div>

          {/* 제목 + 조회수 — 기본 상태 */}
          <div className="absolute bottom-0 left-0 right-0 z-[2] px-3 pb-3 transition-opacity duration-300 group-hover/card:opacity-0">
            <h3 className="line-clamp-1 text-[14px] font-bold text-white">{title}</h3>
            <p className="mt-0.5 text-[11px] text-white/35">{views} {t("feed.views", "views")}</p>
            {duration && (
              <div className="absolute bottom-3 right-3">
                <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                  {formatRuntime(duration)}
                </span>
              </div>
            )}
          </div>

          {/* hover 오버레이 */}
          <div
            className="absolute inset-0 z-[3] flex flex-col justify-between p-3 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
            style={{
              background: "linear-gradient(to top, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.7) 45%, rgba(10,10,10,0.15) 100%)",
            }}
          >
            {/* 상단: 장르 배지 */}
            <div>
              <span
                className={`rounded-md border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md ${genreStyleForLabelInner(genreColorKey ?? genre)}`}
                style={{
                  letterSpacing: "0.02em",
                  textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}
              >
                {genre}
              </span>
            </div>

            {/* 중앙: 플레이 버튼 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <img
                  src="/genova-play1.png"
                  alt=""
                  className="h-[44px] w-[44px] object-contain opacity-50"
                  aria-hidden
                />
                <svg
                  className="absolute h-[16px] w-[16px]"
                  viewBox="0 0 24 24"
                  fill="white"
                  style={{ marginLeft: "1px" }}
                  aria-hidden
                >
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              </div>
            </div>

            {/* 하단: 크리에이터 + 제목 + 메타 */}
            <div>
              <h3 className="mb-2 line-clamp-2 text-[13px] font-bold leading-snug text-white">{title}</h3>
              <div className="flex items-center gap-2">
                {avatar ? (
                  <img src={avatar} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover border border-white/20" />
                ) : (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#26215C] border border-white/20 text-[8px] font-bold text-white/55">
                    {creator.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <p className="truncate text-[11px] font-medium text-white/70">{creator}</p>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-white/35">
                <span>{views} {t("feed.views", "views")}</span>
                <span>·</span>
                <span>{timeRaw}</span>
                {duration && (
                  <>
                    <span>·</span>
                    <span>{formatRuntime(duration)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}
