"use client";

import { useEffect, useState } from "react";
import { Calendar, PlayCircle, Trophy, Users } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";

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
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        backgroundImage: "url('/hero-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
      }}
    >
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
      <div className="absolute inset-0" style={{ background: "rgba(8,6,24,0.25)" }} />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(8,6,24,0.75) 0%, rgba(8,6,24,0.5) 30%, rgba(8,6,24,0.1) 60%, rgba(8,6,24,0) 100%)",
        }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,6,24,0.5) 0%, transparent 20%)" }} />

      {/* Content wrapper keeps existing hero content/layout */}
      <div className="relative z-30 px-8 pt-10 pb-8">
        <div className="mx-auto max-w-[1400px]">
          <div
            className="relative px-10 py-8"
          >
            <div className="flex items-center justify-between">
              <div className="max-w-lg">
                <FadeIn delay={50}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#7F77DD]/80">
                    · {t("nav.competition", "Competition")}
                  </p>
                </FadeIn>
                <FadeIn delay={100}>
                  <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                    {t("competition.heroTitle", "AI Film Competitions")}
                  </h1>
                </FadeIn>
                <FadeIn delay={150}>
                  <p className="mt-3 text-[15px] text-white/40 leading-relaxed max-w-md">
                    {t("competition.heroDesc1", "Showcase your AI-generated films and compete with creators worldwide.")}
                    {" "}
                    {t("competition.heroDesc2", "Turn your imagination into the next award-winning film.")}
                  </p>
                </FadeIn>
                <FadeIn delay={200}>
                  <div className="mt-8 flex flex-wrap gap-8">
                    {[
                      { Icon: PlayCircle, color: "#7F77DD", value: activeCount.toString(), label: t("competition.nowOpen", "Now Open") },
                      { Icon: Calendar, color: "#7F77DD", value: upcomingCount.toString(), label: t("competition.upcoming", "Upcoming") },
                      { Icon: Trophy, color: "#FFD700", value: totalPrizeLabel, label: t("competition.totalPrizes", "Total Prizes") },
                      {
                        Icon: Users,
                        color: "#7F77DD",
                        value: totalParticipants >= 1000 ? `${(totalParticipants / 1000).toFixed(1)}K+` : `${totalParticipants}+`,
                        label: t("competition.participants", "Participants"),
                      },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center gap-2">
                        <stat.Icon size={18} color={stat.color} />
                        <div>
                          <p className="text-base font-bold text-white">{stat.value}</p>
                          <p className="text-[11px] text-white/40">{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </FadeIn>
              </div>

              {/* Right side pills */}
              <div className="hidden sm:flex flex-col items-end gap-3">
                <FadeIn delay={150}>
                  <div className="flex items-center gap-2 rounded-full border border-[#7F77DD]/40 bg-[#0f0d24]/80 px-4 py-2 backdrop-blur-md">
                    <span className="text-[13px] font-semibold text-[#AFA9EC]">
                      <span className="text-[17px]">🎬</span> {t("competition.aiOnly", "AI-Generated Only")}
                    </span>
                  </div>
                </FadeIn>
                <FadeIn delay={200}>
                  <div className="flex items-center gap-2 rounded-full border border-[#FFD700]/40 bg-[#0f0d24]/80 px-4 py-2 backdrop-blur-md">
                    <span className="text-[13px] font-semibold text-[#FFD700]/80">
                      <span className="text-[17px]">🏆</span> {t("competition.winUpTo", "Win up to")} {totalPrizeLabel}
                    </span>
                  </div>
                </FadeIn>
                <FadeIn delay={250}>
                  <div className="flex items-center gap-2 rounded-full border border-white/20 bg-[#0f0d24]/80 px-4 py-2 backdrop-blur-md">
                    <span className="text-[13px] font-semibold text-white/50">
                      <span className="text-[17px]">🌍</span> {t("competition.openWorldwide", "Open Worldwide")}
                    </span>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seamless bottom/page fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-56 z-20 pointer-events-none bg-gradient-to-b from-transparent via-[#080618]/60 to-[#080618]"
      />

      {/* Left/right side fades */}
      <div
        className="absolute top-0 left-0 z-10 pointer-events-none h-full w-32 bg-gradient-to-r from-[#080618] to-transparent"
      />

      <div
        className="absolute top-0 right-0 z-10 pointer-events-none h-full w-32 bg-gradient-to-l from-[#080618] to-transparent"
      />
    </div>
  );
}
