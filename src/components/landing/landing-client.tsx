"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, Trophy, Clapperboard, Globe2, Sparkles } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
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
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
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

      {/* ── Hero ─────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-36">
        {/* contained brand glow — 가로 오버플로우 없음 */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[min(900px,120vw)] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(50% 60% at 50% 35%, rgba(83,74,183,0.20) 0%, rgba(83,74,183,0.06) 45%, transparent 75%)",
            filter: "blur(40px)",
          }}
        />
        <div className="mx-auto max-w-[860px] text-center">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#AFA9EC]">
            <Sparkles className="h-3 w-3" />
            {t("landing.eyebrow", "The Home of AI Filmmakers")}
          </span>
          <h1 className="bg-gradient-to-br from-white via-white to-[#AFA9EC] bg-clip-text pb-1 text-[34px] font-black leading-[1.1] tracking-[-0.03em] text-transparent sm:text-[56px]">
            {t("landing.heroTitle", "AI가 만드는 영화의 시대")}
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[14px] leading-relaxed text-white/55 sm:text-[16px]">
            {t(
              "landing.heroSub",
              "전 세계 AI 크리에이터들이 작품을 스트리밍하고, 공모전에서 경쟁하는 영화 플랫폼.",
            )}
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Link
              href="/"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-bold text-[#0a0a0a] transition hover:bg-white/90 sm:w-auto"
            >
              <Play className="h-4 w-4 fill-current" />
              {t("landing.heroCtaPrimary", "지금 감상하기")}
            </Link>
            <Link
              href="/competition"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 py-3 text-[14px] font-bold text-white backdrop-blur-xl transition hover:border-[#7F77DD]/50 hover:bg-[#534AB7]/15 sm:w-auto"
            >
              {t("landing.heroCtaSecondary", "공모전 보기")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trending strip ───────────────────── */}
      {trendingVideos.length > 0 && (
        <section className="px-4 py-10 sm:px-8 sm:py-14">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="text-[18px] font-black tracking-tight sm:text-[22px]">
                {t("landing.trendingTitle", "지금 뜨는 작품")}
              </h2>
              <Link
                href="/"
                className="shrink-0 text-[12px] font-semibold text-white/45 transition hover:text-white"
              >
                {t("landing.seeAll", "전체 보기 →")}
              </Link>
            </div>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden">
              {trendingVideos.slice(0, 12).map((v) => (
                <Link
                  key={v.id}
                  href={`/watch/${v.id}`}
                  className="group relative aspect-[2/3] w-[140px] shrink-0 overflow-hidden rounded-xl border border-white/[0.06] sm:w-auto"
                >
                  {v.thumbnailUrl ? (
                    <Image
                      src={v.thumbnailUrl}
                      alt={v.title}
                      fill
                      sizes="(max-width:640px) 140px, 16vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{ background: "linear-gradient(135deg, rgba(83,74,183,0.25) 0%, #0a0a0a 70%)" }}
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5">
                    <p className="line-clamp-2 text-[11px] font-bold leading-tight text-white">
                      {v.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Features ─────────────────────────── */}
      <section className="px-4 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-[1280px] gap-4 sm:grid-cols-3">
          {features.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition hover:border-[#7F77DD]/25"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#534AB7]/15 text-[#AFA9EC]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-[16px] font-bold text-white">{title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/50">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured competitions ────────────── */}
      {featuredCompetitions.length > 0 && (
        <section className="px-4 py-10 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-[1280px]">
            <h2 className="mb-5 text-[18px] font-black tracking-tight sm:text-[22px]">
              {t("landing.compTitle", "진행 중인 공모전")}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {featuredCompetitions.map((c) => {
                const deadline = fmtDate(c.deadline);
                return (
                  <Link
                    key={c.id}
                    href={`/competition/${c.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.08]"
                  >
                    <div className="relative aspect-[16/9] w-full">
                      {c.thumbnailUrl ? (
                        <Image
                          src={c.thumbnailUrl}
                          alt={c.title}
                          fill
                          sizes="(max-width:768px) 100vw, 50vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div
                          className="h-full w-full"
                          style={{ background: "linear-gradient(135deg, rgba(83,74,183,0.25) 0%, #0a0a0a 70%)" }}
                        />
                      )}
                      <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(180deg, transparent 35%, rgba(10,10,10,0.6) 70%, #0a0a0a 100%)" }}
                      />
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        {c.sponsor && (
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#AFA9EC]">
                            {c.sponsor}
                          </p>
                        )}
                        <h3 className="line-clamp-1 text-[18px] font-black text-white">{c.title}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
                          {c.prizeInfo && (
                            <span className="font-bold tabular-nums text-[#F5D182]">{c.prizeInfo}</span>
                          )}
                          {deadline && <span className="text-white/45">~ {deadline}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA ────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-8 sm:py-28">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[400px] w-[min(800px,120vw)] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(50% 60% at 50% 50%, rgba(83,74,183,0.18) 0%, transparent 72%)",
            filter: "blur(40px)",
          }}
        />
        <div className="mx-auto max-w-[640px] text-center">
          <h2 className="text-[28px] font-black leading-tight tracking-[-0.02em] sm:text-[40px]">
            {t("landing.finalTitle", "당신의 AI 영화, 지금 시작하세요")}
          </h2>
          <p className="mx-auto mt-3 max-w-[440px] text-[14px] text-white/55">
            {t("landing.finalSub", "가입은 무료입니다. 작품을 올리고 공모전에 도전하세요.")}
          </p>
          <Link
            href="/auth"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-[14px] font-bold text-[#0a0a0a] transition hover:bg-white/90"
          >
            {t("landing.finalCta", "무료로 시작하기")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
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
