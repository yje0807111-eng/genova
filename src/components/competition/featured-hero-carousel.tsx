"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { useUploadModal } from "@/components/upload/upload-modal-context";

type Competition = {
  id: string;
  title: string;
  title_ko?: string | null;
  title_en?: string | null;
  title_ja?: string | null;
  description: string | null;
  thumbnail_url: string | null;
  deadline: string;
  prize_info: string;
  prize_info_ko?: string | null;
  prize_info_en?: string | null;
  prize_info_ja?: string | null;
  sponsor: string | null;
  genre: string;
  status: string;
};

interface Props {
  competitions: Competition[];
}

const AUTO_SLIDE_INTERVAL = 5000;
const HERO_HEIGHT = 440;

export function FeaturedHeroCarousel({ competitions }: Props) {
  const { t, locale } = useI18n();
  const { open: openUploadModal } = useUploadModal();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const totalSlides = competitions.length;

  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, [totalSlides, isPaused]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  if (totalSlides === 0) return null;

  return (
    <section
      className="relative w-full overflow-hidden border-b border-white/[0.06] bg-[#0a0a0a]"
      style={{ height: `${HERO_HEIGHT}px` }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {competitions.map((c, i) => {
        const isActive = i === currentIndex;
        const title = locale === "ko"
          ? (c.title_ko ?? c.title)
          : locale === "ja"
            ? (c.title_ja ?? c.title)
            : (c.title_en ?? c.title);
        const prize = locale === "ko"
          ? (c.prize_info_ko ?? c.prize_info)
          : locale === "ja"
            ? (c.prize_info_ja ?? c.prize_info)
            : (c.prize_info_en ?? c.prize_info);

        const deadline = new Date(c.deadline);
        const now = new Date();
        const dDay = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return (
          <div
            key={c.id}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{
              opacity: isActive ? 1 : 0,
              pointerEvents: isActive ? "auto" : "none",
            }}
          >
            {c.thumbnail_url && (
              <Image
                src={c.thumbnail_url}
                alt=""
                fill
                // LCP candidate on /competition — the first slide is the
                // initial above-the-fold image, so prioritize it.  Other
                // slides lazy-load.
                priority={i === 0}
                // Hero spans full viewport width on every breakpoint.
                sizes="100vw"
                className="object-cover"
              />
            )}

            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.75) 30%, rgba(10,10,10,0.4) 55%, rgba(10,10,10,0.1) 80%, transparent 95%)",
              }}
            />

            <div
              className="absolute inset-x-0 bottom-0 h-1/3"
              style={{
                background: "linear-gradient(180deg, transparent 0%, rgba(10,10,10,0.9) 100%)",
              }}
            />

            <div className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-center px-8 sm:px-12 lg:px-16">
              <div className="flex max-w-[640px] flex-col gap-5">

                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/90 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {c.sponsor
                    ? t("competition.sponsoredBy", `SPONSORED BY ${c.sponsor}`)
                    : t("competition.featured", "FEATURED CONTEST")}
                </div>

                <h1
                  className="text-[32px] font-black leading-[1.05] tracking-[-0.02em] text-white sm:text-[40px] md:text-[48px] lg:text-[52px]"
                  style={{ textShadow: "0 2px 16px rgba(0,0,0,0.6)" }}
                >
                  {title}
                </h1>

                {c.description && (
                  <p
                    className="max-w-[540px] text-[14px] leading-relaxed text-white/70 md:text-[15px]"
                    style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
                  >
                    {c.description}
                  </p>
                )}

                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                  <div className="inline-flex items-baseline gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300/80">
                      ★ {t("competition.prize", "PRIZE")}
                    </span>
                    <span className="text-[18px] font-bold tabular-nums text-amber-300">
                      {prize}
                    </span>
                  </div>

                  {dDay > 0 && (
                    <>
                      <span className="text-white/15">·</span>
                      <div className="inline-flex items-baseline gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#AFA9EC]/80">
                          ◉ {t("competition.deadline", "DEADLINE")}
                        </span>
                        <span className="text-[18px] font-bold tabular-nums text-white">
                          D-{dDay}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <Link
                    href={`/competition/${c.id}`}
                    className="group inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-[13px] font-bold text-[#0a0a0a] transition hover:bg-white/90"
                  >
                    {t("competition.viewDetails", "자세히 보기")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => openUploadModal({ competitionId: c.id })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.15] bg-white/[0.03] px-5 py-2.5 text-[13px] font-semibold text-white/85 backdrop-blur-md transition hover:border-white/[0.3] hover:bg-white/[0.08] hover:text-white"
                  >
                    {t("competition.joinNow", "지금 참여하기")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {totalSlides > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.1] bg-[#0a0a0a]/60 text-white/70 backdrop-blur-md transition hover:border-white/[0.25] hover:text-white sm:flex"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.1] bg-[#0a0a0a]/60 text-white/70 backdrop-blur-md transition hover:border-white/[0.25] hover:text-white sm:flex"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
            {competitions.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
