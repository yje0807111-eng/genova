"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Play, Plus, Info } from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { useI18n } from "@/components/genova/language-provider";
import {
  MAIN_GENRE_KEYS,
  normalizeToMainGenre,
  mainGenreLabel,
  subGenreLabel,
  type MainGenreKey,
  type SubGenreKey,
} from "@/lib/constants/genres";
import { formatUploadedRelative } from "@/lib/format-uploaded-relative";
import { addWindowCustomListener } from "@/lib/dom/window-custom-events";
import type { Video } from "@/lib/types";
import type { Locale } from "@/lib/i18n/translations";
import Link from "next/link";
import { ContinueWatching } from "@/components/films/continue-watching";
import { cn } from "@/lib/utils/cn";

const HERO_FALLBACKS = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1400&q=80",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1400&q=80",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1400&q=80",
];

const MOCK_CARD_DATA = [
  {
    title: "Beyond the Horizon",
    director: "Luna Kim",
    description: "A new act begins at humanity's edge — an emotional journey set against the vast cosmos.",
  },
  {
    title: "The Last Memory",
    director: "John Park",
    description: "Fragments of fading memory — a quest to recover what was almost lost forever.",
  },
  {
    title: "Echoes",
    director: "Seo Yoon",
    description: "Stories heard through silence — moments of feeling that ripple outward like echoes.",
  },
  {
    title: "The Lighthouse",
    director: "Minwoo Lee",
    description: "Where light touches the waves, hope remains — love and sacrifice in the eye of the storm.",
  },
];

type MockSeriesRow =
  | {
      title: string;
      thumbnail: string;
      episodes: number;
      genreMode: "main";
      mainKey: MainGenreKey;
    }
  | {
      title: string;
      thumbnail: string;
      episodes: number;
      genreMode: "sub";
      subKey: SubGenreKey;
    };

function mockSeriesGenreLabel(row: MockSeriesRow, loc: Locale): string {
  return row.genreMode === "main"
    ? mainGenreLabel(row.mainKey, loc)
    : subGenreLabel(row.subKey, loc);
}

const MOCK_SERIES_ROWS: MockSeriesRow[] = [
  {
    title: "Neon Dynasty",
    genreMode: "sub",
    subKey: "sf",
    episodes: 6,
    thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80",
  },
  {
    title: "The Last Signal",
    genreMode: "sub",
    subKey: "thriller",
    episodes: 4,
    thumbnail: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80",
  },
  {
    title: "Echoes of Eden",
    genreMode: "sub",
    subKey: "drama",
    episodes: 8,
    thumbnail: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80",
  },
  {
    title: "Glitch World",
    genreMode: "main",
    mainKey: "animation",
    episodes: 5,
    thumbnail: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80",
  },
  {
    title: "Phantom Frequency",
    genreMode: "sub",
    subKey: "horror",
    episodes: 3,
    thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80",
  },
];

type MockAwardRow = {
  title: string;
  color: string;
  thumbnail: string;
  labelKey: string;
};

const MOCK_AWARD_ROWS: MockAwardRow[] = [
  {
    title: "The Silent Hour",
    labelKey: "films.mockAwardGrand",
    color: "#FFD700",
    thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80",
  },
  {
    title: "Neon Requiem",
    labelKey: "films.mockAwardExcellence",
    color: "#C0C0C0",
    thumbnail: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80",
  },
  {
    title: "Dust & Stars",
    labelKey: "films.mockAwardMerit",
    color: "#CD7F32",
    thumbnail: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80",
  },
  {
    title: "Echo Chamber",
    labelKey: "films.mockAwardAudience",
    color: "#8b5cf6",
    thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80",
  },
  {
    title: "Phantom Loop",
    labelKey: "films.mockAwardSpecial",
    color: "#7F77DD",
    thumbnail: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80",
  },
];

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function TrophyIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill={color}>
      <path d="M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V18H8v2h8v-2h-3v-2.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
    </svg>
  );
}

