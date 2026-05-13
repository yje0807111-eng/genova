"use client";

import { useEffect, useState } from "react";
import { Calendar, PlayCircle, Trophy, Users } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { CompetitionRulesModal } from "./competition-rules-modal";

function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0px)" : "translateY(20px)",
        transition: "opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {children}
    </div>
  );
}

export function CompetitionHero({
  activeCount,
  upcomingCount,
  totalPrizeLabel,
  totalParticipants,
}: {
  activeCount: number;
  upcomingCount: number;
  totalPrizeLabel: string;
  totalParticipants: number;
}) {
  const { t } = useI18n();
  const [rulesOpen, setRulesOpen] = useState(false);
  useEffect(() => {
    if (rulesOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [rulesOpen]);
  return (
    <div className="relative w-full overflow-hidden -mt-16 min-h-[480px]">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: "url('/hero-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "70% 30%",
        }}
      />
      {/* Subtle galaxy background effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-[30%] top-[50%] -translate-y-1/2 h-[200px] w-[500px] rounded-full"
          style={{
            background: "radial-gradient(ellipse, rgba(83,74,183,0.08) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        {[
          { top: "10%", left: "15%", size: "1px", opacity: 0.3 },
          { top: "25%", left: "35%", size: "1.5px", opacity: 0.25 },
          { top: "60%", left: "22%", size: "1px", opacity: 0.2 },
          { top: "75%", left: "48%", size: "1px", opacity: 0.25 },
          { top: "15%", left: "55%", size: "1.5px", opacity: 0.2 },
          { top: "40%", left: "70%", size: "1px", opacity: 0.15 },
          { top: "80%", left: "75%", size: "1px", opacity: 0.2 },
          { top: "20%", left: "85%", size: "1.5px", opacity: 0.18 },
          { top: "55%", left: "90%", size: "1px", opacity: 0.15 },
          { top: "35%", left: "42%", size: "1px", opacity: 0.12 },
        ].map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{ width: s.size, height: s.size, top: s.top, left: s.left, opacity: s.opacity }}
          />
        ))}
      </div>

      {/* Films hero-style overlays (full-width edge-to-edge) */}
      <div className="absolute inset-0 bg-[rgba(6,4,15,0.15)]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(6,4,15,0.98) 0%, rgba(6,4,15,0.9) 25%, rgba(6,4,15,0.5) 50%, rgba(6,4,15,0.15) 70%, rgba(6,4,15,0) 85%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]/30 pointer-events-none" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(6,4,15,0.7) 0%, transparent 25%)" }} />

      {/* Content wrapper keeps existing hero content/layout */}
      <div className="relative z-30 px-16 pt-24 pb-0">
        <div className="mx-auto max-w-[1680px]">
          <div
            className="relative py-8"
          >
            <div className="flex flex-col gap-6">
              {/* Top row: text + pills */}
              <div className="flex items-start justify-between">
                <div className="max-w-xl">
                  {/* eyebrow, h1, description, buttons — 그대로 유지 */}
                  <FadeIn delay={50}>
                    <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#AFA9EC]">
                      <span className="text-[#7F77DD]">✦</span>
                      {t("nav.competition", "Competition")}
                    </div>
                  </FadeIn>
                  <FadeIn delay={100}>
                  <h1
                    className="mt-5 text-5xl font-black leading-tight tracking-tight sm:text-6xl bg-clip-text text-transparent"
                    style={{
                      backgroundImage: "linear-gradient(125deg, #a8d8ff 0%, #ffffff 25%, #e8e4ff 50%, #b8a8ff 75%, #7B5FE8 100%)",
                      filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.5))",
                    }}
                  >
                      {t("competition.heroTitle", "AI Film Competitions")}
                    </h1>
                  </FadeIn>
                  <FadeIn delay={150}>
                    <p className="mt-5 text-[15px] text-white/65 leading-relaxed max-w-md">
                      {t("competition.heroDesc1", "Showcase your AI-generated films and compete with creators worldwide.")}
                      {" "}
                      {t("competition.heroDesc2", "Turn your imagination into the next award-winning film.")}
                    </p>
                  </FadeIn>
                  <FadeIn delay={180}>
                    <div className="mt-7 flex items-center gap-3">
                      <a
                        href="#competition-featured"
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById("competition-featured");
                          if (el) {
                            const top = el.getBoundingClientRect().top + window.scrollY;
                            window.scrollTo({ top, behavior: "smooth" });
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-xl px-8 py-2 text-[14px] font-bold text-white transition-all duration-300 hover:scale-[1.03]"
                        style={{
                          background: "var(--gradient-cta-hero)",
                          border: "1px solid rgba(150,170,255,0.3)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 20px rgba(100,120,255,0.4), 0 4px 16px rgba(83,74,183,0.5)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
                        }}
                      >
                        {t("competition.enterNowCta")}
                      </a>
                      <button
                        type="button"
                        onClick={() => setRulesOpen(true)}
                        className="btn-tertiary inline-flex items-center gap-2 rounded-xl px-6 py-2 text-[14px] font-semibold text-white/50 transition-all duration-300 hover:text-white/80"
                      >
                        {t("competition.viewRules")}
                      </button>
                    </div>
                  </FadeIn>
                </div>

                {/* Right side pills */}
                <div className="hidden sm:flex flex-col items-end gap-3 pt-8">
                  <FadeIn delay={150}>
                    <div
                      className="group flex w-52 items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0a]/70 px-3 py-2.5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        boxShadow: "0 0 0 0 rgba(83,74,183,0)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 16px rgba(127,119,221,0.25), inset 0 0 12px rgba(83,74,183,0.1)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 0 rgba(83,74,183,0)"; }}
                    >
                      <PlayCircle className="h-5 w-5 text-[#AFA9EC]" />
                      <div>
                        <p className="text-[12px] font-bold text-white">{t("competition.aiOnly", "AI-Generated Only")}</p>
                        <p className="text-[10px] text-white/70">{t("competition.aiOnlySub")}</p>
                      </div>
                    </div>
                  </FadeIn>
                  <FadeIn delay={200}>
                    <div
                      className="group flex w-52 items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0a]/70 px-3 py-2.5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        boxShadow: "0 0 0 0 rgba(83,74,183,0)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 16px rgba(127,119,221,0.2), inset 0 0 12px rgba(83,74,183,0.08)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 0 rgba(83,74,183,0)"; }}
                    >
                      <Calendar className="h-5 w-5 text-[#AFA9EC]" />
                      <div>
                        <p className="text-[12px] font-bold text-white">{t("competition.noSubmitLimit", "Unlimited Submissions")}</p>
                        <p className="text-[10px] text-white/70">{t("competition.noSubmitLimitSub")}</p>
                      </div>
                    </div>
                  </FadeIn>
                  <FadeIn delay={250}>
                    <div
                      className="group flex w-52 items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0a]/70 px-3 py-2.5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        boxShadow: "0 0 0 0 rgba(83,74,183,0)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 16px rgba(127,119,221,0.2), inset 0 0 12px rgba(83,74,183,0.08)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 0 rgba(83,74,183,0)"; }}
                    >
                      <Users className="h-5 w-5 text-[#AFA9EC]" />
                      <div>
                        <p className="text-[12px] font-bold text-white">{t("competition.openWorldwide", "Open Worldwide")}</p>
                        <p className="text-[10px] text-white/70">{t("competition.openWorldwideSub")}</p>
                      </div>
                    </div>
                  </FadeIn>
                </div>
              </div>

              {/* Stats box — full width below */}
              <FadeIn delay={200}>
                <div
                  className="relative flex overflow-hidden mt-4"
                  style={{
                    background: "rgba(10,10,10,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    width: "60%",
                    borderRadius: "20px",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 0 16px rgba(83,74,183,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
                  }}
                >
                  {/* 상단 라인 글로우 */}
                  <div
                    className="pointer-events-none absolute left-0 right-0 top-0 h-px"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(127,119,221,0.45), transparent)",
                    }}
                  />
                  {/* 움직이는 shimmer */}
                  <div
                    className="pointer-events-none absolute inset-y-0 w-1/3"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(127,119,221,0.04), transparent)",
                      animation: "spotlightShimmer 4s ease-in-out infinite",
                    }}
                  />
                  {/* 배경 글로우 */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: "radial-gradient(ellipse at 20% 50%, rgba(83,74,183,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(255,215,0,0.04) 0%, transparent 60%)",
                    }}
                  />
                  {[
                    { Icon: PlayCircle, color: "#AFA9EC", value: activeCount.toString(), label: t("competition.activeCompetitionsLabel") },
                    { Icon: Calendar, color: "#AFA9EC", value: upcomingCount.toString(), label: t("competition.upcomingCompetitionsLabel") },
                    { Icon: Trophy, color: "#AFA9EC", value: totalPrizeLabel, label: t("competition.totalPrizes", "Total Prizes") },
                    {
                      Icon: Users,
                      color: "#AFA9EC",
                      value: totalParticipants >= 1000 ? `${(totalParticipants / 1000).toFixed(1)}K+` : `${totalParticipants}+`,
                      label: t("competition.participants", "Participants"),
                    },
                  ].map((stat, idx, arr) => (
                    <div
                      key={stat.label}
                      className="group/stat relative flex flex-1 items-center gap-3.5 px-5 py-5 transition-all duration-300"
                      style={{
                        borderRight: idx < arr.length - 1 ? "1px solid rgba(127,119,221,0.08)" : "none",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = "linear-gradient(180deg, rgba(175,169,236,0.08) 0%, transparent 100%)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = "transparent";
                      }}
                    >
                      {/* 아이콘 박스 */}
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover/stat:scale-110"
                        style={{
                          background: "linear-gradient(135deg, rgba(175,169,236,0.18) 0%, rgba(175,169,236,0.08) 100%)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          boxShadow: "0 0 12px rgba(127,119,221,0.14), inset 0 1px 0 rgba(255,255,255,0.08)",
                        }}
                      >
                        <stat.Icon
                          size={18}
                          color={stat.color}
                          style={{ filter: "drop-shadow(0 0 4px rgba(175,169,236,0.55))" }}
                        />
                      </div>

                      {/* 값 + 라벨 */}
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <p
                          className="font-black leading-none tabular-nums tracking-tight truncate"
                          style={{
                            fontSize: stat.value.length > 6 ? "16px" : stat.value.length > 4 ? "18px" : "20px",
                            backgroundImage: `linear-gradient(180deg, #ffffff 0%, ${stat.color} 100%)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {stat.value}
                        </p>
                        <p
                          className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/45"
                        >
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </div>

      {/* Seamless bottom/page fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 z-20 pointer-events-none bg-gradient-to-b from-transparent to-[#111111]"
      />

      {/* Left/right side fades */}
      <div
        className="absolute top-0 left-0 z-10 pointer-events-none h-full w-32 bg-gradient-to-r from-[#0a0a0a] to-transparent"
      />

      <div
        className="absolute top-0 right-0 z-10 pointer-events-none h-full w-32 bg-gradient-to-l from-[#111111] to-transparent"
      />
      {/* 상단 페이드 */}
      <div
        className="absolute top-0 left-0 right-0 z-10 pointer-events-none h-[120px]"
        style={{
          background: "linear-gradient(to bottom, rgba(6,4,15,0.95) 0%, rgba(6,4,15,0.4) 50%, transparent 100%)",
        }}
      />

      <CompetitionRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
