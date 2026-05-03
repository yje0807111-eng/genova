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
  "Short Film": "bg-purple-500/35 text-purple-100 border-purple-500/40",
  "Feature Film": "bg-purple-500/35 text-purple-100 border-purple-500/40",
  "Music Video": "bg-emerald-500/35 text-emerald-100 border-emerald-500/40",
  Commercial: "bg-amber-500/35 text-amber-100 border-amber-500/40",
  Documentary: "bg-blue-500/35 text-blue-100 border-blue-500/40",
  Animation: "bg-pink-500/35 text-pink-100 border-pink-500/40",
  Experimental: "bg-cyan-500/35 text-cyan-100 border-cyan-500/40",
  Series: "bg-violet-500/35 text-violet-100 border-violet-500/40",
  Horror: "bg-red-500/35 text-red-100 border-red-500/40",
  Romance: "bg-rose-500/35 text-rose-100 border-rose-500/40",
  "Sci-Fi": "bg-indigo-500/35 text-indigo-100 border-indigo-500/40",
  Action: "bg-orange-500/35 text-orange-100 border-orange-500/40",
  Trailer: "bg-teal-500/35 text-teal-100 border-teal-500/40",
  "Art Film": "bg-violet-500/35 text-violet-100 border-violet-500/40",
  Fantasy: "bg-fuchsia-500/35 text-fuchsia-100 border-fuchsia-500/40",
  Cyberpunk: "bg-sky-500/35 text-sky-100 border-sky-500/40",
  Landscape: "bg-green-500/35 text-green-100 border-green-500/40",
  "Landscape/Nature": "bg-green-500/35 text-green-100 border-green-500/40",
  "City/Architecture": "bg-slate-500/35 text-slate-100 border-slate-500/40",
  "Daily Life": "bg-yellow-500/35 text-yellow-100 border-yellow-500/40",
  Travel: "bg-lime-500/35 text-lime-100 border-lime-500/40",
  Food: "bg-orange-600/35 text-orange-100 border-orange-600/40",
  Sports: "bg-red-600/35 text-red-100 border-red-600/40",
  Tutorial: "bg-slate-600/35 text-slate-100 border-slate-600/40",
  "Cinematic/Emotional": "bg-purple-600/35 text-purple-100 border-purple-600/40",
  Soundscape: "bg-teal-600/35 text-teal-100 border-teal-600/40",
  "Shocking/Viral": "bg-red-500/35 text-red-100 border-red-500/40",
  "Dynamic/Speed": "bg-orange-500/35 text-orange-100 border-orange-500/40",
  "Funny/Meme": "bg-yellow-500/35 text-yellow-100 border-yellow-500/40",
  Twist: "bg-violet-500/35 text-violet-100 border-violet-500/40",
  "ASMR/Healing": "bg-green-500/35 text-green-100 border-green-500/40",
  "Pets/Animals": "bg-lime-500/35 text-lime-100 border-lime-500/40",
  Gaming: "bg-indigo-500/35 text-indigo-100 border-indigo-500/40",
  "Fashion/Beauty": "bg-pink-500/35 text-pink-100 border-pink-500/40",
  Drama: "bg-blue-500/35 text-blue-100 border-blue-500/40",
  Comedy: "bg-amber-500/35 text-amber-100 border-amber-500/40",
};

function genreStyleForLabel(label: string): string {
  if (genreColors[label]) return genreColors[label];
  const key = label.split("/")[0]?.trim() ?? "";
  if (key && genreColors[key]) return genreColors[key];
  return genreColors["Short Film"] ?? "bg-purple-500/35 text-purple-100 border-purple-500/40";
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
    <Link
      href={`/watch/${id}`}
      className="group/card relative block w-full min-w-0 cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
    >
      {/* 썸네일 — 16:9 */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover/card:scale-105"
        />

        {/* 하단 그라데이션 */}
        <div
          className="absolute inset-x-0 bottom-0 z-[1]"
          style={{
            height: "85%",
            background: "linear-gradient(to top, rgba(8,6,24,1) 0%, rgba(8,6,24,1) 25%, rgba(8,6,24,0.8) 50%, transparent 100%)",
          }}
        />

        {/* 장르 배지 */}
        <div className="absolute left-2 top-2 z-[2]">
          <span
            className="rounded px-2 py-0.5 text-[10px] font-semibold text-white/90"
            style={{
              background: "linear-gradient(135deg, rgba(83,74,183,0.7) 0%, rgba(39,33,92,0.5) 100%)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(127,119,221,0.25)",
            }}
          >
            {genre}
          </span>
        </div>

        {/* 런타임 배지 */}
        {duration && (
          <div className="absolute bottom-[44px] right-2 z-[2]">
            <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              {formatRuntime(duration)}
            </span>
          </div>
        )}

        {/* 호버 플레이 버튼 */}
        <div className="absolute inset-0 z-[2] flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
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

        {/* 하단 텍스트 — 카드 내부 */}
        <div className="absolute bottom-0 left-0 right-0 z-[3] px-3 pb-2.5">
          <h3 className="line-clamp-1 text-[13px] font-bold text-white">{title}</h3>
          <div className="mt-0.5 flex items-center justify-between">
            <p className="text-[11px] text-white/55">{creator}</p>
            <p className="text-[11px] text-white/35">
              {views} {t("feed.views", "views")} · {timeRaw}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
