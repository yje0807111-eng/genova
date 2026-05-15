"use client";

import { Info } from "lucide-react";
import { useLotteryGuideModal } from "./lottery-guide-modal";

/**
 * 응모권 안내 ⓘ 버튼 (client island).
 *
 * 진입점 일관성 — 사이드바 칸은 모달인데 프로필 pill / 콘테스트
 * "Entries" 옆 ⓘ 는 /lottery 페이지 Link 였음.  이 작은 island 로
 * 모두 모달을 열어 경험을 통일한다.  서버 컴포넌트(LotteryCounter)
 * 안에서도 client island 라 사용 가능.
 */
export function LotteryGuideInfoButton({
  className,
  ariaLabel,
  size = 14,
}: {
  className?: string;
  ariaLabel: string;
  size?: number;
}) {
  const { open } = useLotteryGuideModal();
  return (
    <button
      type="button"
      onClick={open}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={className}
    >
      <Info style={{ width: size, height: size }} />
    </button>
  );
}
