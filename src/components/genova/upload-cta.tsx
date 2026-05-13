"use client";

import { Upload, Sparkles } from "lucide-react";
import { useUploadModal } from "@/components/upload/upload-modal-context";

export function UploadCTA() {
  const { open: openUploadModal } = useUploadModal();

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/40 px-8 py-10 backdrop-blur-xl transition-colors duration-200 hover:border-white/15 sm:px-12 sm:py-12">
      <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
            <Sparkles className="h-5 w-5 text-[#AFA9EC]" />
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <span className="text-[11px] text-[#7F77DD]">✦</span>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                Join the Community
              </p>
            </div>
            <h3
              className="text-[24px] font-black tracking-tight text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              Share your AI film
            </h3>
            <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-white/55">
              Upload to the feed, join competitions, and reach viewers on Genova.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openUploadModal()}
          className="group flex shrink-0 items-center gap-2 rounded-xl px-7 py-3 text-[14px] font-bold text-white transition-all duration-300 hover:scale-[1.03]"
          style={{
            background: "linear-gradient(135deg, rgba(107,95,212,0.95) 0%, rgba(83,74,183,0.85) 50%, rgba(63,54,163,0.75) 100%)",
            border: "1px solid rgba(175,169,236,0.4)",
            boxShadow: "0 4px 16px rgba(83,74,183,0.4), 0 0 24px rgba(83,74,183,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          <Upload className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
          Start Upload
        </button>
      </div>
    </section>
  );
}
