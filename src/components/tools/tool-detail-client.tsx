"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { VideoCard } from "@/components/video/video-card";
import { useI18n } from "@/components/genova/language-provider";
import type { Video } from "@/lib/types";

type Creator = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  videoCount: number;
  totalViews: number;
  recentThumbnails: (string | null)[];
};

type Props = {
  toolName: string;
  videos: Video[];
  category?: string;
  totalViews: number;
  creatorCount: number;
  heroThumbnail: string | null;
  creators: Creator[];
  totalCreatorCount: number;
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function ToolDetailClient({
  toolName,
  videos,
  category,
  totalViews,
  creatorCount,
  heroThumbnail,
  creators,
  totalCreatorCount,
}: Props) {
  const { t } = useI18n();
  const initials = toolName.slice(0, 2).toUpperCase();
  const totalCount = videos.length;

  return (
    <div className="-mt-16 min-h-screen bg-[#0a0a0a]">
      {/* Cinematic Hero */}
      <div className="relative pt-16">
        {/* Background image with heavy blur and dark overlay */}
        {heroThumbnail && (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={heroThumbnail}
              alt=""
              className="h-full w-full scale-110 object-cover"
              style={{ filter: "blur(40px) brightness(0.7) saturate(1.2)" }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.55) 15%, rgba(10,10,10,0.4) 40%, rgba(10,10,10,0.75) 75%, rgba(10,10,10,1) 100%)",
              }}
            />
          </div>
        )}

        {/* Ambient orb (Films 히어로 패턴) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full"
            style={{
              background: "radial-gradient(ellipse, var(--border-default) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute right-0 top-40 h-72 w-72 rounded-full"
            style={{
              background: "radial-gradient(circle, var(--tint-accent-15) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        </div>

        {/* 상단 shimmer 라인 (공모전 상세 패턴) */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-16 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(127,119,221,0.5) 30%, rgba(175,169,236,0.3) 60%, transparent)",
          }}
        />

        {/* Grain texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Subtle bottom fade to next section */}
        <div
          className="pointer-events-none absolute -bottom-1 left-0 right-0 h-32"
          style={{
            background: "linear-gradient(180deg, transparent 0%, rgba(10,10,10,1) 100%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-8">
          <AnimateIn delay={0.05}>
          {/* Back link */}
          <Link
            href="/"
            className="mb-12 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-white/50 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("toolDetail.backHome", "Home")}
          </Link>

          {/* Hero content */}
          <div className="flex items-start justify-between gap-8">
            <div className="flex min-w-0 items-start gap-8">
              <div
                className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl text-[36px] font-black text-white ring-1 ring-white/[0.12]"
                style={{
                  background: "linear-gradient(135deg, rgba(83,74,183,0.5) 0%, rgba(127,119,221,0.25) 100%)",
                  boxShadow: "0 12px 48px rgba(83,74,183,0.35), 0 0 0 1px rgba(127,119,221,0.2) inset",
                }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1 pt-3">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#7F77DD]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#AFA9EC]">
                    AI Tool
                  </span>
                  {category && (
                    <>
                      <span className="text-white/20">·</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">
                        {category}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="text-[48px] font-black leading-[1.02] tracking-[-0.02em] text-white">
                  {toolName}
                </h1>
                <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-white/55">
                  {t(
                    "toolDetail.tagline",
                    "Discover works made with {tool} by Genova creators.",
                  ).replace("{tool}", toolName)}
                </p>
              </div>
            </div>

            {/* Live indicator */}
            <div className="hidden shrink-0 items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1.5 lg:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                Active
              </span>
            </div>
          </div>

          {/* Stats bar */}
          <div
            className="mt-12 grid grid-cols-3 gap-4 rounded-2xl border border-white/[0.1] p-6 backdrop-blur-xl"
            style={{
              background:
                "linear-gradient(135deg, var(--tint-purple-08) 0%, rgba(83,74,183,0.04) 50%, rgba(10,10,10,0.6) 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <div className="border-r border-white/[0.06] px-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                {t("toolDetail.statVideos", "Videos")}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-[32px] font-black leading-none text-white">{formatNumber(totalCount)}</p>
                <span className="text-[11px] font-medium text-white/35">films</span>
              </div>
            </div>
            <div className="border-r border-white/[0.06] px-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                {t("toolDetail.statTotalViews", "Total Views")}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-[32px] font-black leading-none text-white">{formatNumber(totalViews)}</p>
                <span className="text-[11px] font-medium text-white/35">views</span>
              </div>
            </div>
            <div className="px-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                {t("toolDetail.statCreators", "Creators")}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-[32px] font-black leading-none text-white">{formatNumber(creatorCount)}</p>
                <span className="text-[11px] font-medium text-white/35">creators</span>
              </div>
            </div>
          </div>
          </AnimateIn>
        </div>
      </div>

      {/* Creators section */}
      {creators.length > 0 && (
        <div className="mx-auto max-w-7xl px-6 pb-12 pt-2">
          <AnimateIn delay={0.06}>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] text-[#7F77DD]">✦</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-accent-primary opacity-75">
                    Creators
                  </p>
                </div>
                <h2 className="typo-section-title">
                  {t("toolDetail.creatorsHeading", "Creators Using This Tool")}
                </h2>
              </div>
              <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-bold text-white/55">
                {totalCreatorCount > 12 ? `Top 12 of ${totalCreatorCount}` : `${totalCreatorCount} creators`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {creators.map((creator) => (
                <Link
                  key={creator.id}
                  href={`/profile/${creator.id}`}
                  className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/[0.1] p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#7F77DD]/30 hover:shadow-[0_0_32px_rgba(127,119,221,0.25)]"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--tint-purple-08) 0%, rgba(83,74,183,0.04) 50%, rgba(10,10,10,0.6) 100%)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.2)",
                  }}
                >
                  {/* Top row: avatar + name + count */}
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="h-12 w-12 overflow-hidden rounded-full ring-1 ring-white/10 transition-all duration-300 group-hover:ring-[#7F77DD]/40">
                        <img
                          src={creator.avatarUrl || "/default-avatar.png"}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-white transition group-hover:text-[#AFA9EC]">
                        {creator.displayName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/35">
                        <span className="font-semibold text-[#AFA9EC]">{creator.videoCount}</span>
                        <span>films</span>
                        <span className="text-white/20">·</span>
                        <span>{formatNumber(creator.totalViews)} views</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent video thumbnails strip */}
                  {creator.recentThumbnails.length > 0 && (
                    <div className="grid grid-cols-3 gap-1">
                      {creator.recentThumbnails.slice(0, 3).map((thumb, i) => (
                        <div
                          key={i}
                          className="relative aspect-video overflow-hidden rounded-md bg-white/[0.04] ring-1 ring-white/[0.06]"
                        >
                          {thumb ? (
                            <img
                              src={thumb}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Sparkles className="h-3 w-3 text-white/15" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* View profile hint (hover only) */}
                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 text-[10px]">
                    <span className="font-bold uppercase tracking-[0.15em] text-white/30">
                      Profile
                    </span>
                    <span className="text-white/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#AFA9EC]">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </AnimateIn>
        </div>
      )}

      {/* Videos section */}
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-2">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="text-[10px] text-[#7F77DD]">✦</span>
              <p
                className="text-[10px] font-black uppercase tracking-[0.22em]"
                style={{ color: "#7F77DD", opacity: 0.75 }}
              >
                Filmography
              </p>
            </div>
            <h2
              className="text-[26px] font-black tracking-tight text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              {t("toolDetail.videosHeading", "Videos Using This Tool")}
            </h2>
          </div>
          <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-bold text-white/55">
            {totalCount} films
          </span>
        </div>

        <AnimateIn delay={0.08}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </AnimateIn>
      </div>
    </div>
  );
}
