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
          className="anim-pop absolute left-0 top-[calc(100%+10px)] z-50 w-[420px] max-w-[80vw] overflow-hidden rounded-xl px-4 py-3.5 text-left ring-1 ring-[#7F77DD]/25"
          style={{
            background:
              "linear-gradient(150deg, rgba(127,119,221,0.16) 0%, rgba(20,18,38,0.98) 45%, rgba(12,12,18,0.98) 100%)",
            boxShadow:
              "0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(127,119,221,0.18)",
          }}
        >
          <span
            className="pointer-events-none absolute -top-px left-5 h-px w-16 rounded-full"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(175,169,236,0.7), transparent)",
            }}
            aria-hidden
          />
          <p className="break-keep text-[12.5px] leading-[1.7] text-white/80">
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
