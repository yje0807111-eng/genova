"use client";

import { useEffect, useRef, useState } from "react";
import { Flag, MoreHorizontal } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { createVideoReportAction } from "@/app/actions/reports";

const SCOPE_OPTIONS = [
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "thumbnail", label: "Thumbnail" },
  { value: "caption", label: "Caption/Subtitles" },
  { value: "comment", label: "Comment Area" },
] as const;

const REASON_OPTIONS = [
  { value: "spam", label: "Spam / Scam" },
  { value: "copyright", label: "Copyright" },
  { value: "harassment", label: "Harassment" },
  { value: "sexual", label: "Sexual Content" },
  { value: "violence", label: "Violence" },
  { value: "hate", label: "Hate Speech" },
  { value: "misinfo", label: "Misinformation" },
  { value: "other", label: "Other" },
] as const;

export function WatchMoreMenu({ videoId }: { videoId: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [scope, setScope] = useState<(typeof SCOPE_OPTIONS)[number]["value"]>("video");
  const [reason, setReason] = useState<(typeof REASON_OPTIONS)[number]["value"]>("spam");
  const [detail, setDetail] = useState("");
  const [pending, setPending] = useState(false);
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
              setReportOpen(true);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-white/5 transition"
          >
            <Flag className="h-4 w-4" />
            {t("watch.report")}
          </button>
        </div>
      ) : null}
      {reportOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#151230] p-4">
            <h3 className="text-base font-semibold text-white">{t("watch.report", "Report")}</h3>
            <p className="mt-1 text-xs text-white/50">Choose report scope and reason for this video.</p>

            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-white/60">Scope</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as (typeof SCOPE_OPTIONS)[number]["value"])}
                  className="w-full rounded-lg border border-white/10 bg-[#0f0d24] px-3 py-2 text-sm text-white outline-none"
                >
                  {SCOPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/60">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as (typeof REASON_OPTIONS)[number]["value"])}
                  className="w-full rounded-lg border border-white/10 bg-[#0f0d24] px-3 py-2 text-sm text-white outline-none"
                >
                  {REASON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/60">Details (optional)</label>
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="w-full resize-none rounded-lg border border-white/10 bg-[#0f0d24] px-3 py-2 text-sm text-white outline-none"
                  placeholder={t("watch.reportDetailPlaceholder")}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReportOpen(false);
                  setDetail("");
                }}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 hover:bg-white/5"
                disabled={pending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setPending(true);
                  const res = await createVideoReportAction({ videoId, scope, reason, detail });
                  setPending(false);
                  if (!res.ok) {
                    alert(res.message);
                    return;
                  }
                  setReportOpen(false);
                  setDetail("");
                  alert(t("watch.reportThanks"));
                }}
                className="rounded-lg bg-[#7F77DD] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#9189ee] disabled:opacity-60"
                disabled={pending}
              >
                {pending ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