function Particles() {
  const seededRange = (i: number, salt: string, min: number, max: number) => {
    const normalized = (stableHash(`particle-${i}-${salt}`) % 10000) / 10000;
    return min + normalized * (max - min);
  };

  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: seededRange(i, "x", 0, 100),
    y: seededRange(i, "y", 0, 100),
    size: seededRange(i, "size", 1, 4),
    duration: seededRange(i, "duration", 3, 7),
    delay: seededRange(i, "delay", 0, 4),
    color: i % 3 === 0 ? "#FFD700" : i % 3 === 1 ? "#8b5cf6" : "#AFA9EC",
    opacity: seededRange(i, "opacity", 0.2, 0.7),
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: p.opacity,
            animation: `floatParticle ${p.duration}s ${p.delay}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

function HeroBanner({
  awardWinners,
  allVideos,
}: {
  awardWinners: (Video & { award?: string | null })[];
  allVideos: Video[];
}) {
  const { t } = useI18n();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const allForDisplay = awardWinners.length > 0 ? awardWinners : [];
  const displayVideos = [
    allForDisplay[0] ?? allVideos[0] ?? null,
    allForDisplay[1] ?? allVideos[1] ?? null,
    allForDisplay[2] ?? allVideos[2] ?? null,
    allForDisplay[3] ?? allVideos[3] ?? null,
  ];

  const glowColors = [
    "rgba(255,215,0,0.6)", // 금 - Grand Prize
    "rgba(192,192,192,0.6)", // 은 - Excellence
    "rgba(205,127,50,0.6)", // 동 - Merit
    "rgba(139,92,246,0.6)", // 보라 - Audience
  ];
  const glowBorders = ["#FFD700", "#C0C0C0", "#CD7F32", "#8b5cf6"];

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        minHeight: "520px",
        backgroundImage: "url('/award-banner-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        zIndex: 10,
        position: "relative",
      }}
    >
      <style>{`
        @keyframes floatParticle {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.2; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-20px) translateX(10px); opacity: 0.1; }
        }

        @keyframes glowPulse {
          0% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.05); }
          100% { opacity: 0.15; transform: scale(1); }
        }

        @keyframes glowPulse2 {
          0% { opacity: 0.1; transform: scale(1.05); }
          50% { opacity: 0.25; transform: scale(1); }
          100% { opacity: 0.1; transform: scale(1.05); }
        }
      `}</style>

      {/* Darken full area */}
      <div className="absolute inset-0"
        style={{ background: "rgba(8,6,24,0.55)" }} />

      {/* Darker gradient on left (text/cards) */}
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(to right, rgba(8,6,24,0.85) 0%, rgba(8,6,24,0.75) 40%, rgba(8,6,24,0.3) 70%, rgba(8,6,24,0) 100%)" }} />

      {/* Darken bottom */}
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(8,6,24,0.7) 0%, transparent 40%)" }} />

      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* Purple glow pulse — left */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: "15%",
          top: "30%",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)",
          animation: "glowPulse 4s ease-in-out infinite",
          filter: "blur(40px)",
        }}
      />

      {/* Gold glow pulse — center bottom */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: "45%",
          bottom: "10%",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,215,0,0.2) 0%, transparent 70%)",
          animation: "glowPulse2 5s ease-in-out infinite",
          filter: "blur(30px)",
        }}
      />

      {/* Purple glow pulse — right */}
      <div
        className="pointer-events-none absolute"
        style={{
          right: "10%",
          top: "20%",
          width: "250px",
          height: "250px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(83,74,183,0.3) 0%, transparent 70%)",
          animation: "glowPulse 6s ease-in-out infinite",
          filter: "blur(50px)",
        }}
      />

      {/* Particles */}
      <Particles />

      <div className="relative z-30 w-full flex items-center px-[3%] gap-6">
        <div className="flex w-[36%] min-w-[280px] shrink-0 flex-col items-center text-center pt-[12%] pb-[4%]">
          <div className="relative mb-20 flex flex-col items-center">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, rgba(83,74,183,0.25) 0%, transparent 70%)",
                filter: "blur(30px)",
                transform: "scale(2)",
              }}
            />
            {/* Left laurel */}
            <img
              src="/laurel-left.png"
              alt=""
              aria-hidden
              className="absolute -left-[50%] h-[95%] w-auto"
              style={{
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0.9,
              }}
            />
            {/* Right laurel */}
            <img
              src="/laurel-left.png"
              alt=""
              aria-hidden
              className="absolute -right-[50%] h-[95%] w-auto"
              style={{
                top: "50%",
                transform: "translateY(-50%) scaleX(-1)",
                opacity: 0.9,
              }}
            />

            {/* Heading copy */}
            <div className="mb-5 flex items-center justify-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#7F77DD]" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                {t("films.heroEyebrow")}
              </p>
            </div>
            <h2
              className="mb-6 font-black leading-tight tracking-tight"
              style={{
                fontSize: "clamp(2.4rem, 3.5vw, 3.4rem)",
                background: "linear-gradient(135deg, #ffffff 0%, #d4d0f5 60%, #AFA9EC 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Award Winners
              <br />
              Gallery
            </h2>
            <p className="text-sm leading-relaxed text-white/70">
              {t("films.heroDescLine1")}
              <br />
              {t("films.heroDescLine2")}
            </p>
          </div>

          {/* CTA outside laurels */}
          <Link
            href="/competition"
            className="inline-flex items-center gap-2 rounded-xl px-12 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.03]"
            style={{
              background: "linear-gradient(135deg, #534AB7 0%, #6B5FD4 100%)",
              boxShadow: "0 4px 20px rgba(83,74,183,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            {t("films.heroViewAllWinners")}
          </Link>
        </div>

        <div className="flex flex-1 items-end justify-between gap-3 px-4 pb-4 pt-[4%]">
          {[
            { labelKey: "films.heroTierGrand", color: "#FFD700", idx: 0 },
            { labelKey: "films.heroTierExcellence", color: "#C0C0C0", idx: 1 },
            { labelKey: "films.heroTierMerit", color: "#CD7F32", idx: 2 },
            { labelKey: "films.heroTierAudience", color: "#8b5cf6", idx: 3 },
          ].map((tier) => {
            const video = displayVideos[tier.idx] ?? null;
            return (
              <Link
                key={tier.labelKey}
                href={video ? "/watch/" + video.id : "/competition"}
                className="gradient-border-card-subtle relative mt-8 block shrink-0 cursor-pointer overflow-visible rounded-xl border transition-all duration-300 hover:scale-[1.03]"
                style={{
                  flex: "1 1 0",
                  minWidth: "0",
                  height: "auto",
                  aspectRatio: "222 / 422",
                  borderColor: hoveredCard === tier.idx ? glowBorders[tier.idx] : "rgba(255,255,255,0.06)",
                  background: "linear-gradient(to bottom, rgba(30,28,53,0.92), rgba(22,20,40,0.88))",
                  boxShadow: hoveredCard === tier.idx
                    ? `0 0 25px ${glowColors[tier.idx]}, 0 0 60px ${glowColors[tier.idx].replace("0.6", "0.2")}, inset 0 0 20px ${glowColors[tier.idx].replace("0.6", "0.05")}`
                    : "none",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={() => setHoveredCard(tier.idx)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="gradient-border-card-inner">
                  <div
                    className="absolute -top-5 left-1/2 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full"
                    style={{
                      background: tier.idx === 0
                        ? "radial-gradient(circle, #2a1e00 0%, #0f0900 100%)"
                        : tier.idx === 1
                          ? "radial-gradient(circle, #1a1a1a 0%, #0a0a0a 100%)"
                          : tier.idx === 2
                            ? "radial-gradient(circle, #1e1000 0%, #0a0800 100%)"
                            : "radial-gradient(circle, #130520 0%, #080210 100%)",
                      border: `1px solid ${tier.color}70`,
                      boxShadow: `0 0 8px ${tier.color}50`,
                    }}
                  >
                    <TrophyIcon color={tier.idx === 0 ? "#FFD700" : tier.idx === 1 ? "#C0C0C0" : tier.idx === 2 ? "#CD7F32" : "#8b5cf6"} />
                  </div>

                  <p
                    className="pb-1 pt-6 text-center text-sm font-extrabold"
                    style={{
                      color: "white",
                      textShadow: `0 0 8px ${tier.color}`,
                      mixBlendMode: "normal",
                    }}
                  >
                    {t(tier.labelKey)}
                  </p>

                  <div className="relative overflow-hidden px-3" style={{ height: "57%" }}>
                    {video?.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt="" className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#1a1547] to-[#0f0d24]" />
                    )}
                  </div>

                  <div className="px-3 pt-2 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="line-clamp-1 flex-1 text-sm font-bold text-white">
                        {video?.title ??
                          t(`films.heroMock${tier.idx + 1}Title`, MOCK_CARD_DATA[tier.idx].title)}
                      </h3>
                      <div className="relative flex shrink-0 items-center justify-center">
                        <img src="/genova-play1.png" alt="" className="h-[50px] w-[50px] object-contain opacity-50" aria-hidden />
                        <svg className="absolute h-[18px] w-[18px]" viewBox="0 0 24 24" fill="white" style={{ marginLeft: "1px" }} aria-hidden>
                          <polygon points="6,3 20,12 6,21" />
                        </svg>
                      </div>
                    </div>

                    <p className="mt-0.5 text-[10px] text-white/50">
                      {t("films.heroDirectorLabel")}{" "}
                      {video?.creatorName ?? video?.uploaderDisplayName ?? MOCK_CARD_DATA[tier.idx].director}
                    </p>

                    <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-white/30">
                      {video?.description?.trim() ||
                        t(`films.heroMock${tier.idx + 1}Desc`, MOCK_CARD_DATA[tier.idx].description)}
                    </p>
                  </div>

                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: `linear-gradient(to right, transparent, ${tier.color}, transparent)` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-10 bg-gradient-to-b from-transparent to-[#080618]" />

    </div>
  );
}

function VideoRow({ title, videos }: { title: string; videos: (Video & { award?: string | null })[] }) {
  const { t, locale } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [arrowHovered, setArrowHovered] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth;
    scrollRef.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  const onScroll = () => {
    if (!scrollRef.current) return;
    setAtStart(scrollRef.current.scrollLeft <= 0);
    setAtEnd(scrollRef.current.scrollLeft + scrollRef.current.offsetWidth >= scrollRef.current.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setAtEnd(el.scrollWidth <= el.offsetWidth);
  }, [videos]);

  if (videos.length === 0) return null;

  return (
    <div className="space-y-3 overflow-visible" style={{ position: "relative", zIndex: 0 }}>
      <h2 className="relative z-0 text-[20px] font-bold text-white tracking-tight">
        {title}
        <span className="ml-2 inline-block h-[3px] w-6 rounded-full bg-[#7F77DD] align-middle" />
      </h2>
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setArrowHovered(false);
        }}
      >
        {/* Cards scroll area with right margin */}
        <div className="mr-16">
          <div
            ref={scrollRef}
            onScroll={onScroll}
            style={{ overflowX: "auto", overflowY: "visible", paddingTop: "20px", paddingBottom: "20px", marginTop: "-20px", marginBottom: "-20px", paddingLeft: "0px", paddingRight: "60px", marginLeft: "0px", marginRight: "-60px" }}
            className="hide-scrollbar flex gap-4"
          >
            {videos.map((video, index) => {
              const creator = video.creatorName ?? video.uploaderDisplayName ?? t("video.creatorFallback");
              return (
                <Link
                  key={video.id}
                  href={"/watch/" + video.id}
                  className={
                    "gradient-border-card-subtle group/card relative shrink-0 rounded-xl transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(127,119,221,0.6),0_0_20px_rgba(127,119,221,0.3)] hover:scale-[1.03]"
                    + (arrowHovered ? " pointer-events-none" : "")
                  }
                  style={{ width: "calc((100% - 60px) / 6.9)", transformOrigin: "center center" }}
                >
                  <div className="gradient-border-card-inner relative w-full" style={{ aspectRatio: "3/4" }}>
                    {/* Thumbnail fills entire card */}
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#1a1547] to-[#0f0d24]" />
                    )}

                    {/* Bottom gradient overlay */}
                    <div
                      className="absolute inset-x-0 bottom-0 z-[1]"
                      style={{
                        height: "68%",
                        background: "linear-gradient(to top, rgba(8,6,24,1) 0%, rgba(8,6,24,0.9) 30%, rgba(8,6,24,0.4) 60%, transparent 100%)",
                        transform: "scaleY(1.04) scaleX(1.02)",
                        transformOrigin: "bottom center",
                        transition: "transform 0.25s ease",
                      }}
                    />

                    {/* Top-left genre badge */}
                    {video.genre && (
                      <div className="absolute top-1.5 left-2 z-[2]">
                        <span
                          className="text-[10px] font-semibold text-white/90 px-2 py-0.5 rounded"
                          style={{
                            background: "linear-gradient(135deg, rgba(83,74,183,0.7) 0%, rgba(39,33,92,0.5) 100%)",
                            backdropFilter: "blur(4px)",
                            border: "1px solid rgba(127,119,221,0.25)",
                          }}
                        >
                          {mainGenreLabel(video.genre, locale)}
                        </span>
                      </div>
                    )}

                    {/* Bottom text */}
                    <div
                      className="absolute bottom-0 left-0 right-0 px-4 pb-2 z-[2]"
                      style={{ paddingTop: "0px" }}
                    >
                      <h3 className="line-clamp-1 text-[14px] font-bold text-white">{video.title}</h3>
                      <p className="mt-0.5 text-[12px] text-white/70">{creator}</p>
                      {video.description && (
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/50">
                          {video.description}
                        </p>
                      )}
                      <div className="mt-1 flex items-center justify-between text-[11px] text-white/50">
                        <div className="flex items-center gap-2">
                          {video.viewCount != null && (
                            <span>
                              {video.viewCount >= 1000
                                ? `${(video.viewCount / 1000).toFixed(1)}K ${t("feed.views")}`
                                : `${video.viewCount} ${t("feed.views")}`}
                            </span>
                          )}
                          {video.viewCount != null && video.createdAt && (
                            <span className="text-white/20">·</span>
                          )}
                          {video.createdAt && (
                            <span>{formatUploadedRelative(video.createdAt, locale)}</span>
                          )}
                        </div>
                        {/* Play affordance — right */}
                        <div className="opacity-0 group-hover/card:opacity-100 transition-all duration-300 flex items-center justify-center shrink-0">
                          <div className="relative flex items-center justify-center">
                            <img
                              src="/genova-play1.png"
                              alt="play"
                              className="h-[38px] w-[38px] object-contain opacity-50"
                            />
                            <svg
                              className="absolute h-[14px] w-[14px]"
                              viewBox="0 0 24 24"
                              fill="white"
                              style={{ marginLeft: "1px" }}
                            >
                              <polygon points="6,3 20,12 6,21" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        {/* Left click zone */}
        {!atStart && (
          <button
            type="button"
            onClick={() => scroll("left")}
            onMouseEnter={() => setArrowHovered(true)}
            onMouseLeave={() => setArrowHovered(false)}
            className={cn(
              "absolute left-0 top-0 bottom-0 z-[100]",
              "w-28",
              "flex items-center justify-center",
              "transition-all duration-200 group/arrow",
              isHovered ? "opacity-100" : "opacity-0",
              isHovered ? "pointer-events-auto" : "pointer-events-none"
            )}
            style={{
              background: "linear-gradient(to right, rgba(8,6,24,0.85) 0%, rgba(8,6,24,0.4) 60%, transparent 100%)"
            }}
          >
            <div className="flex h-full w-full items-center justify-center transition-all duration-200 group-hover/arrow:bg-black/20">
              <ChevronLeft
                size={50}
                className="text-white/70 group-hover/arrow:text-white transition-all duration-200 group-hover/arrow:scale-110"
                strokeWidth={1.5}
              />
            </div>
          </button>
        )}

        {/* Right click zone */}
        {!atEnd && (
          <button
            type="button"
            onClick={() => scroll("right")}
            onMouseEnter={() => setArrowHovered(true)}
            onMouseLeave={() => setArrowHovered(false)}
            className={cn(
              "absolute right-0 top-0 bottom-0 z-[100]",
              "w-28",
              "flex items-center justify-center",
              "transition-all duration-200 group/arrow",
              isHovered ? "opacity-100" : "opacity-0",
              isHovered ? "pointer-events-auto" : "pointer-events-none"
            )}
            style={{
              background: "linear-gradient(to left, rgba(8,6,24,0.85) 0%, rgba(8,6,24,0.4) 60%, transparent 100%)"
            }}
          >
            <div className="flex h-full w-full items-center justify-center transition-all duration-200 group-hover/arrow:bg-black/20">
              <ChevronRight
                size={50}
                className="text-white/70 group-hover/arrow:text-white transition-all duration-200 group-hover/arrow:scale-110"
                strokeWidth={1.5}
              />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

export function FilmsPageClient({
  originals,
  awardWinners,
  editorsPicks,
  genreSpotlight,
  allVideos,
}: {
  originals: Video[];
  awardWinners: (Video & { award?: string | null })[];
  editorsPicks: Video[];
  genreSpotlight: { genreKey: string; label: string; picks: Video[] }[];
  allVideos: Video[];
}) {
  const { t, locale } = useI18n();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [seriesExpanded, setSeriesExpanded] = useState(false);
  const [awardsExpanded, setAwardsExpanded] = useState(false);
  useEffect(() => {
    return addWindowCustomListener<string>("films-genre-select", (key) => {
      setSelectedGenres(key === "all" ? [] : [key]);

      setTimeout(() => {
        const el = document.getElementById("films-top10");
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 50);
    });
  }, []);

  const isAllSelected = selectedGenres.length === 0;

  const toggleGenre = (key: string) => {
    if (key === "all") {
      setSelectedGenres([]);
      return;
    }
    setSelectedGenres([key]);
  };

  const handleGenreClick = (key: string) => {
    toggleGenre(key);
    setTimeout(() => {
      const el = document.getElementById("films-genre-section");
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, 50);
  };

  const getTop10 = (videos: Video[], genreKey?: string) => {
    const filtered = genreKey
      ? videos.filter((v) => {
          const normalized = normalizeToMainGenre(v.genre);
          return normalized === genreKey;
        })
      : videos;
    return [...filtered]
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, 10);
  };

  const allVideosFlat = [
    ...allVideos,
    ...originals,
    ...awardWinners,
    ...editorsPicks,
    ...genreSpotlight.flatMap((g) => g.picks),
  ].filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i);

  const filteredVideos = useMemo(() => {
    if (isAllSelected) return allVideosFlat;
    return allVideosFlat.filter((v) => {
      const normalized = normalizeToMainGenre(v.genre);
      return selectedGenres.includes(normalized);
    });
  }, [isAllSelected, selectedGenres, allVideosFlat]);

  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "#080618" }}
      />

      {/* Hero Banner - full width */}
      <AnimateIn delay={0.05}>
        <HeroBanner awardWinners={awardWinners} allVideos={allVideosFlat} />
      </AnimateIn>

      <div className="relative mx-auto max-w-[1680px] px-12 pb-24 pt-10 text-white space-y-6">
        {/* Continue Watching */}
        <div id="films-continue" className="scroll-mt-20">
          <ContinueWatching allVideos={allVideos} />
        </div>

        <AnimateIn delay={0.1}>
          <div id="films-genre-section" className="space-y-3 scroll-mt-20">
            <h2 className="text-[20px] font-bold text-white tracking-tight">
              {t("films.browseByGenre")}
              <span className="ml-2 inline-block h-[3px] w-6 rounded-full bg-[#7F77DD] align-middle" />
            </h2>
            <div className="grid grid-cols-2 gap-3 py-3 md:grid-cols-3 xl:grid-cols-6">
              {[{ key: "all" as const }, ...MAIN_GENRE_KEYS.map((k) => ({ key: k }))].map((tab) => {
                const mood = {
                  all: { emoji: "✦", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80" },
                  film: { emoji: "🎬", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80" },
                  animation: { emoji: "✨", image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80" },
                  music: { emoji: "🎵", image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80" },
                  daily: { emoji: "🌿", image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80" },
                  art: { emoji: "🎨", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80" },
                }[tab.key];

                const isActive = tab.key === "all" ? isAllSelected : selectedGenres.includes(tab.key);
                const titleCount = tab.key === "all"
                  ? allVideosFlat.length
                  : allVideosFlat.filter((v) => normalizeToMainGenre(v.genre) === tab.key).length;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleGenreClick(tab.key)}
                    className={cn(
                      "group relative h-[100px] w-full overflow-hidden rounded-2xl border text-left transition-all duration-300",
                      isActive
                        ? "border-[#7F77DD]/80 ring-1 ring-[#7F77DD]/60 shadow-lg shadow-[#534AB7]/30 scale-[1.02]"
                        : "border-white/10 hover:border-white/25 hover:scale-[1.01]"
                    )}
                  >
                    <img src={mood.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div
                      className="absolute inset-0 rounded-[inherit] pointer-events-none"
                      style={{ background: "rgba(8,6,24,0.45)" }}
                    />
                    <div
                      className="absolute inset-0 rounded-[inherit] pointer-events-none"
                      style={{
                        background: "radial-gradient(ellipse at 0% 0%, rgba(8,6,24,0.85) 0%, transparent 60%)",
                      }}
                    />
                    <div
                      className="absolute inset-0 rounded-[inherit] pointer-events-none"
                      style={{
                        background: "linear-gradient(to top, rgba(8,6,24,0.7) 0%, transparent 50%)",
                      }}
                    />

                    <div className="relative z-10 flex h-full flex-col justify-between p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{mood.emoji}</span>
                        <span className="text-sm font-bold text-white">
                          {tab.key === "all" ? t("common.all") : mainGenreLabel(tab.key, locale)}
                        </span>
                      </div>
                      <span className="text-[11px] text-white/65">
                        {t("films.titleCount").replace("{n}", String(titleCount))}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </AnimateIn>

        {/* Content rows */}
        <div className="space-y-10">

          {/* Top 10 sections — one per selected genre, or overall if all */}
          {isAllSelected ? (
            <AnimateIn delay={0.15}>
              <div id="films-top10" className="scroll-mt-20">
                <VideoRow title={t("films.top10Today", "Top 10 Today")} videos={getTop10(filteredVideos)} />
              </div>
            </AnimateIn>
          ) : (
            selectedGenres.map((genreKey, idx) => {
              const tabLabel = mainGenreLabel(genreKey, locale);
              const top10 = getTop10(filteredVideos, genreKey);
              if (top10.length === 0) return null;
              return (
                <AnimateIn key={genreKey} delay={0.15 + idx * 0.05}>
                  <div id={idx === 0 ? "films-top10" : undefined} className={idx === 0 ? "scroll-mt-20" : undefined}>
                    <VideoRow
                      title={t("films.top10InGenre").replace("{genre}", tabLabel)}
                      videos={top10}
                    />
                  </div>
                </AnimateIn>
              );
            })
          )}

          {/* New Content */}
          <AnimateIn delay={0.2}>
            <VideoRow
              title={
                isAllSelected
                  ? t("films.newArrivals", "New Arrivals")
                  : t("films.newGenreArrivals").replace(
                      "{genre}",
                      mainGenreLabel(selectedGenres[0], locale),
                    )
              }
              videos={[...filteredVideos].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              ).slice(0, 15)}
            />
          </AnimateIn>

          {/* Today's Picks */}
          <AnimateIn delay={0.25}>
            <VideoRow
              title={
                isAllSelected
                  ? t("films.todaysRecommendations", "Today's Recommendations")
                  : t("films.topGenrePicks").replace(
                      "{genre}",
                      mainGenreLabel(selectedGenres[0], locale),
                    )
              }
              videos={[...filteredVideos]
                .sort((a, b) => stableHash(a.id) - stableHash(b.id))
                .slice(0, 15)}
            />
          </AnimateIn>

          {/* Genre rows — filtered by selection */}
          {genreSpotlight
            .filter(({ genreKey }) => isAllSelected || selectedGenres.includes(genreKey))
            .map(({ genreKey, picks }, idx) =>
              picks.length > 0 ? (
                <AnimateIn key={genreKey} delay={0.3 + idx * 0.04}>
                  <div id={"films-spotlight-" + genreKey} className="scroll-mt-20">
                    <VideoRow title={mainGenreLabel(genreKey, locale)} videos={picks} />
                  </div>
                </AnimateIn>
              ) : null
            )}
        </div>

        {/* Series Section - Coming Soon */}
        <div id="films-series" className="scroll-mt-20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] font-bold text-white tracking-tight">
                {t("films.sectionSeries")}
                <span className="ml-2 inline-block h-[3px] w-6 rounded-full bg-[#7F77DD] align-middle" />
              </h2>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#7F77DD]/60 border border-[#7F77DD]/20 rounded-full px-3 py-1">
                {t("films.comingSoonTitle")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSeriesExpanded(!seriesExpanded)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              {seriesExpanded ? t("films.expandCollapse") : t("films.expandPreview")}
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 transition-transform duration-300 ${seriesExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* Expandable content */}
          <div
            className="overflow-hidden transition-all duration-500 ease-in-out"
            style={{ maxHeight: seriesExpanded ? "400px" : "0px", opacity: seriesExpanded ? 1 : 0 }}
          >
            <div className="space-y-4 pt-1">
              {/* Sub tabs */}
              <div className="flex gap-3">
                {(
                  [
                    ["popular", "films.seriesTabPopular"],
                    ["latest", "films.seriesTabLatest"],
                    ["completed", "films.seriesTabCompleted"],
                    ["new", "films.seriesTabNew"],
                  ] as const
                ).map(([tabKey, labelKey]) => (
                  <div
                    key={tabKey}
                    className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/30 cursor-not-allowed"
                  >
                    {t(labelKey)}
                  </div>
                ))}
              </div>

              {/* Locked placeholder cards */}
              <div className="flex gap-4">
                {MOCK_SERIES_ROWS.map((series, i) => (
                  <div
                    key={i}
                    className="relative shrink-0 rounded-xl overflow-hidden cursor-not-allowed"
                    style={{ width: "calc((100% - 60px) / 5.2)" }}
                  >
                    {/* Thumbnail - blurred */}
                    <div className="relative aspect-video w-full overflow-hidden">
                      <img
                        src={series.thumbnail}
                        alt=""
                        className="h-full w-full object-cover"
                        style={{ filter: "blur(2px) brightness(0.4)" }}
                      />
                      {/* Lock icon center */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#7F77DD]/40 bg-[#0f0d24]/80">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#7F77DD]" fill="currentColor">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Info - faded */}
                    <div className="p-2 bg-[#0f0d24]" style={{ opacity: 0.4 }}>
                      <h3 className="line-clamp-1 text-[12px] font-medium text-white">{series.title}</h3>
                      <p className="mt-0.5 text-[11px] text-white/40">
                        {mockSeriesGenreLabel(series, locale)} ·{" "}
                        {t("films.episodesCount").replace("{n}", String(series.episodes))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div id="films-awards" className="scroll-mt-20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] font-bold text-white tracking-tight">
                {t("films.awardWinners")}
                <span className="ml-2 inline-block h-[3px] w-6 rounded-full bg-[#7F77DD] align-middle" />
              </h2>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#7F77DD]/60 border border-[#7F77DD]/20 rounded-full px-3 py-1">
                {t("films.comingSoonTitle")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAwardsExpanded(!awardsExpanded)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              {awardsExpanded ? t("films.expandCollapse") : t("films.expandPreview")}
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 transition-transform duration-300 ${awardsExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          <div
            className="overflow-hidden transition-all duration-500 ease-in-out"
            style={{
              maxHeight: awardsExpanded ? "400px" : "0px",
              opacity: awardsExpanded ? 1 : 0
            }}
          >
            <div className="flex gap-4 pt-1">
              {MOCK_AWARD_ROWS.map((award, i) => (
                <div
                  key={i}
                  className="relative shrink-0 rounded-xl overflow-hidden cursor-not-allowed"
                  style={{ width: "calc((100% - 60px) / 5.2)" }}
                >
                  <div className="relative aspect-video w-full overflow-hidden">
                    <img
                      src={award.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                      style={{ filter: "blur(2px) brightness(0.4)" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full border bg-[#0f0d24]/80"
                        style={{ borderColor: award.color + "60" }}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill={award.color}>
                          <path d="M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V18H8v2h8v-2h-3v-2.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 bg-[#0f0d24]" style={{ opacity: 0.4 }}>
                    <h3 className="line-clamp-1 text-[12px] font-medium text-white">{award.title}</h3>
                    <p className="mt-0.5 text-[11px]" style={{ color: award.color + "99" }}>
                      {t(award.labelKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
