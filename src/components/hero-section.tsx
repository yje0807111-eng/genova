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

export function HeroSection({
  competition,
  dDay,
}: {
  competition: { title: string; prizeInfo: string } | null;
  dDay: number;
}) {
  return (
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

        {competition ? (
          <div
            className={`${dmSans.className} flex flex-col items-start justify-between gap-4 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(83,74,183,0.04)] px-6 py-5 sm:px-12 lg:flex-row lg:items-center hero-fade`}
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex items-center gap-4">
              <span className="inline-flex rounded-[20px] border border-[rgba(83,74,183,0.3)] bg-[rgba(83,74,183,0.15)] px-[10px] py-[3px] text-[10px] uppercase tracking-[0.15em] text-[#7F77DD]">
                Live Now
              </span>
              <div>
                <p className="text-[16px] font-semibold text-white">{competition.title}</p>
                <p className="mt-[3px] text-[12px] text-[rgba(255,255,255,0.35)]">
                  {competition.prizeInfo}  ·  D-{Math.max(0, dDay)} remaining
                </p>
              </div>
            </div>
            <Link
              href="/competition"
              className="inline-flex rounded-[2px] border border-[rgba(83,74,183,0.4)] px-6 py-[9px] text-[13px] text-[#7F77DD] transition duration-200 hover:border-[#534AB7] hover:bg-[rgba(83,74,183,0.1)]"
            >
              Enter Now →
            </Link>
          </div>
        ) : null}
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
  );
}
