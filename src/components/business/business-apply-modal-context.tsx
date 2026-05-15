"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { BusinessApplyClient } from "./business-apply-client";

type BusinessApplyModalContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const BusinessApplyModalContext = createContext<BusinessApplyModalContextValue | null>(null);

export function useBusinessApplyModal() {
  const ctx = useContext(BusinessApplyModalContext);
  if (!ctx) throw new Error("useBusinessApplyModal must be used within BusinessApplyModalProvider");
  return ctx;
}

export function BusinessApplyModalProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <BusinessApplyModalContext.Provider value={{ isOpen, open, close }}>
      {children}

      {isOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[5vh] backdrop-blur-sm"
            onClick={close}
          >
            <div
              className="relative mb-[5vh] w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-white">
                  {t("business.applyTitle")}
                </h2>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] text-white/55 transition hover:border-white/[0.12] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <BusinessApplyClient variant="modal" onClose={close} />
            </div>
          </div>,
          document.body,
        )}
    </BusinessApplyModalContext.Provider>
  );
}
