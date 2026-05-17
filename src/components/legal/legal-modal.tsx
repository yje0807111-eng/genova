"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useExitAnimation } from "@/lib/hooks/use-exit-animation";
import { LegalBody } from "@/components/legal/legal-page";

/**
 * Footer Terms/Privacy popup. `kind === null` closed; otherwise shows
 * the corresponding legal doc (same content as /terms · /privacy).
 */
export function LegalModal({
  kind,
  onClose,
}: {
  kind: "terms" | "privacy" | null;
  onClose: () => void;
}) {
  const { render, closing } = useExitAnimation(kind !== null, 200);
  if (!render || typeof window === "undefined") return null;

  return createPortal(
    <div
      className={`${closing ? "anim-scrim-out" : "anim-scrim"} fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[6vh] backdrop-blur-sm`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${closing ? "anim-modal-out" : "anim-modal"} relative mb-[6vh] w-full max-w-[680px] rounded-2xl border border-white/[0.08] bg-[#0a0a0a] px-6 py-7 text-white sm:px-8`}
        style={{ boxShadow: "0 30px 70px rgba(0,0,0,0.5)" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/55 transition hover:border-white/20 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        {kind ? <LegalBody kind={kind} /> : null}
      </div>
    </div>,
    document.body,
  );
}
