"use client";

import { useState } from "react";
import Link from "next/link";
import { Gift, X } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import {
  getCurrentMonthWinners,
  type PublicMonthlyWinner,
} from "@/app/actions/lottery-public";

// 홈 히어로의 "공모전 참여하기" 옆 — 이번 달 글로벌 응모권 추첨
// 당첨자를 팝업으로 확인. (공모전별 결과 페이지 대체)
export function LotteryWinnersButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [monthKey, setMonthKey] = useState("");
  const [winners, setWinners] = useState<PublicMonthlyWinner[]>([]);

  const openModal = async () => {
    setOpen(true);
    if (loaded) return;
    setLoading(true);
    try {
      const res = await getCurrentMonthWinners();
      setMonthKey(res.monthKey);
      setWinners(res.winners);
      setLoaded(true);
    } catch {
      /* keep empty on failure */
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="group inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-[13px] font-bold text-white backdrop-blur-xl transition hover:border-[#7F77DD]/50 hover:bg-[#534AB7]/15"
      >
        <Gift className="h-3.5 w-3.5" />
        {t("lottery.winnersButton", "응모권 당첨자")}
      </button>

      {open ? (
        <div
          className="anim-scrim fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="anim-modal relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-white/40 transition hover:text-white"
              aria-label={t("common.close", "닫기")}
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#AFA9EC]">
              {t("lottery.winnersEyebrow", "Genova 응모권 추첨")}
            </p>
            <h2 className="mt-1 text-[20px] font-black text-white">
              {t("lottery.winnersTitle", "이번 달 당첨자")}
              {monthKey ? (
                <span className="ml-2 text-[13px] font-bold text-white/40">
                  {monthKey}
                </span>
              ) : null}
            </h2>

            <div className="mt-5">
              {loading ? (
                <p className="py-8 text-center text-[13px] text-white/40">
                  {t("common.loading", "불러오는 중…")}
                </p>
              ) : winners.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-white/40">
                  {t("lottery.winnersEmpty", "아직 이번 달 추첨이 진행되지 않았습니다.")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {winners.map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#534AB7]/20 text-[12px] font-black text-[#AFA9EC]">
                        {w.prizeTier}
                      </span>
                      <span className="min-w-0 flex-1">
                        {w.videoId ? (
                          <Link
                            href={`/watch/${w.videoId}`}
                            className="line-clamp-1 text-[13px] font-bold text-white hover:text-[#AFA9EC]"
                          >
                            {w.videoTitle || w.creatorName}
                          </Link>
                        ) : (
                          <span className="line-clamp-1 text-[13px] font-bold text-white">
                            {w.creatorName}
                          </span>
                        )}
                        <span className="block text-[11px] text-white/45">
                          {w.creatorName}
                        </span>
                      </span>
                      <span className="shrink-0 text-[14px] font-bold tabular-nums text-[#F5D182]">
                        ${w.prizeAmountUsd}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="mt-5 text-[11px] leading-relaxed text-white/35">
              {t(
                "lottery.winnersFootnote",
                "영상을 업로드하면 응모권이 발급되어 매월 전체 풀에서 추첨됩니다.",
              )}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
