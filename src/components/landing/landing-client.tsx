"use client";

import Link from "next/link";
import { ArrowRight, Trophy, Play, Calendar, Award } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { cn } from "@/lib/utils/cn";
import { ValuePropCards } from "@/components/landing/value-prop-cards";

type Locale = "en" | "ko" | "ja";

const T: Record<
  Locale,
  {
    nav: { explore: string; start: string };
    hero: {
      badge: string;
      title: string;
      subtitle: string;
      desc: string;
      ctaWatch: string;
      ctaCreator: string;
      betaRecruit: string;
      betaPerk: string;
    };
    featured: {
      label: string;
      heading: string;
      viewAll: string;
      sponsoredBy: string;
      prize: string;
      deadline: string;
      cta: string;
      comingSoon: string;
    };
    cta: {
      badge: string;
      heading: string;
      desc: string;
      button: string;
    };
    footer: {
      terms: string;
      privacy: string;
      business: string;
    };
  }
> = {
  ko: {
    nav: { explore: "둘러보기", start: "시작하기" },
    hero: {
      badge: "Beta Now Open",
      title: "The Home of AI Filmmakers",
      subtitle: "AI 영화의 새로운 무대",
      desc: "프롬프트 복사가 아닌, 진짜 창작자들의 AI 시네마. 전 세계 크리에이터와 경쟁하고, 작품으로 인정받으세요.",
      ctaWatch: "작품 보러가기",
      ctaCreator: "크리에이터로 시작",
      betaRecruit: "Beta Creator 모집 중",
      betaPerk: "초기 멤버 한정 혜택",
    },
    featured: {
      label: "✦ Featured Competitions",
      heading: "지금 진행 중인 공모전",
      viewAll: "모든 공모전",
      sponsoredBy: "Sponsored by",
      prize: "상금",
      deadline: "마감",
      cta: "공모전 자세히 보기",
      comingSoon: "Coming Soon",
    },
    cta: {
      badge: "✦ Join the Movement",
      heading: "지금 Genova에서 당신의 시네마를",
      desc: "베타 기간 동안 무료로 모든 기능을 사용하세요.",
      button: "지금 시작하기",
    },
    footer: { terms: "이용약관", privacy: "개인정보처리방침", business: "공모전 의뢰" },
  },
  en: {
    nav: { explore: "Explore", start: "Get Started" },
    hero: {
      badge: "Beta Now Open",
      title: "The Home of AI Filmmakers",
      subtitle: "A New Stage for AI Cinema",
      desc: "Not prompt copies — real creators, real AI cinema. Compete with creators worldwide and get recognized for your work.",
      ctaWatch: "Watch Films",
      ctaCreator: "Start as Creator",
      betaRecruit: "Beta Creators Wanted",
      betaPerk: "Founding member benefits",
    },
    featured: {
      label: "✦ Featured Competitions",
      heading: "Live Competitions",
      viewAll: "All Competitions",
      sponsoredBy: "Sponsored by",
      prize: "Prize",
      deadline: "Deadline",
      cta: "View Competition",
      comingSoon: "Coming Soon",
    },
    cta: {
      badge: "✦ Join the Movement",
      heading: "Bring Your Cinema to Genova",
      desc: "All features free during beta.",
      button: "Get Started",
    },
    footer: { terms: "Terms", privacy: "Privacy", business: "For Brands" },
  },
  ja: {
    nav: { explore: "見る", start: "はじめる" },
    hero: {
      badge: "Beta Now Open",
      title: "The Home of AI Filmmakers",
      subtitle: "AI映画の新しい舞台",
      desc: "プロンプトのコピーではなく、本物のクリエイターによるAIシネマ。世界中のクリエイターと競い合い、作品で認められましょう。",
      ctaWatch: "作品を見る",
      ctaCreator: "クリエイターとして始める",
      betaRecruit: "Beta Creator 募集中",
      betaPerk: "初期メンバー限定特典",
    },
    featured: {
      label: "✦ Featured Competitions",
      heading: "開催中のコンペティション",
      viewAll: "すべて見る",
      sponsoredBy: "Sponsored by",
      prize: "賞金",
      deadline: "締切",
      cta: "詳細を見る",
      comingSoon: "Coming Soon",
    },
    cta: {
      badge: "✦ Join the Movement",
      heading: "あなたのシネマをGenovaへ",
      desc: "ベータ期間中はすべての機能が無料です。",
      button: "今すぐ始める",
    },
    footer: { terms: "利用規約", privacy: "プライバシー", business: "ブランド向け" },
  },
};

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
  const { locale, setLocale } = useI18n();
  const t = T[(locale as Locale) ?? "ko"] ?? T.ko;
  const dateLocale = locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "ko-KR";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3 sm:px-10">
          <Link href="/landing" className="flex items-center gap-2">
            <span className="text-[18px] font-black tracking-tight">Genova</span>
            <span className="rounded-full border border-[#7F77DD]/30 bg-[#534AB7]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#AFA9EC]">
              Beta
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] p-1 backdrop-blur-md">
              {(["en", "ko", "ja"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLocale(lang)}
                  className={cn(
                    "h-6 rounded-full px-2.5 text-[10px] font-semibold transition",
                    locale === lang ? "bg-white/10 text-white" : "text-white/35 hover:text-white/70",
                  )}
                >
                  {lang === "en" ? "EN" : lang === "ko" ? "KO" : "JA"}
                </button>
              ))}
            </div>
            <Link href="/" className="hidden text-[12px] font-semibold text-white/55 hover:text-white sm:block px-3 py-1.5">
              {t.nav.explore}
            </Link>
            <Link href="/auth" className="rounded-full bg-white px-4 py-1.5 text-[12px] font-bold text-[#0a0a0a] hover:scale-105 transition">
              {t.nav.start}
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden pt-20">
        {/* Background textures */}
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(127,119,221,0.18) 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute -left-20 top-10 h-[500px] w-[700px] rounded-full"
            style={{
              background: "radial-gradient(ellipse, rgba(127,119,221,0.18) 0%, transparent 65%)",
              filter: "blur(100px)",
              animation: "search-pulse 6s ease-in-out infinite",
            }}
          />
          <div
            className="absolute right-0 top-32 h-[400px] w-[600px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(83,74,183,0.14) 0%, transparent 70%)",
              filter: "blur(100px)",
              animation: "search-pulse 8s ease-in-out infinite reverse",
            }}
          />
          <div
            className="absolute left-1/3 top-1/2 h-[300px] w-[400px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(175,169,236,0.08) 0%, transparent 70%)",
              filter: "blur(80px)",
              animation: "search-pulse 7s ease-in-out infinite",
            }}
          />
        </div>

        <div className="mx-auto max-w-[1600px] px-6 pb-10 pt-10 sm:px-10">
          {/* Hero text */}
          <div className="mb-10 text-center">
            <div className="mb-5 inline-flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#AFA9EC]">
                ✦ {t.hero.badge}
              </span>
            </div>

            <h1
              className="bg-gradient-to-br from-white via-white to-[#AFA9EC] bg-clip-text pb-1 text-[40px] font-black leading-[1.05] tracking-[-0.035em] text-transparent sm:text-[56px]"
              style={{ fontFamily: "var(--font-syne), var(--font-plus-jakarta), sans-serif" }}
            >
              {t.hero.title}
            </h1>

            <p className="mt-3 text-[14px] font-bold tracking-[-0.01em] text-white/70 sm:text-[15px]">
              {t.hero.subtitle}
            </p>

            <p className="mx-auto mt-3 max-w-xl text-[13px] leading-relaxed text-white/50">
              {t.hero.desc}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-bold text-[#0a0a0a] transition hover:scale-105"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {t.hero.ctaWatch}
              </Link>
              <Link
                href="/auth"
                className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-5 py-2.5 text-[13px] font-bold text-white backdrop-blur-xl transition hover:border-[#7F77DD]/50 hover:bg-[#534AB7]/15"
              >
                {t.hero.ctaCreator}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="mt-6 inline-flex items-center gap-2.5">
              <div className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[11px] text-white/50">
                <span className="font-bold text-white/75">{t.hero.betaRecruit}</span>
                <span className="mx-1.5 text-white/20">·</span>
                <span>{t.hero.betaPerk}</span>
              </p>
            </div>
          </div>

          {/* Hero video grid */}
          <div className="relative mb-12">
            <div
              className="pointer-events-none absolute -inset-10 -z-10"
              style={{
                background: "radial-gradient(ellipse at center, rgba(127,119,221,0.18) 0%, transparent 60%)",
                filter: "blur(60px)",
              }}
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {trendingVideos.slice(0, 4).map((v, i) => {
                const offsets = ["mt-0", "mt-3", "mt-1", "mt-4"];
                return (
                  <Link
                    key={v.id}
                    href={`/watch/${v.id}`}
                    className={`group relative block overflow-hidden rounded-xl transition-all duration-500 hover:-translate-y-1.5 ${offsets[i] ?? ""}`}
                    style={{ animation: `fade-in-up 0.8s ease-out ${i * 0.08}s both` }}
                  >
                    <div className="relative aspect-square overflow-hidden bg-white/[0.03]">
                      {v.thumbnailUrl && (
                        <img
                          src={v.thumbnailUrl}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                      <div
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{
                          background: "radial-gradient(ellipse at center, rgba(127,119,221,0.25) 0%, transparent 70%)",
                        }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background: "linear-gradient(180deg, transparent 50%, rgba(10,10,10,0.9) 100%)",
                        }}
                      />
                      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 transition-all duration-500 group-hover:ring-[#7F77DD]/60" />
                      <div className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 opacity-0 backdrop-blur-md transition-all duration-500 group-hover:opacity-100">
                        <Play className="h-3 w-3 fill-white text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="line-clamp-1 text-[11px] font-bold leading-tight text-white">
                          {v.title}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <ValuePropCards />

          {/* Featured Competitions */}
          {featuredCompetitions.length > 0 && (
            <div>
              <div className="mb-6 flex items-end justify-between gap-3 border-b border-white/[0.06] pb-5">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Award className="h-3 w-3 text-[#7F77DD]" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#AFA9EC]">
                      {t.featured.label}
                    </p>
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black text-emerald-300">
                      Live
                    </span>
                  </div>
                  <h2 className="text-[24px] font-black tracking-[-0.02em] text-white sm:text-[28px]">
                    {t.featured.heading}
                  </h2>
                </div>
                <Link
                  href="/competition"
                  className="group inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-white/50 transition hover:text-white"
                >
                  {t.featured.viewAll}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {featuredCompetitions.map((c) => (
                  <Link
                    key={c.id}
                    href={`/competition/${c.id}`}
                    className="group relative block overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1a1a1a] transition-all duration-500 hover:-translate-y-1 hover:border-[#7F77DD]/40 hover:shadow-[0_24px_56px_rgba(127,119,221,0.22)]"
                  >
                    <div
                      className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-90"
                      style={{
                        background: "radial-gradient(circle, rgba(255,200,80,0.3) 0%, transparent 70%)",
                        filter: "blur(60px)",
                      }}
                    />
                    <div className="relative grid h-full gap-0 md:grid-cols-[1.2fr_1fr] md:h-[260px]">
                      <div className="relative h-40 overflow-hidden md:h-full">
                        {c.thumbnailUrl ? (
                          <img
                            src={c.thumbnailUrl}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className="relative h-full w-full overflow-hidden"
                            style={{
                              background: "#1a1a1a",
                            }}
                          >
                            <div
                              className="absolute inset-0 opacity-[0.06]"
                              style={{
                                backgroundImage:
                                  "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
                                backgroundSize: "32px 32px",
                              }}
                            />
                            <div
                              className="absolute inset-0 opacity-20"
                              style={{
                                backgroundImage:
                                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
                                backgroundSize: "20px 20px",
                              }}
                            />
                            <div
                              className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 transition-all duration-700 group-hover:opacity-70 group-hover:scale-110"
                              style={{
                                background: "radial-gradient(circle, rgba(127,119,221,0.5) 0%, transparent 70%)",
                                filter: "blur(40px)",
                              }}
                            />
                            <div className="relative flex h-full w-full flex-col items-center justify-center px-6">
                              <span
                                className="mb-3 text-[64px] leading-none text-[#AFA9EC]/30 transition-all duration-500 group-hover:scale-110 group-hover:text-[#AFA9EC]/50"
                                style={{ fontFamily: "var(--font-syne), serif" }}
                              >
                                ✦
                              </span>
                              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">
                                Genova
                              </p>
                              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-white/20">
                                {t.featured.comingSoon}
                              </p>
                            </div>
                            <div
                              className="absolute inset-0"
                              style={{
                                background:
                                  "radial-gradient(ellipse at center, transparent 30%, rgba(10,10,10,0.5) 100%)",
                              }}
                            />
                          </div>
                        )}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: "linear-gradient(90deg, transparent 50%, rgba(10,10,10,0.6) 100%)",
                          }}
                        />
                      </div>

                      <div className="relative flex flex-col justify-between gap-4 p-5 sm:p-6">
                        <div>
                          {c.genre && (
                            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#AFA9EC]">
                              ✦ {c.genre}
                            </p>
                          )}
                          <h3 className="mb-3 line-clamp-2 text-[18px] font-black leading-[1.2] tracking-tight text-white sm:text-[20px]">
                            {c.title}
                          </h3>
                          {c.sponsor && (
                            <p className="mb-4 text-[12px] text-white/45">
                              {t.featured.sponsoredBy}{" "}
                              <span className="font-semibold text-white/70">{c.sponsor}</span>
                            </p>
                          )}

                          <div className="grid grid-cols-2 gap-2.5">
                            {c.prizeInfo && (
                              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
                                <div className="mb-1 flex items-center gap-1.5">
                                  <Trophy className="h-3 w-3 text-emerald-400" />
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                                    {t.featured.prize}
                                  </p>
                                </div>
                                <p className="text-[15px] font-black text-white">{c.prizeInfo}</p>
                              </div>
                            )}
                            {c.deadline && (
                              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                                <div className="mb-1 flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3 text-[#AFA9EC]" />
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">
                                    {t.featured.deadline}
                                  </p>
                                </div>
                                <p className="text-[14px] font-black text-white">
                                  {new Date(c.deadline).toLocaleDateString(dateLocale, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-2 text-[13px] font-bold text-white transition group-hover:text-[#AFA9EC]">
                          {t.featured.cta}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/[0.06] py-12">
        <div className="mx-auto max-w-[1600px] px-6 sm:px-10">
          <div className="group/cta relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1a1a1a] p-8 transition-[border-color,box-shadow] duration-300 hover:border-white/[0.12] hover:shadow-[0_0_32px_rgba(127,119,221,0.18)] sm:p-10">
            <div
              className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full opacity-0 transition-opacity duration-500 group-hover/cta:opacity-100"
              style={{
                background: "radial-gradient(circle, rgba(127,119,221,0.22) 0%, transparent 70%)",
                filter: "blur(60px)",
              }}
            />
            <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#AFA9EC]">
                  {t.cta.badge}
                </p>
                <h2 className="text-[24px] font-black tracking-[-0.02em] text-white sm:text-[32px]">
                  {t.cta.heading}
                </h2>
                <p className="mt-1.5 text-[13px] text-white/50">{t.cta.desc}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href="/auth"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[13px] font-bold text-[#0a0a0a] transition hover:scale-105"
                >
                  {t.cta.button}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-6 text-[11px] text-white/30 sm:px-10">
          <p>© 2026 Genova</p>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-white/55">
              {t.footer.terms}
            </Link>
            <Link href="/privacy" className="hover:text-white/55">
              {t.footer.privacy}
            </Link>
            <Link href="/business" className="hover:text-white/55">
              {t.footer.business}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
