import Link from "next/link";
import { Info } from "lucide-react";
import { getServerLocale, getServerT } from "@/lib/i18n/server";
import type { MonthlyTicketCount } from "@/lib/queries/lottery-queries";

/**
 * Server-rendered ticket counter card for the lottery system.
 * Used on the profile page (owner-only) and the upload page.
 *
 * Renders one of three states based on `count`:
 *   - happy path: "이번 달 응모권: 2/5 · 리셋까지 16일"
 *   - same-day reset: "이번 달 응모권: 5/5 · 오늘 리셋"
 *   - depleted: adds "이번 달 응모권을 모두 사용했습니다" hint
 *     in muted/warning tone.
 *
 * Passing `null` renders nothing — caller decides visibility
 * (e.g. only render for the owner of a profile page).
 */
export async function LotteryCounter({
  count,
  variant = "card",
}: {
  count: MonthlyTicketCount | null;
  /** "card"    — full bordered surface (upload page).
   *  "inline"  — borderless, embedded in another section.
   *  "compact" — single-line pill, width = content (profile page). */
  variant?: "card" | "inline" | "compact";
}) {
  if (!count) return null;
  const locale = await getServerLocale();
  const t = getServerT(locale);

  const used = count.total;
  const depleted = used >= 5;
  const resetCopy =
    count.resetInDays <= 0
      ? t("lottery.resetToday", "Resets today")
      : t("lottery.resetIn", "Resets in {days} day(s)").replace(
          "{days}",
          String(count.resetInDays),
        );

  // Compact: one-line pill sized to its content.  Keeps the profile
  // header tight instead of a 360px-wide two-row card.
  if (variant === "compact") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-[11px]">
        <span className="text-white/45">
          {t("lottery.title", "Entry tickets this month")}
        </span>
        <span className="font-bold tabular-nums text-white">
          {used}
          <span className="font-normal text-white/40">/5</span>
        </span>
        <span className="text-white/20">·</span>
        <span className={depleted ? "text-amber-300/85" : "text-white/40"}>
          {depleted
            ? t("lottery.depleted", "You've used all your tickets this month")
            : resetCopy}
        </span>
        <Link
          href="/lottery"
          className="ml-0.5 inline-flex items-center text-white/35 transition hover:text-white/70"
          aria-label={t("lottery.guideLink", "응모권 추첨 안내")}
          title={t("lottery.guideLink", "응모권 추첨 안내")}
        >
          <Info className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  const wrapperClass =
    variant === "card"
      ? "rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
      : "px-1 py-1.5";

  return (
    <div className={wrapperClass}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] font-semibold uppercase tracking-[0.15em] text-white/45">
          {t("lottery.title", "Entry tickets this month")}
        </div>
        <div className="flex items-baseline gap-1 text-white">
          <span className="text-[18px] font-black tabular-nums">{used}</span>
          <span className="text-[12px] text-white/45">/5</span>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 text-[11px]">
        <span className={depleted ? "text-amber-300/85" : "text-white/45"}>
          {depleted
            ? t("lottery.depleted", "You've used all your tickets this month")
            : ""}
        </span>
        <span className="text-white/40">{resetCopy}</span>
      </div>
    </div>
  );
}
