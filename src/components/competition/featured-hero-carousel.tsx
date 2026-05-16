"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Star, Trophy, Clock } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { useUploadModal } from "@/components/upload/upload-modal-context";

type Competition = {
  id: string;
  title: string;
  title_ko?: string | null;
  title_en?: string | null;
  title_ja?: string | null;
  description: string | null;
  description_ko?: string | null;
  description_en?: string | null;
  description_ja?: string | null;
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
        const description = locale === "ko"
          ? (c.description_ko ?? c.description)
          : locale === "ja"
            ? (c.description_ja ?? c.description)
            : (c.description_en ?? c.description);

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

            <div className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-center px-6 sm:px-12 lg:px-16">
              <div className="flex max-w-[600px] flex-col gap-4">

                {/* 분류 배지 — 브랜드 퍼플 글래스, pulse 제거
                    (featured 는 상태가 아니라 분류) */}
                <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#7F77DD]/25 bg-[#7F77DD]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC] backdrop-blur-md">
                  <Star className="h-3 w-3 fill-current" />
                  {c.sponsor
                    ? `${t("competition.sponsoredBy", "Hosted by")} · ${c.sponsor}`
                    : t("competition.featured", "FEATURED")}
                </div>

                {/* 래퍼: 2줄분 min-h(em 이라 반응형 폰트 자동 대응)
                    + 수직 가운데.  제목이 1줄/2줄 어느 쪽이든 캐러셀
                    슬라이드 전환 시 아래 상금/CTA 위치 고정.
                    line-clamp 과 flex 는 같은 요소서 충돌하므로
                    분리(래퍼=flex, h1=line-clamp). */}
                <div className="flex min-h-[2.3em] flex-col justify-center">
                  <h1
                    // break-keep: 한국어 어절 단위 줄바꿈(글자 깨짐 방지)
                    className="line-clamp-2 break-keep text-[32px] font-black leading-[1.12] tracking-[-0.02em] text-white sm:text-[42px] md:text-[50px] lg:text-[56px]"
                    style={{ textShadow: "0 2px 16px rgba(0,0,0,0.65)" }}
                  >
                    {title}
                  </h1>
                </div>

                {description && (
                  <p
                    className="line-clamp-1 max-w-[520px] text-[13px] leading-relaxed text-white/55"
                    style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
                  >
                    {description}
                  </p>
                )}

                {/* 상금 — 히어로 최강조.  라벨 작게, 금액 크게. */}
                <div className="mt-1 flex flex-wrap items-end gap-x-7 gap-y-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                      <Trophy className="h-3 w-3 text-amber-300/80" />
                      {t("competition.prize", "PRIZE")}
                    </span>
                    <span
                      className="text-[28px] font-black leading-none tabular-nums text-amber-300 sm:text-[34px]"
                      style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
                    >
                      {prize}
                    </span>
                  </div>

                  {dDay > 0 && (
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                        <Clock className="h-3 w-3" />
                        {t("competition.deadline", "DEADLINE")}
                      </span>
                      <span
                        className={`w-fit rounded-md px-2 py-0.5 text-[18px] font-black tabular-nums ${
                          dDay <= 3
                            ? "bg-red-500/20 text-red-300"
                            : "bg-white/[0.06] text-white"
                        }`}
                      >
                        D-{dDay}
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA — 참여가 핵심 행동이라 primary(브랜드
                    그라데이션) 강조, 상세는 보조. */}
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => openUploadModal({ competitionId: c.id })}
                    className="group inline-flex items-center gap-1.5 rounded-full px-6 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, rgba(107,95,212,0.95) 0%, rgba(83,74,183,0.85) 50%, rgba(63,54,163,0.8) 100%)",
                      border: "1px solid rgba(175,169,236,0.3)",
                    }}
                  >
                    {t("competition.joinNow", "지금 참여하기")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                  <Link
                    href={`/competition/${c.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.15] bg-white/[0.03] px-5 py-2.5 text-[13px] font-semibold text-white/80 backdrop-blur-md transition hover:border-white/[0.3] hover:bg-white/[0.08] hover:text-white"
                  >
                    {t("competition.viewDetails", "자세히 보기")}
                  </Link>
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
