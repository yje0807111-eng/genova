"use client";

import { useState } from "react";
import { Sparkles, Trophy, Briefcase, TrendingUp, X, AlertTriangle, Check } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";

type ValuePropConfig = {
  key: string;
  icon: typeof Sparkles;
  badge?: string;
  glow: string;
  accent: string;
  iconColor: string;
  copy: {
    title: string;
    desc: string;
    details: {
      intro: string;
      benefits: { title: string; desc: string }[];
      warnings?: string[];
    };
  };
};

export function ValuePropCards() {
  const { t } = useI18n();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const VALUE_PROPS: ValuePropConfig[] = [
    {
      key: "original",
      icon: Sparkles,
      glow: "rgba(127,119,221,0.4)",
      accent: "#7F77DD",
      iconColor: "#AFA9EC",
      copy: {
        title: t("valueProps.original.title", "Real Creation"),
        desc: t("valueProps.original.desc", "Not prompt copies — your own cinematic vision"),
        details: {
          intro: t(
            "valueProps.original.intro",
            "Genova is a space for works that embody real creators' visions, not mere prompt-replicated videos.",
          ),
          benefits: [
            {
              title: t("valueProps.original.benefit1.title", "Self-Edited Works"),
              desc: t(
                "valueProps.original.benefit1.desc",
                "We welcome cinematic works that combine multiple AI tools with hands-on editing.",
              ),
            },
            {
              title: t("valueProps.original.benefit2.title", "Storytelling First"),
              desc: t(
                "valueProps.original.benefit2.desc",
                "Not demos — works with characters, plot, and emotion get priority exposure.",
              ),
            },
            {
              title: t("valueProps.original.benefit3.title", "Creator Protection"),
              desc: t(
                "valueProps.original.benefit3.desc",
                "Plagiarism reporting and verification protect original creators' rights.",
              ),
            },
          ],
          warnings: [
            t("valueProps.original.warning1", "Copying others' prompts verbatim is subject to penalties."),
            t("valueProps.original.warning2", "Uploading raw AI tool outputs without editing is discouraged."),
            t(
              "valueProps.original.warning3",
              "Repeated plagiarism reports may result in permanent account suspension.",
            ),
          ],
        },
      },
    },
    {
      key: "competition",
      icon: Trophy,
      badge: "$1,000",
      glow: "rgba(255,200,80,0.35)",
      accent: "#FFC850",
      iconColor: "#FFD980",
      copy: {
        title: t("valueProps.competition.title", "Global Competitions"),
        desc: t("valueProps.competition.desc", "Compete worldwide · Real prizes"),
        details: {
          intro: t(
            "valueProps.competition.intro",
            "Genova hosts new competitions monthly, offering prizes and recognition to creators worldwide.",
          ),
          benefits: [
            {
              title: t("valueProps.competition.benefit1.title", "Real Prizes"),
              desc: t(
                "valueProps.competition.benefit1.desc",
                "$1,000 total prize for the 1st short film competition. Prize pools grow each round.",
              ),
            },
            {
              title: t("valueProps.competition.benefit2.title", "Global Exposure"),
              desc: t(
                "valueProps.competition.benefit2.desc",
                "Winners are featured on Genova's main and curation, reaching global viewers.",
              ),
            },
            {
              title: t("valueProps.competition.benefit3.title", "Fair Judging"),
              desc: t(
                "valueProps.competition.benefit3.desc",
                "Transparent judging combining internal panel and viewer votes.",
              ),
            },
          ],
          warnings: [
            t("valueProps.competition.warning1", "Submissions must be created at the time of entry."),
            t("valueProps.competition.warning2", "Cross-platform submissions require prior disclosure."),
            t(
              "valueProps.competition.warning3",
              "Awards may be revoked and prizes reclaimed if violations are found post-award.",
            ),
          ],
        },
      },
    },
    {
      key: "brand",
      icon: Briefcase,
      glow: "rgba(175,169,236,0.35)",
      accent: "#AFA9EC",
      iconColor: "#C7C2F0",
      copy: {
        title: t("valueProps.brand.title", "Brand Partnerships"),
        desc: t("valueProps.brand.desc", "Brand-commissioned competitions for your work"),
        details: {
          intro: t(
            "valueProps.brand.intro",
            "Brands that discover your work commission competitions directly through Genova. Creative work becomes income.",
          ),
          benefits: [
            {
              title: t("valueProps.brand.benefit1.title", "Brand-Commissioned Competitions"),
              desc: t(
                "valueProps.brand.benefit1.desc",
                "Companies host competitions around their products and commission creators.",
              ),
            },
            {
              title: t("valueProps.brand.benefit2.title", "1/10th of Agency Cost"),
              desc: t(
                "valueProps.brand.benefit2.desc",
                "Get diverse concepts at a fraction of agency costs.",
              ),
            },
            {
              title: t("valueProps.brand.benefit3.title", "Earning Opportunity"),
              desc: t(
                "valueProps.brand.benefit3.desc",
                "Winning leads to additional collaboration opportunities beyond prizes.",
              ),
            },
          ],
        },
      },
    },
    {
      key: "monetization",
      icon: TrendingUp,
      badge: "Phase 2",
      glow: "rgba(100,200,150,0.35)",
      accent: "#64C896",
      iconColor: "#86D9B0",
      copy: {
        title: t("valueProps.monetization.title", "Creator Monetization"),
        desc: t("valueProps.monetization.desc", "Revenue share by views and watch time"),
        details: {
          intro: t(
            "valueProps.monetization.intro",
            "Genova aims to be a platform where creators earn sustainable income from their work. A YouTube-style ad revenue share model is in preparation.",
          ),
          benefits: [
            {
              title: t("valueProps.monetization.benefit1.title", "Views & Watch Time Based"),
              desc: t(
                "valueProps.monetization.benefit1.desc",
                "Once follower thresholds are met, revenue is distributed by views and watch time.",
              ),
            },
            {
              title: t("valueProps.monetization.benefit2.title", "Dual: Prizes + Revenue"),
              desc: t(
                "valueProps.monetization.benefit2.desc",
                "Beyond competition prizes, regular uploads alone can generate income.",
              ),
            },
            {
              title: t("valueProps.monetization.benefit3.title", "Transparent Payouts"),
              desc: t(
                "valueProps.monetization.benefit3.desc",
                "Monthly reports and clear RPM disclosure build a trustworthy revenue system.",
              ),
            },
          ],
          warnings: [
            t("valueProps.monetization.warning1", "Monetization is not yet active in the current beta phase."),
            t(
              "valueProps.monetization.warning2",
              "Will roll out in phases once advertisers and traffic thresholds are reached.",
            ),
            t(
              "valueProps.monetization.warning3",
              "Exact launch timing and revenue split will be announced at official release.",
            ),
            t(
              "valueProps.monetization.warning4",
              "This system may change based on future policies and market conditions.",
            ),
          ],
        },
      },
    },
  ];

  const learnMoreLabel = t("valueProps.learnMore", "Learn more");
  const importantNotesLabel = t("valueProps.importantNotes", "Important Notes");

  const active = VALUE_PROPS.find((p) => p.key === openKey);
  const ActiveIcon = active?.icon;

  return (
    <>
      <div className="mb-20 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {VALUE_PROPS.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setOpenKey(item.key)}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] p-6 text-left transition-all duration-500 hover:-translate-y-1.5 hover:border-white/20"
              style={{
                background: "#1a1a1a",
                animation: `fade-in-up 0.6s ease-out ${i * 0.1}s both`,
              }}
            >
              {/* Accent top line */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-40 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${item.accent} 50%, transparent 100%)`,
                }}
              />
              {/* Glow orb */}
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 transition-all duration-700 group-hover:opacity-80 group-hover:scale-110"
                style={{
                  background: `radial-gradient(circle, ${item.glow} 0%, transparent 70%)`,
                  filter: "blur(30px)",
                }}
              />
              {/* Bottom hover glow */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-32 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(ellipse at bottom, ${item.glow} 0%, transparent 70%)`,
                  filter: "blur(20px)",
                }}
              />
              {/* Dot texture */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.15]"
                style={{
                  backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
                  backgroundSize: "16px 16px",
                }}
              />
              <div className="relative">
                <div
                  className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                  style={{
                    borderColor: `${item.accent}40`,
                    background: `linear-gradient(135deg, ${item.accent}25 0%, ${item.accent}08 100%)`,
                    boxShadow: `0 0 0 1px ${item.accent}10, 0 8px 24px -8px ${item.glow}`,
                  }}
                >
                  <Icon
                    className="h-5 w-5 transition-all duration-500 group-hover:scale-110"
                    style={{ color: item.iconColor }}
                  />
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-[18px] font-black tracking-tight text-white">{item.copy.title}</h3>
                  {item.badge && (
                    <span
                      className="rounded-full border px-2 py-0.5 text-[10px] font-black"
                      style={{
                        borderColor: `${item.accent}50`,
                        backgroundColor: `${item.accent}15`,
                        color: item.iconColor,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="mb-5 text-[13px] leading-relaxed text-white/55">{item.copy.desc}</p>
                <div
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold transition-all duration-300"
                  style={{ color: item.iconColor }}
                >
                  {learnMoreLabel}
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal */}
      {active && ActiveIcon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpenKey(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.1] p-8"
            style={{
              background: "#1a1a1a",
              animation: "fade-in-up 0.4s ease-out",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-25"
              style={{
                background: `radial-gradient(circle, ${active.glow} 0%, transparent 70%)`,
                filter: "blur(50px)",
              }}
            />
            <button
              type="button"
              onClick={() => setOpenKey(null)}
              className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-white/35 transition hover:bg-white/[0.05] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative">
              <div
                className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${active.accent}55 0%, ${active.accent}28 100%)`,
                  boxShadow: `inset 0 1px 0 ${active.accent}66, 0 0 0 1px ${active.accent}44`,
                }}
              >
                <ActiveIcon className="h-6 w-6" style={{ color: active.iconColor }} />
              </div>

              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-[24px] font-black tracking-tight text-white">{active.copy.title}</h2>
                {active.badge && (
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                    {active.badge}
                  </span>
                )}
              </div>

              <p className="mb-6 text-[14px] leading-relaxed text-white/65">{active.copy.details.intro}</p>

              <div className="mb-6 space-y-3">
                {active.copy.details.benefits.map((b, bi) => (
                  <div
                    key={`${active.key}-benefit-${bi}`}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${active.accent}33` }}
                    >
                      <Check className="h-3 w-3" style={{ color: active.iconColor }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-white">{b.title}</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-white/50">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {active.copy.details.warnings && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      {importantNotesLabel}
                    </p>
                  </div>
                  <ul className="space-y-1.5">
                    {active.copy.details.warnings.map((w, wi) => (
                      <li key={`${active.key}-warn-${wi}`} className="text-[12px] leading-relaxed text-white/55">
                        · {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
