"use client";

import { useI18n } from "@/components/genova/language-provider";
import type { MonthlyTicketCount } from "@/lib/queries/lottery-queries";
import { LotteryGuideInfoButton } from "./lottery-guide-info-button";

/**
 * 프로필 헤더용 이번 달 응모권 카운터 (server, 소유자 전용).
 *
 * 단일 행 pill — "이번 달 응모권 N/5 · 리셋까지 16일" + ⓘ 안내.
 * used(발급/사용 수) 기준, 전 화면(사이드바·업로드 팝업)과 통일.
 * 소진 시 amber 안내.  `count` 가 null 이면 렌더 안 함.
 *
 * (card / inline variant 는 업로드 전용 페이지 폐기로 사용처가
 *  사라져 제거 — compact pill 만 유지.)
 */
export function LotteryCounter({
  count,
}: {
  count: MonthlyTicketCount | null;
}) {
  const { t } = useI18n();
  if (!count) return null;

  const used = count.total;
  const depleted = used >= 5;
  const revoked = count.revoked;
  const resetCopy =
    count.resetInDays <= 0
      ? t("lottery.resetToday", "Resets today")
      : t("lottery.resetIn", "Resets in {days} day(s)").replace(
          "{days}",
          String(count.resetInDays),
        );

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
      {revoked > 0 ? (
        <>
          <span className="text-white/20">·</span>
          <span className="text-amber-300/70">
            {t(
              "lottery.revokedNote",
              "{n} invalidated (video deleted)",
            ).replace("{n}", String(revoked))}
          </span>
        </>
      ) : null}
      <LotteryGuideInfoButton
        ariaLabel={t("lottery.guideLink", "응모권 추첨 안내")}
        size={14}
        className="ml-0.5 inline-flex items-center text-white/35 transition hover:text-white/70"
      />
    </div>
  );
}
