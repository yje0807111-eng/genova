"use client";

import type { RefObject } from "react";
import { adminTokens } from "@/lib/admin-styles";
import type { EditCompetitionFormState } from "./types";

export function EditCompetitionImageFields({
  setForm,
  thumbInputRef,
  sponsorLogoInputRef,
  thumbnailPreview,
  setThumbnailPreview,
  sponsorLogoPreview,
  setSponsorLogoPreview,
}: {
  setForm: (updater: (p: EditCompetitionFormState) => EditCompetitionFormState) => void;
  thumbInputRef: RefObject<HTMLInputElement | null>;
  sponsorLogoInputRef: RefObject<HTMLInputElement | null>;
  thumbnailPreview: string | null;
  setThumbnailPreview: (value: string | null) => void;
  sponsorLogoPreview: string | null;
  setSponsorLogoPreview: (value: string | null) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={adminTokens.inputLabel}>공모전 썸네일</label>
        {thumbnailPreview ? (
          <div className="relative overflow-hidden rounded-xl border border-white/[0.08]">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob: URI or persisted URL after upload; next/image not applicable to blob */}
            <img src={thumbnailPreview} alt="" className="aspect-video w-full object-cover" />
            <button
              type="button"
              onClick={() => thumbInputRef.current?.click()}
              className="absolute right-12 top-2 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/90"
            >
              변경
            </button>
            <button
              type="button"
              onClick={() => {
                setThumbnailPreview(null);
                setForm((p) => ({ ...p, thumbnailUrl: "" }));
                if (thumbInputRef.current) thumbInputRef.current.value = "";
              }}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white/70 backdrop-blur-sm transition hover:bg-red-500/70 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => thumbInputRef.current?.click()}
            className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#7F77DD]/25 bg-white/[0.02] transition hover:border-[#7F77DD]/50"
          >
            <svg className="h-6 w-6 text-[#7F77DD]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 16v-8m0 0-3 3m3-3 3 3M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-xs text-white/30">썸네일 업로드</p>
          </button>
        )}
      </div>
      <div>
        <label className={adminTokens.inputLabel}>스폰서 로고</label>
        {sponsorLogoPreview ? (
          <div className="relative overflow-hidden rounded-xl border border-white/[0.08] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob: URI or persisted URL after upload; next/image not applicable to blob */}
            <img src={sponsorLogoPreview} alt="" className="h-16 object-contain" />
            <button
              type="button"
              onClick={() => sponsorLogoInputRef.current?.click()}
              className="absolute right-12 top-2 rounded-lg bg-black/70 px-2 py-1 text-xs text-white"
            >
              변경
            </button>
            <button
              type="button"
              onClick={() => {
                setSponsorLogoPreview(null);
                setForm((p) => ({ ...p, sponsorLogoUrl: "" }));
                if (sponsorLogoInputRef.current) sponsorLogoInputRef.current.value = "";
              }}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white/70 backdrop-blur-sm transition hover:bg-red-500/70 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => sponsorLogoInputRef.current?.click()}
            className="flex h-20 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] transition hover:border-white/20"
          >
            <p className="text-xs text-white/30">스폰서 로고 업로드</p>
          </button>
        )}
      </div>
    </div>
  );
}
