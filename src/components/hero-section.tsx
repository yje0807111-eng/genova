"use client";

import Link from "next/link";
import { DM_Sans, Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

function translateCompetitionTitle(title: string): string {
  const map: Record<string, string> = {
    "Genova AI 영상 공모전 2026": "Genova AI Film Contest 2026",
  };
  return map[title] ?? title;
}

function translateCompetitionPrize(prizeInfo: string): string {
  const map: Record<string, string> = {
    "총 상금 5,000만원 + Genova Original 계약": "Total Prize $50,000 + Genova Original Deal",
  };
  return map[prizeInfo] ?? prizeInfo;
}

export function HeroSection({
  competition,
  dDay,
}: {
  competition: { title: string; prizeInfo: string } | null;
  dDay: number;
}) {
  const competitionTitle = competition ? translateCompetitionTitle(competition.title) : null;
  const competitionPrizeInfo = competition ? translateCompetitionPrize(competition.prizeInfo) : null;

  return (
    <>
    <section className="relative bg-[#080618] pb-0 pt-[56px]">
      <div className="mx-auto w-full max-w-[1680px]">
        <div className="flex flex-col justify-between gap-10 px-6 pb-12 pt-16 sm:px-12 lg:flex-row lg:items-center lg:gap-12">
          <div className="max-w-[560px]">
            <p
              className={`${dmSans.className} inline-flex rounded-[2px] border border-[rgba(83,74,183,0.25)] bg-[rgba(83,74,183,0.12)] px-3 py-1 text-[11px] tracking-[0.2em] text-[#7F77DD] hero-fade`}
              style={{ animationDelay: "0s" }}
            >
              ✦ AI FILM PLATFORM
            </p>
            <h1
              className={`${playfair.className} mt-6 text-[46px] font-bold leading-[1] tracking-[-0.02em] text-white sm:text-[56px] lg:text-[64px] hero-fade`}
              style={{ animationDelay: "0.1s" }}
            >
              <span className="block">Where AI Cinema</span>
              <span className="block">
                Belongs. <span className="text-[30px] text-[#534AB7] sm:text-[34px] lg:text-[36px]">✦</span>
              </span>
            </h1>
            <p
              className={`${dmSans.className} mt-5 text-[15px] leading-[1.6] text-[rgba(255,255,255,0.4)] hero-fade`}
              style={{ animationDelay: "0.2s" }}
            >
              The only platform where AI films belong.
            </p>
          </div>

          <div
            className={`${dmSans.className} flex shrink-0 flex-col items-start gap-3 lg:items-end hero-fade`}
            style={{ animationDelay: "0.3s" }}
          >
            <Link
              href="/films"
              className="inline-flex w-[200px] items-center justify-center rounded-[2px] bg-[#534AB7] px-8 py-[14px] text-center text-[14px] font-medium text-white transition duration-200 hover:translate-x-[2px] hover:bg-[#6358D4]"
            >
              Watch Films →
            </Link>
            <Link
              href="/feed"
              className="inline-flex w-[200px] items-center justify-center rounded-[2px] border border-[rgba(255,255,255,0.15)] px-8 py-[14px] text-center text-[14px] text-[rgba(255,255,255,0.7)] transition duration-200 hover:border-white hover:text-white"
            >
              Browse Feed
            </Link>
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .hero-fade {
          opacity: 0;
          animation: fadeUp 0.45s ease-out forwards;
        }
      `}</style>
    </section>

    <section className="relative overflow-hidden px-0">
      <div className="relative mx-auto w-full max-w-[1900px] overflow-hidden border-l-[2px] border-l-[#534AB7] bg-[#080618] px-12 py-10">
        <div className="relative flex w-full flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="relative space-y-3">
            <span className="eyebrow">Featured Competition</span>
            <h3 className="text-2xl font-bold">{competitionTitle ?? "No active competition"}</h3>
            {competition ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-[2px] border border-[rgba(255,255,255,0.15)] bg-[#080618] px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#FF6B6B]" />
                  <p className="text-sm font-semibold tracking-wide text-white">
                    {dDay > 0 ? `SUBMISSION CLOSES IN D-${dDay}` : "SUBMISSION ENDS TODAY"}
                  </p>
                </div>
                <p className="text-sm text-[rgba(255,255,255,0.5)]">{competitionPrizeInfo}</p>
              </>
            ) : null}
          </div>
          <Link href="/competition" className="btn-primary relative inline-flex w-fit rounded-[2px] px-5 py-2 text-[13px] font-medium">
            Enter Now
          </Link>
        </div>
      </div>
    </section>
    </>
  );
}
