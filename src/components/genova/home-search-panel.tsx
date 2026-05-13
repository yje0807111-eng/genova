"use client";

import Link from "next/link";
import { Film, Search, Trophy, Upload } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { cn } from "@/lib/utils/cn";
import { useUploadModal } from "@/components/upload/upload-modal-context";

type QuickCard = {
  href: string;
  icon: typeof Film;
  labelKey: string;
  labelFallback: string;
};

const QUICK_CARDS: QuickCard[] = [
  {
    href: "/films",
    icon: Film,
    labelKey: "home.searchPanel.cardFilms",
    labelFallback: "Films 둘러보기",
  },
  {
    href: "/competition",
    icon: Trophy,
    labelKey: "home.searchPanel.cardCompetition",
    labelFallback: "공모전 상세",
  },
  {
    href: "/upload",
    icon: Upload,
    labelKey: "home.searchPanel.cardUpload",
    labelFallback: "업로드",
  },
  {
    href: "/search",
    icon: Search,
    labelKey: "home.searchPanel.cardSearch",
    labelFallback: "검색/탐색",
  },
];

export function HomeSearchPanel() {
  const { t } = useI18n();
  const { open: openUploadModal } = useUploadModal();

  return (
    <section
      className={cn(
        "w-full rounded-2xl border border-white/[0.06] p-4 sm:p-5 md:p-6",
        "bg-[#0a0a0a]",
      )}
    >
      <Link
        href="/search"
        className={cn(
          "flex min-h-[52px] w-full items-center gap-3 rounded-[12px] border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 sm:min-h-[56px] sm:px-5",
          "text-left transition-colors duration-200",
          "hover:border-white/[0.12] hover:bg-white/[0.055]",
          "focus-visible:border-[#7F77DD]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#534AB7]/35",
        )}
      >
        <Search className="h-5 w-5 shrink-0 text-white/35 sm:h-[22px] sm:w-[22px]" strokeWidth={2} aria-hidden />
        <span className="text-[15px] text-white/38 sm:text-base" style={{ WebkitFontSmoothing: "antialiased" }}>
          {t("home.searchPanel.placeholder", "AI 영화, 크리에이터, 태그 검색...")}
        </span>
      </Link>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-3.5 md:mt-5 md:grid-cols-4 md:gap-4">
        {QUICK_CARDS.map(({ href, icon: Icon, labelKey, labelFallback }) => {
          const cls = cn(
            "group relative flex aspect-[3/2] flex-col items-start justify-end overflow-hidden rounded-xl border border-white/[0.06] bg-[#1a1a1a] p-3.5 sm:p-4",
            "origin-center transition duration-300 ease-out will-change-transform",
            "hover:scale-105 hover:border-[#7F77DD]/25",
            "hover:shadow-[0_0_36px_rgba(127,119,221,0.28),0_12px_40px_rgba(0,0,0,0.45)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7F77DD]/40",
          );
          const inner = (
            <>
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(127,119,221,0.18) 0%, transparent 65%)",
                }}
              />
              <Icon
                className="relative z-[1] mb-auto h-6 w-6 text-white/45 transition-colors duration-300 group-hover:text-[#AFA9EC] sm:h-7 sm:w-7"
                strokeWidth={1.75}
                aria-hidden
              />
              <span
                className="relative z-[1] text-[13px] font-semibold leading-snug text-white/80 transition-colors duration-300 group-hover:text-white sm:text-sm"
                style={{ WebkitFontSmoothing: "antialiased" }}
              >
                {t(labelKey, labelFallback)}
              </span>
            </>
          );

          if (href === "/upload") {
            return (
              <button key={href} type="button" onClick={() => openUploadModal()} className={cls}>
                {inner}
              </button>
            );
          }

          return (
            <Link key={href} href={href} className={cls}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
