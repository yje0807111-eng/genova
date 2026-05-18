"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";

/**
 * 참여자 수 옆 ⓘ — 출품작 수와 참여자 수가 다른 이유 + 1인 1상
 * 규칙을 알려주는 경량 클릭 팝오버.
 */
export function ParticipantsInfo({ className }: { className?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("competition.detail.participantsInfoAria", "참여자 안내")}
        className={className}
      >
        <Info style={{ width: 12, height: 12 }} />
      </button>
      {open ? (
        <div
          role="tooltip"
          className="anim-pop absolute left-0 top-[calc(100%+8px)] z-50 w-[280px] rounded-xl border border-white/[0.1] bg-[#0c0c12] px-4 py-3.5 text-left shadow-2xl ring-1 ring-black/40"
        >
          <p className="break-keep text-[12.5px] leading-[1.7] text-white/75">
            {t(
              "competition.detail.participantsInfo",
              "One creator can submit multiple entries, so the number of entries may exceed the number of participants. However, only one award per person is allowed.",
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}
