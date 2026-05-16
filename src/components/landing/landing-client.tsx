"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, Trophy, Clapperboard, Globe2, Sparkles } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { AnimateIn } from "@/components/animate-in";
import { cn } from "@/lib/utils/cn";

type FeaturedCompetition = {
  id: string;
  title: string;
  genre?: string | null;
  sponsor?: string | null;
  thumbnailUrl?: string | null;
  prizeInfo?: string | null;
  deadline?: string | null;
};

type TrendingVideo = {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
};

export function LandingClient({
  trendingVideos,
  featuredCompetitions,
}: {
  trendingVideos: TrendingVideo[];
  featuredCompetitions: FeaturedCompetition[];
}) {
  const { locale, setLocale, t } = useI18n();
  const dateLocale = locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "ko-KR";

  const fmtDate = (d?: string | null) => {
    if (!d) return null;
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toLocaleDateString(dateLocale, { year: "numeric", month: "short", day: "numeric" });
  };

  // 프로필 기본 배너(퍼플 네뷸라)를 히어로 배경으로 — 단색 배경 탈피.
  const heroBackdrop = "/default-banner.png";
  const marquee = trendingVideos.filter((v) => v.thumbnailUrl).slice(0, 10);
  const marqueeLoop = marquee.length > 0 ? [...marquee, ...marquee] : [];

  const features = [
    {
      Icon: Clapperboard,
      title: t("landing.feat1Title", "AI 영화 스트리밍"),
      desc: t("landing.feat1Desc", "전 세계 크리에이터의 AI 생성 영화를 한곳에서 감상하세요."),
    },
    {
      Icon: Trophy,
      title: t("landing.feat2Title", "상금 공모전"),
      desc: t("landing.feat2Desc", "매월 열리는 공모전에 출품하고 상금과 데뷔 기회를 잡으세요."),
    },
    {
      Icon: Globe2,
      title: t("landing.feat3Title", "글로벌 무대"),
      desc: t("landing.feat3Desc", "당신의 작품을 전 세계 관객과 심사위원에게 선보이세요."),
    },
  ];

  const langs = ["en", "ko", "ja"] as const;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0a0a] text-white">
      {/* ── Nav ─────────────────────────────── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3 sm:px-8">
          <Link href="/landing" className="flex items-center gap-2">
            <span className="text-[18px] font-black tracking-tight">Genova</span>
            <span className="rounded-full border border-[#7F77DD]/30 bg-[#534AB7]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#AFA9EC]">
              Beta
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] p-1">
              {langs.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors",
                    locale === l ? "bg-white text-[#0a0a0a]" : "text-white/55 hover:text-white",
                  )}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <Link
              href="/"
              className="hidden px-3 py-1.5 text-[12px] font-semibold text-white/55 transition hover:text-white sm:block"
            >
              {t("landing.navEnter", "둘러보기")}
            </Link>
            <Link
              href="/auth"
              className="rounded-full bg-white px-4 py-1.5 text-[12px] font-bold text-[#0a0a0a] transition hover:bg-white/90"
            >
              {t("landing.navStart", "시작하기")}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Cinematic hero ───────────────────── */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden">
        {/* backdrop — 실제 인기작 키아트 + 슬로우 줌 */}
        <div className="absolute inset-0 -z-10">
          {heroBackdrop ? (
            <Image
              src={heroBackdrop}
              alt=""
              fill
              priority
              sizes="100vw"
              className="hero-kenburns object-cover"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: "linear-gradient(135deg, rgba(83,74,183,0.30) 0%, #0a0a0a 70%)" }}
            />
          )}
          {/* 시네마틱 스크림 — 좌측 텍스트 가독성 + 하단/상단 융합 + 비네트 */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, #0a0a0a 0%, rgba(10,10,10,0.82) 32%, rgba(10,10,10,0.4) 62%, transparent 90%)" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(10,10,10,0.7) 0%, transparent 22%, transparent 55%, rgba(10,10,10,0.85) 86%, #0a0a0a 100%)" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(120% 80% at 50% 35%, transparent 50%, rgba(0,0,0,0.5) 100%)" }}
          />
          <div
            className="pointer-events-none absolute -left-40 bottom-0 h-[80%] w-[60%]"
            style={{
              background: "radial-gradient(circle at 25% 75%, rgba(83,74,183,0.18) 0%, transparent 70%)",
              filter: "blur(50px)",
            }}
          />
        </div>

        <div className="mx-auto w-full max-w-[1280px] px-4 py-24 sm:px-8">
          <AnimateIn delay={0.05} className="max-w-[680px]">
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#AFA9EC] backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              {t("landing.eyebrow", "The Home of AI Filmmakers")}
            </span>
            <h1 className="bg-gradient-to-br from-white via-white to-[#AFA9EC] bg-clip-text pb-1 text-[40px] font-black leading-[1.05] tracking-[-0.035em] text-transparent sm:text-[72px]">
              {t("landing.heroTitle", "AI가 만드는\n영화의 시대")}
            </h1>
            <p className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-white/65 sm:text-[17px]">
              {t(
                "landing.heroSub",
                "전 세계 AI 크리에이터들이 작품을 스트리밍하고, 공모전에서 경쟁하는 영화 플랫폼.",
              )}
            </p>
            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
              <Link
                href="/"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[14px] font-bold text-[#0a0a0a] transition hover:bg-white/90"
              >
                <Play className="h-4 w-4 fill-current" />
                {t("landing.heroCtaPrimary", "지금 감상하기")}
              </Link>
              <Link
                href="/competition"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-[14px] font-bold text-white backdrop-blur-xl transition hover:border-[#7F77DD]/50 hover:bg-[#534AB7]/15"
              >
                {t("landing.heroCtaSecondary", "공모전 보기")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="mt-7 inline-flex items-center gap-2 text-[12px] text-white/45">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {t("landing.liveNote", "지금 전 세계 크리에이터들이 작품을 올리는 중")}
            </div>
          </AnimateIn>
        </div>

        <div className="absolute inset-x-0 bottom-5 flex justify-center">
          <span className="h-9 w-5 rounded-full border border-white/20 p-1">
            <span className="mx-auto block h-2 w-1 animate-bounce rounded-full bg-white/50" />
          </span>
        </div>
      </section>

      {/* ── Auto-scroll film strip ───────────── */}
      {marqueeLoop.length > 0 && (
        <section className="border-y border-white/[0.06] bg-white/[0.015] py-6">
          <div className="relative overflow-hidden">
            <div className="landing-marquee flex gap-3">
              {marqueeLoop.map((v, i) => (
                <Link
                  key={`${v.id}-${i}`}
                  href={`/watch/${v.id}`}
                  className="group relative aspect-video w-[260px] shrink-0 overflow-hidden rounded-xl border border-white/[0.08] sm:w-[300px]"
                  aria-hidden={i >= marquee.length}
                >
                  {v.thumbnailUrl && (
                    <Image
                      src={v.thumbnailUrl}
                      alt={v.title}
                      fill
                      sizes="(max-width:640px) 260px, 300px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3">
                    <p className="line-clamp-1 text-[12px] font-bold text-white">{v.title}</p>
                  </div>
                </Link>
              ))}
            </div>
            {/* 좌우 페이드 */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-20" style={{ background: "linear-gradient(90deg,#0a0a0a,transparent)" }} />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-20" style={{ background: "linear-gradient(270deg,#0a0a0a,transparent)" }} />
          </div>
        </section>
      )}

      {/* ── Features ─────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-8 sm:py-24">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[min(1000px,120vw)] -translate-x-1/2"
          style={{ background: "radial-gradient(50% 60% at 50% 30%, rgba(83,74,183,0.10) 0%, transparent 70%)", filter: "blur(50px)" }}
        />
        <AnimateIn delay={0.05} className="mx-auto mb-10 max-w-[720px] text-center">
          <h2 className="text-[26px] font-black tracking-[-0.02em] sm:text-[36px]">
            {t("landing.featSectionTitle", "영화를 보고, 만들고, 겨루다")}
          </h2>
          <p className="mx-auto mt-3 max-w-[460px] text-[14px] text-white/50">
            {t("landing.featSectionSub", "Genova는 AI 영화 크리에이터를 위한 단 하나의 무대입니다.")}
          </p>
        </AnimateIn>
        <div className="mx-auto grid max-w-[1100px] gap-4 sm:grid-cols-3">
          {features.map(({ Icon, title, desc }, i) => (
            <AnimateIn
              key={title}
              delay={0.1 + i * 0.08}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] p-6 transition hover:border-[#7F77DD]/30"
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "linear-gradient(160deg, rgba(127,119,221,0.07) 0%, rgba(10,10,10,0.4) 55%, rgba(10,10,10,0.55) 100%)" }}
              />
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{ background: "linear-gradient(to right, transparent, rgba(127,119,221,0.4) 50%, transparent)" }}
              />
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "radial-gradient(circle, rgba(83,74,183,0.16) 0%, transparent 70%)", filter: "blur(28px)" }}
              />
              <div className="relative">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#7F77DD]/20 bg-[#534AB7]/15 text-[#AFA9EC]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[17px] font-bold text-white">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/50">{desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ── Featured competitions ────────────── */}
      {featuredCompetitions.length > 0 && (
        <section className="relative overflow-hidden px-4 py-12 sm:px-8 sm:py-20">
          <div
            className="pointer-events-none absolute right-0 top-1/4 -z-10 h-[400px] w-[min(700px,90vw)]"
            style={{ background: "radial-gradient(circle at 70% 50%, rgba(83,74,183,0.10) 0%, transparent 70%)", filter: "blur(50px)" }}
          />
          <div className="mx-auto max-w-[1280px]">
            <AnimateIn delay={0.05} className="mb-6 flex items-end justify-between gap-4">
              <h2 className="text-[22px] font-black tracking-[-0.02em] sm:text-[30px]">
                {t("landing.compTitle", "진행 중인 공모전")}
              </h2>
              <Link
                href="/competition"
                className="shrink-0 text-[12px] font-semibold text-white/45 transition hover:text-white"
              >
                {t("landing.seeAll", "전체 보기 →")}
              </Link>
            </AnimateIn>
            <div className="grid gap-4 md:grid-cols-2">
              {featuredCompetitions.map((c, i) => {
                const deadline = fmtDate(c.deadline);
                return (
                  <AnimateIn key={c.id} delay={0.1 + i * 0.08}>
                    <Link
                      href={`/competition/${c.id}`}
                      className="group block overflow-hidden rounded-2xl border border-white/[0.08]"
                    >
                      <div className="relative aspect-[16/9] w-full">
                        {c.thumbnailUrl ? (
                          <Image
                            src={c.thumbnailUrl}
                            alt={c.title}
                            fill
                            sizes="(max-width:768px) 100vw, 50vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div
                            className="h-full w-full"
                            style={{ background: "linear-gradient(135deg, rgba(83,74,183,0.25) 0%, #0a0a0a 70%)" }}
                          />
                        )}
                        <div
                          className="absolute inset-0"
                          style={{ background: "linear-gradient(180deg, transparent 30%, rgba(10,10,10,0.65) 70%, #0a0a0a 100%)" }}
                        />
                        <div className="absolute inset-x-0 bottom-0 p-5">
                          {c.sponsor && (
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#AFA9EC]">
                              {c.sponsor}
                            </p>
                          )}
                          <h3 className="line-clamp-1 text-[19px] font-black text-white">{c.title}</h3>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
                            {c.prizeInfo && (
                              <span className="font-bold tabular-nums text-[#F5D182]">{c.prizeInfo}</span>
                            )}
                            {deadline && <span className="text-white/45">~ {deadline}</span>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </AnimateIn>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA ────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-8 sm:py-32">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[440px] w-[min(820px,120vw)] -translate-x-1/2 -translate-y-1/2"
          style={{
            background: "radial-gradient(50% 60% at 50% 50%, rgba(83,74,183,0.20) 0%, transparent 72%)",
            filter: "blur(44px)",
          }}
        />
        <AnimateIn delay={0.05} className="mx-auto max-w-[680px] text-center">
          <h2 className="text-[30px] font-black leading-tight tracking-[-0.025em] sm:text-[46px]">
            {t("landing.finalTitle", "당신의 AI 영화,\n지금 시작하세요")}
          </h2>
          <p className="mx-auto mt-4 max-w-[440px] text-[14px] text-white/55">
            {t("landing.finalSub", "가입은 무료입니다. 작품을 올리고 공모전에 도전하세요.")}
          </p>
          <Link
            href="/auth"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-[15px] font-bold text-[#0a0a0a] transition hover:bg-white/90"
          >
            {t("landing.finalCta", "무료로 시작하기")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </AnimateIn>
      </section>

      {/* ── Footer ───────────────────────────── */}
      <footer className="border-t border-white/[0.06] px-4 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 text-[12px] text-white/40 sm:flex-row">
          <span className="font-black text-white/70">Genova</span>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/" className="transition hover:text-white/70">
              {t("nav.films", "Films")}
            </Link>
            <Link href="/competition" className="transition hover:text-white/70">
              {t("nav.competition", "Competition")}
            </Link>
            <Link href="/auth" className="transition hover:text-white/70">
              {t("landing.navStart", "시작하기")}
            </Link>
          </div>
          <span>© {new Date().getFullYear()} Genova</span>
        </div>
      </footer>
    </div>
  );
}
