"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, ArrowUpRight } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { LotteryGuideContent } from "./lottery-guide-content";

/**
 * 응모권 안내 모달 — 사이드바 응모권 칸 등에서 빠르게 띄움.
 * 본문은 /lottery 페이지와 동일한 <LotteryGuideContent> 공유.
 * 모달 하단에 "전체 페이지로 보기" → /lottery (공유·SEO·푸터 링크
 * 유지).  인증 불필요 (정보성).
 */

type LotteryGuideModalContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const Ctx = createContext<LotteryGuideModalContextValue | null>(null);

export function useLotteryGuideModal() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error(
      "useLotteryGuideModal must be used within LotteryGuideModalProvider",
    );
  return ctx;
}

export function LotteryGuideModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Esc 닫기
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <Ctx.Provider value={{ isOpen, open, close }}>
      {children}

      {isOpen && typeof window !== "undefined" &&
        createPortal(
          <div
            className="anim-scrim fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[5vh] backdrop-blur-sm"
            onClick={close}
          >
            <div
              className="anim-modal relative mb-[5vh] w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={close}
                  aria-label={t("common.close", "닫기")}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] text-white/55 transition hover:border-white/[0.12] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <LotteryGuideContent
                locale={locale}
                variant="modal"
                onNavigate={close}
              />

              <div className="mt-6 border-t border-white/[0.06] pt-4 text-center">
                <Link
                  href="/lottery"
                  onClick={close}
                  className="inline-flex items-center gap-1 text-[12px] text-white/45 transition hover:text-[#AFA9EC]"
                >
                  {t("lottery.guideFullPage", "전체 페이지로 보기")}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </Ctx.Provider>
  );
}
