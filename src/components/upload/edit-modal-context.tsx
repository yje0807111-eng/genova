"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { EditVideoFormSimple } from "./edit-video-form-simple";
import { getVideoForEdit } from "@/app/actions/video";
import { getUploadCompetitionData } from "@/app/actions/competitions";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type EditModalContextValue = {
  isOpen: boolean;
  open: (videoId: string) => void;
  close: () => void;
};

const EditModalContext = createContext<EditModalContextValue | null>(null);

export function useEditModal() {
  const ctx = useContext(EditModalContext);
  if (!ctx) throw new Error("useEditModal must be used within EditModalProvider");
  return ctx;
}

export function EditModalProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [video, setVideo] = useState<any | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [competitions, setCompetitions] = useState<{ id: string; title: string }[]>([]);
  const [activeCompetitionId, setActiveCompetitionId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // getBrowserSupabaseClient() returns null when the public Supabase
    // env vars are missing.  Bail in that case — `userId` stays null and
    // the edit modal will never reach the form (the `video && userId`
    // gate below covers it).
    const client = getBrowserSupabaseClient();
    if (!client) return;
    client.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const open = useCallback(async (videoId: string) => {
    setIsOpen(true);
    setLoading(true);
    setError(null);
    setVideo(null);

    try {
      const [videoResult, compData] = await Promise.all([
        getVideoForEdit(videoId),
        getUploadCompetitionData(),
      ]);

      if (videoResult.ok) {
        setVideo(videoResult.video);
      } else {
        setError(videoResult.error);
      }

      setCompetitions(compData.competitions);
      setActiveCompetitionId(compData.activeCompetitionId ?? undefined);
    } catch {
      setError("Failed to load video");
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setVideo(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <EditModalContext.Provider value={{ isOpen, open, close }}>
      {children}

      {isOpen && typeof window !== "undefined" && createPortal(
        <div
          className="anim-scrim fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 pt-[5vh]"
          onClick={close}
        >
          <div
            className="anim-modal relative w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6 mb-[5vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-white">
                {t("profile.editVideo", "영상 편집")}
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
              <div className="animate-pulse space-y-5" aria-hidden>
                <div className="aspect-video w-full rounded-xl bg-white/[0.04]" />
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-white/[0.05]" />
                  <div className="h-10 w-full rounded-lg bg-white/[0.04]" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-16 rounded bg-white/[0.05]" />
                  <div className="flex gap-2">
                    {[64, 88, 72, 60, 68].map((w, i) => (
                      <div
                        key={i}
                        className="h-9 rounded-full bg-white/[0.04]"
                        style={{ width: w }}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-24 rounded bg-white/[0.05]" />
                  <div className="h-20 w-full rounded-lg bg-white/[0.04]" />
                </div>
                <div className="h-11 w-full rounded-full bg-white/[0.05]" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-red-400">
                {error}
              </div>
            ) : video && userId ? (
              <div className="anim-fade">
                <EditVideoFormSimple
                  video={video}
                  userId={userId}
                  competitions={competitions}
                  activeCompetitionId={activeCompetitionId}
                />
              </div>
            ) : null}
          </div>
        </div>,
        document.body,
      )}
    </EditModalContext.Provider>
  );
}
