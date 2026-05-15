import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server";
import { LotteryGuideContent } from "@/components/lottery/lottery-guide-content";

export const metadata: Metadata = {
  title: "응모권 추첨 안내",
  description:
    "Genova 응모권 추첨 시스템 — 영상을 올리면 자동 응모, 매월 공정한 추첨으로 상금을 받는 방법을 안내합니다.",
};

/**
 * 사용자용 응모권 시스템 안내 페이지.  본문은 사이드바 모달과
 * 공유하는 <LotteryGuideContent> (variant="page").  진입점:
 * 사이드바 응모권 칸(모달) / 응모권 카운터 ⓘ / 콘테스트 ⓘ / 푸터.
 */
export default async function LotteryGuidePage() {
  const locale = await getServerLocale();
  return <LotteryGuideContent locale={locale} variant="page" />;
}
