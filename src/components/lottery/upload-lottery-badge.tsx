"use client";

import { useEffect, useState } from "react";
import { Ticket } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";

/**
 * 업로드 팝업 상단의 이번 달 응모권 표시 (client).
 *
 * 업로드 페이지의 LotteryCounter(server) 와 같은 정보를 모달에서도
 * 보여주기 위한 경량 client 버전.  /api/lottery/my-count 로 used
 * 수를 읽어 "이번 달 응모권 N/5" 로 표기 (전 화면 used 기준 통일).
 * 비로그인/미설정이면 렌더 안 함.
 */
export function UploadLotteryBadge() {
  const { t } = useI18n();
  const [used, setUsed] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/lottery/my-count")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        const total = d?.count?.total;
        setUsed(typeof total === "number" ? total : null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // 로딩 중에도 동일 높이의 자리표시자를 렌더해 폼이 뒤늦게
  // 밀려나는 레이아웃 점프를 방지.
  if (used === null) {
    return (
      <div
        className="mb-4 flex animate-pulse items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px]"
        aria-hidden
      >
        <Ticket className="h-3.5 w-3.5 text-white/15" />
        <span className="h-3 w-28 rounded bg-white/[0.06]" />
      </div>
    );
  }
  const depleted = used >= 5;

  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[12px]">
      <Ticket className="h-3.5 w-3.5 text-[#AFA9EC]/80" aria-hidden />
      <span className="text-white/45">
        {t("lottery.title", "이번 달 응모권")}
      </span>
      <span className="font-bold tabular-nums text-white">
        {used}
        <span className="font-normal text-white/40">/5</span>
      </span>
      {depleted ? (
        <span className="ml-auto text-[11px] text-amber-300/85">
          {t("lottery.depleted", "이번 달 응모권을 모두 사용했습니다")}
        </span>
      ) : null}
    </div>
  );
}
