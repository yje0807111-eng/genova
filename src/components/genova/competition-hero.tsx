"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimateIn } from "@/components/animate-in";
import { useI18n } from "@/components/genova/language-provider";
import { useUploadModal } from "@/components/upload/upload-modal-context";

export type Competition = {
  id: string;
  title: string;
  subtitle?: string | null;
  genre?: string | null;
  sponsor?: string | null;
  prizeInfo?: string | null;
  deadline: string;
  bannerUrl?: string | null;
  thumbnailUrl?: string | null;
};

export type Props = { competition: Competition | null };

function formatDeadlineLabel(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CompetitionHero({ competition }: Props) {
  const { t, locale } = useI18n();
  const { open: openUploadModal } = useUploadModal();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const countdown = useMemo(() => {
    if (!competition) return { isClosed: true, daysLeft: null as number | null };
    const end = Date.parse(competition.deadline);
    if (Number.isNaN(end)) return { isClosed: true, daysLeft: null };
    const diff = end - now;
    if (diff <= 0) return { isClosed: true, daysLeft: null };
    return { isClosed: false, daysLeft: Math.floor(diff / 86_400_000) };
  }, [competition, now]);

  if (!competition) return null;

  const imageSrc = competition.bannerUrl ?? competition.thumbnailUrl ?? null;
  const prizeText = competition.prizeInfo?.trim() || "—";
  const deadlineLabel = formatDeadlineLabel(competition.deadline, locale);

  return (
    <section
      className={`-mt-16 relative w-full overflow-hidden min-h-[55vh] md:min-h-[60vh]`}
    >
      <div className="absolute inset-0">
        {imageSrc ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- external competition assets */}
            <img src={imageSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 42%, rgba(10,10,10,0.2) 72%, transparent 100%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to top, rgba(10,10,10,0.92) 0%, transparent 45%)",
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 20% 80%, rgba(83,74,183,0.22) 0%, transparent 55%),
                radial-gradient(ellipse 60% 50% at 85% 20%, rgba(38,33,92,0.45) 0%, transparent 50%),
                linear-gradient(165deg, #0a0a0a 0%, #111111 45%, #26215C 100%)
              `,
            }}
          />
        )}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-radial-gradient(circle at 0 0, rgba(248,247,255,0.9) 0, rgba(248,247,255,0.9) 1px, transparent 1px, transparent 14px)",
            backgroundSize: "18px 18px",
          }}
        />

        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(83,74,183,0.55) 0%, transparent 70%)",
            animation: "search-pulse 5s ease-in-out infinite",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1600px] flex-col gap-6 px-4 pb-10 pt-20 sm:px-6 md:grid md:grid-cols-3 md:items-end md:gap-8 md:pb-12 md:pt-24 lg:px-10">
        <div className="flex flex-col md:col-span-2">
          <AnimateIn delay={0.05}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-light">
              {t("hero.featuredCompetition", "✦ Featured Competition")}
            </p>
          </AnimateIn>

          {competition.genre ? (
            <AnimateIn delay={0.08}>
              <span
                className="mt-3 inline-flex w-fit rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/90"
                style={{
                  borderColor: "var(--border-emphasis)",
                  background: "rgba(10,10,10,0.5)",
                }}
              >
                {competition.genre}
              </span>
            </AnimateIn>
          ) : null}

          <AnimateIn delay={0.1}>
            <h1
              className="font-display mt-3 text-[36px] font-black leading-tight tracking-tight text-[#F8F7FF] md:text-[44px]"
            >
              {competition.title}
            </h1>
          </AnimateIn>

          {competition.subtitle ? (
            <AnimateIn delay={0.12}>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/72">{competition.subtitle}</p>
            </AnimateIn>
          ) : null}

          {competition.sponsor ? (
            <AnimateIn delay={0.14}>
              <p className="mt-3 text-[13px] text-white/55">
                {t("competition.banner.sponsoredBy", "Sponsored by")} {competition.sponsor}
              </p>
            </AnimateIn>
          ) : null}

          <AnimateIn delay={0.16}>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => openUploadModal({ competitionId: competition.id })}
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-[14px] font-bold text-white transition hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #534AB7 0%, #3C3489 100%)",
                  boxShadow: "0 0 28px rgba(83,74,183,0.35)",
                }}
              >
                {t("competition.banner.submitNow", "Submit Now →")}
              </button>
              <Link
                href={`/competition/${competition.id}`}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-[14px] font-semibold text-white/85 backdrop-blur-md transition hover:border-white/25 hover:bg-white/10"
              >
                {t("competition.banner.learnMore", "Learn More")}
              </Link>
            </div>
          </AnimateIn>
        </div>

        <div className="relative flex w-full flex-col gap-3 md:max-w-none">
          <div
            className="pointer-events-none absolute -right-6 top-0 h-40 w-40 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(255,215,120,0.45) 0%, transparent 70%)" }}
          />

          <AnimateIn delay={0.12}>
            <div
              className="relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl"
              style={{
                borderColor: "rgba(16,185,129,0.35)",
                background: "linear-gradient(160deg, rgba(10,10,10,0.92) 0%, rgba(6,20,14,0.55) 100%)",
                boxShadow:
                  "0 0 36px rgba(16,185,129,0.2), inset 0 1px 0 rgba(167,243,208,0.12)",
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/90">
                {t("competition.banner.prize", "Prize")}
              </p>
              <p className="mt-1.5 text-[15px] font-semibold leading-snug text-[#F8F7FF]">{prizeText}</p>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.16}>
            <div
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/70 p-4 backdrop-blur-xl"
              style={{ boxShadow: "inset 0 1px 0 var(--tint-purple-12)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                {t("competition.banner.deadline", "Deadline")}
              </p>
              <p className="mt-1 text-sm font-medium text-white/80">{deadlineLabel}</p>

              <div className="mt-4 flex items-end gap-2">
                {countdown.isClosed ? (
                  <span className="font-display text-[32px] font-black tabular-nums text-white/90 md:text-[40px]">
                    {t("competition.banner.closed", "CLOSED")}
                  </span>
                ) : (
                  <>
                    <span className="font-display text-[48px] font-black leading-none tabular-nums md:text-[56px] text-accent-light">
                      {countdown.daysLeft}
                    </span>
                    <span className="pb-1 text-[12px] font-semibold uppercase tracking-[0.15em] text-white/55">
                      {t("competition.banner.daysLeft", "days left")}
                    </span>
                  </>
                )}
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
