"use client";

import { useEffect, useRef, useState } from "react";
import { Flag, MoreHorizontal } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";

export function WatchMoreMenu() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30 text-[#AFA9EC] backdrop-blur-sm transition hover:bg-black/50 hover:text-white"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute left-0 top-10 z-20 min-w-[160px] rounded-xl border border-white/10 bg-[#1A1535] p-1.5 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              alert(t("watch.reportThanks"));
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-white/5 transition"
          >
            <Flag className="h-4 w-4" />
            {t("watch.report")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
