"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { UploadVideoFormSimple } from "./upload-video-form-simple";
import { UploadLotteryBadge } from "@/components/lottery/upload-lottery-badge";
import { getUploadCompetitionData } from "@/app/actions/competitions";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type OpenOptions = {
  competitionId?: string | null;
};

type UploadModalContextValue = {
  isOpen: boolean;
  open: (options?: OpenOptions) => void;
  close: () => void;
};

const UploadModalContext = createContext<UploadModalContextValue | null>(null);

export function useUploadModal() {
  const ctx = useContext(UploadModalContext);
  if (!ctx) throw new Error("useUploadModal must be used within UploadModalProvider");
  return ctx;
}

export function UploadModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [prefilledCompetitionId, setPrefilledCompetitionId] = useState<string | null>(null);
  const [competitions, setCompetitions] = useState<{ id: string; title: string }[]>([]);
  const [activeCompetitionId, setActiveCompetitionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // getBrowserSupabaseClient() returns null when the public Supabase
    // env vars are missing.  Bail then — `userId` stays null, the
    // upload modal's `userId && createPortal(…)` gate ensures the form
    // never mounts without an authenticated user.
    const client = getBrowserSupabaseClient();
    if (!client) return;
    client.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const open = useCallback(async (options?: OpenOptions) => {
    if (!userId) {
      window.location.href = "/auth";
      return;
    }

    setPrefilledCompetitionId(options?.competitionId ?? null);
    setIsOpen(true);

    if (competitions.length === 0) {
      setLoading(true);
      try {
        const data = await getUploadCompetitionData();
        setCompetitions(data.competitions);
        setActiveCompetitionId(data.activeCompetitionId);
      } catch (err) {
        console.error("Failed to fetch upload data:", err);
      } finally {
        setLoading(false);
      }
    }
  }, [userId, competitions.length]);

  const close = useCallback(() => {
    setIsOpen(false);
    setPrefilledCompetitionId(null);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <UploadModalContext.Provider value={{ isOpen, open, close }}>
      {children}

      {isOpen && typeof window !== "undefined" && userId && createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 pt-[5vh]"
          onClick={close}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6 mb-[5vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-white">
                {t("upload.modalTitle", "영상 업로드")}
              </h2>
              <button
                type="button"
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] text-white/55 transition hover:border-white/[0.12] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-white/45">
                {t("common.loading", "불러오는 중...")}
              </div>
            ) : (
              <>
                {/* 업로드 페이지의 LotteryCounter 와 동일하게 이번 달
                    응모권 현황을 팝업에서도 노출 */}
                <UploadLotteryBadge />
                <UploadVideoFormSimple
                  userId={userId}
                  competitions={competitions}
                  activeCompetitionId={activeCompetitionId ?? undefined}
                  prefilledCompetitionId={prefilledCompetitionId}
                  onSubmitted={close}
                />
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </UploadModalContext.Provider>
  );
}
