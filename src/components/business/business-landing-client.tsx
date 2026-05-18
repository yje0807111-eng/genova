"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Users, Zap, Trophy, CheckCircle2 } from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { BusinessApplyButton } from "./business-apply-button";
import { useI18n } from "@/components/genova/language-provider";

export function BusinessLandingClient() {
  const { t } = useI18n();

  const VALUE_PROPS = [
    { icon: Users, title: t("bizLanding.vp1Title"), desc: t("bizLanding.vp1Desc") },
    { icon: Zap, title: t("bizLanding.vp2Title"), desc: t("bizLanding.vp2Desc") },
    { icon: Trophy, title: t("bizLanding.vp3Title"), desc: t("bizLanding.vp3Desc") },
  ];

  const PROCESS_STEPS = [
    { num: "01", title: t("bizLanding.ps1Title"), desc: t("bizLanding.ps1Desc") },
    { num: "02", title: t("bizLanding.ps2Title"), desc: t("bizLanding.ps2Desc") },
    { num: "03", title: t("bizLanding.ps3Title"), desc: t("bizLanding.ps3Desc") },
    { num: "04", title: t("bizLanding.ps4Title"), desc: t("bizLanding.ps4Desc") },
    { num: "05", title: t("bizLanding.ps5Title"), desc: t("bizLanding.ps5Desc") },
  ];

  const FAQ = [
    { q: t("bizLanding.faq1Q"), a: t("bizLanding.faq1A") },
    { q: t("bizLanding.faq2Q"), a: t("bizLanding.faq2A") },
    { q: t("bizLanding.faq3Q"), a: t("bizLanding.faq3A") },
    { q: t("bizLanding.faq4Q"), a: t("bizLanding.faq4A") },
  ];

  return (
    <div className="relative -mt-16 min-h-screen overflow-hidden bg-[#0a0a0a]">
      {/* 페이지 전체 앰비언트 배경 — 단조로운 블랙 완화 */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(83,74,183,0.05) 0%, transparent 14%, transparent 50%, rgba(83,74,183,0.04) 70%, transparent 100%)",
          }}
        />
        <div
          className="absolute -left-40 top-[780px] h-[520px] w-[640px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(127,119,221,0.10) 0%, transparent 70%)",
            filter: "blur(90px)",
          }}
        />
        <div
          className="absolute -right-48 top-[1500px] h-[560px] w-[680px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(83,74,183,0.12) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-[460px] w-[1100px] -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, rgba(127,119,221,0.10) 0%, transparent 72%)",
            filter: "blur(90px)",
          }}
        />
      </div>

      <div className="relative z-10">
      {/* Hero */}
      <div className="relative pt-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-0 h-[500px] w-[1000px] -translate-x-1/2 rounded-full"
            style={{
              background: "radial-gradient(ellipse, rgba(83,74,183,0.12) 0%, transparent 72%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute right-0 top-40 h-72 w-72 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(83,74,183,0.18) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        </div>

        <div
          className="pointer-events-none absolute left-0 right-0 top-16 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(127,119,221,0.5) 30%, rgba(175,169,236,0.3) 60%, transparent)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20">
          <AnimateIn delay={0.05}>
            <div className="mb-6 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#7F77DD]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#AFA9EC]">
                For Brands &amp; Creators
              </span>
            </div>

            <h1 className="text-[56px] font-black leading-[1.05] tracking-[-0.02em] text-white">
              {t("bizLanding.titleLine1")}
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #AFA9EC 0%, #7F77DD 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {t("bizLanding.titleLine2")}
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-white/55">
              {t("bizLanding.subtitle1")}
              <br />
              {t("bizLanding.subtitle2")}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <BusinessApplyButton
                className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-bold text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
                  boxShadow: "0 8px 32px rgba(83,74,183,0.5)",
                }}
              >
                {t("bizLanding.ctaPrimary")}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </BusinessApplyButton>
              <Link
                href="/competition"
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-6 py-3 text-[14px] font-bold text-white/70 transition hover:border-white/25 hover:bg-white/[0.06] hover:text-white"
              >
                {t("bizLanding.ctaSecondary")}
              </Link>
            </div>
            <p className="mt-4 text-[12px] text-white/35">{t("bizLanding.ctaNote")}</p>
          </AnimateIn>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(127,119,221,0.20), transparent)",
          }}
        />
      </div>

      {/* Value Propositions */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <AnimateIn delay={0.06}>
          <div className="mb-10 flex items-center gap-2">
            <span className="text-[10px] text-[#7F77DD]">✦</span>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7F77DD]/75">
              Why Genova
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {VALUE_PROPS.map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.1] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#7F77DD]/30 hover:shadow-[0_0_32px_rgba(127,119,221,0.2)]"
                style={{
                  background:
                    "linear-gradient(135deg, var(--tint-purple-08) 0%, rgba(83,74,183,0.04) 50%, rgba(10,10,10,0.6) 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.2)",
                }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(83,74,183,0.4) 0%, rgba(127,119,221,0.2) 100%)",
                    boxShadow: "0 4px 16px var(--tint-accent-25)",
                  }}
                >
                  <item.icon className="h-5 w-5 text-[#AFA9EC]" />
                </div>
                <h3 className="text-[16px] font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </AnimateIn>
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(127,119,221,0.20), transparent)",
          }}
        />
      </div>

      {/* Process */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <AnimateIn delay={0.06}>
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="text-[10px] text-[#7F77DD]">✦</span>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7F77DD]/75">
                  Process
                </p>
              </div>
              <h2
                className="text-[32px] font-black tracking-tight text-white"
                style={{ letterSpacing: "-0.02em" }}
              >
                {t("bizLanding.processHeading")}
              </h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            {PROCESS_STEPS.map((step, idx) => (
              <div
                key={step.num}
                className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/40 p-5 backdrop-blur-xl"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className="text-[28px] font-black leading-none"
                    style={{
                      background: "linear-gradient(135deg, #AFA9EC 0%, #534AB7 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {step.num}
                  </span>
                  {idx < PROCESS_STEPS.length - 1 && (
                    <ArrowRight className="hidden h-3.5 w-3.5 text-white/20 md:block" />
                  )}
                </div>
                <h3 className="text-[14px] font-bold text-white">{step.title}</h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">{step.desc}</p>
              </div>
            ))}
          </div>
        </AnimateIn>
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(127,119,221,0.20), transparent)",
          }}
        />
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-4xl px-6 pb-24">
        <AnimateIn delay={0.06}>
          <div className="mb-10 flex items-center gap-2">
            <span className="text-[10px] text-[#7F77DD]">✦</span>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7F77DD]/75">
              FAQ
            </p>
          </div>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/40 p-5 backdrop-blur-xl"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#7F77DD]" />
                  <div>
                    <h3 className="text-[14px] font-bold text-white">{item.q}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/55">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnimateIn>
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(127,119,221,0.20), transparent)",
          }}
        />
      </div>

      {/* Bottom CTA */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <AnimateIn delay={0.06}>
          <div
            className="relative overflow-hidden rounded-3xl border border-white/[0.1] p-12 text-center backdrop-blur-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(127,119,221,0.15) 0%, rgba(83,74,183,0.08) 50%, rgba(10,10,10,0.6) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(83,74,183,0.14) 0%, transparent 72%)",
                filter: "blur(60px)",
              }}
            />
            <div className="relative">
              <h2
                className="text-[36px] font-black leading-tight tracking-tight text-white"
                style={{ letterSpacing: "-0.02em" }}
              >
                {t("bizLanding.bottomHeading")}
              </h2>
              <p className="mt-3 text-[14px] text-white/55">{t("bizLanding.bottomSub")}</p>
              <BusinessApplyButton
                className="group mt-8 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-[14px] font-bold text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
                  boxShadow: "0 8px 32px rgba(83,74,183,0.5)",
                }}
              >
                {t("bizLanding.bottomCta")}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </BusinessApplyButton>
            </div>
          </div>
        </AnimateIn>
      </div>
      </div>
    </div>
  );
}
