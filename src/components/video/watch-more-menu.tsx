"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Flag, MoreHorizontal } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { createVideoReportAction } from "@/app/actions/reports";

export function WatchMoreMenu({ videoId }: { videoId: string }) {
  const { t } = useI18n();

  // `as const` so each entry's `value` is inferred as its literal
  // string.  ReportScope / ReportReason below derive from these
  // arrays, keeping the union in sync if a new option is added.
  // Must match the inline literal unions in
  // `createVideoReportAction(...)` (src/app/actions/reports.ts).
  const scopeOptions = [
    { value: "video", label: t("watchMore.scope.video", "Video") },
    { value: "audio", label: t("watchMore.scope.audio", "Audio") },
    { value: "thumbnail", label: t("watchMore.scope.thumbnail", "Thumbnail") },
    { value: "caption", label: t("watchMore.scope.caption", "Captions") },
    { value: "comment", label: t("watchMore.scope.comment", "Comments") },
  ] as const;

  const reasonOptions = [
    { value: "spam", label: t("watchMore.reason.spam", "Spam / scam") },
    { value: "copyright", label: t("watchMore.reason.copyright", "Copyright infringement") },
    { value: "harassment", label: t("watchMore.reason.harassment", "Harassment") },
    { value: "sexual", label: t("watchMore.reason.sexual", "Sexual content") },
    { value: "violence", label: t("watchMore.reason.violence", "Violence") },
    { value: "hate", label: t("watchMore.reason.hate", "Hate speech") },
    { value: "misinfo", label: t("watchMore.reason.misinfo", "Misinformation") },
    { value: "other", label: t("watchMore.reason.other", "Other") },
  ] as const;

  type ReportScope = (typeof scopeOptions)[number]["value"];
  type ReportReason = (typeof reasonOptions)[number]["value"];

  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [scope, setScope] = useState<ReportScope>("video");
  const [reason, setReason] = useState<ReportReason>("spam");
  const [detail, setDetail] = useState("");
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleMenu = () => {
    if (open) {
      setOpen(false);
    } else {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 8,
          left: rect.right - 180,
        });
      }
      setOpen(true);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white sm:h-9 sm:w-9 sm:rounded-md"
        aria-label={t("watchMore.report", "Report")}
      >
        <MoreHorizontal className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      </button>
      {open && dropdownPos ? (
        <div
          className="anim-pop fixed z-[100] w-[180px] origin-top-right overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c12] p-1 shadow-2xl ring-1 ring-black/40"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setReportOpen(true);
            }}
            className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-[13px] font-medium text-white/75 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <Flag className="h-3.5 w-3.5 shrink-0" />
            {t("watchMore.report", "Report")}
          </button>
        </div>
      ) : null}
      {reportOpen ? (
        <div className="anim-scrim fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => { setReportOpen(false); setDetail(""); }}>
          <div
            className="anim-modal w-full max-w-[480px] rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h3 className="text-[16px] font-bold text-white">
                {t("watchMore.report.title", "Report")}
              </h3>
            </div>

            <p className="mb-5 text-[13px] text-white/55">
              {t("watchMore.report.description", "Select what you're reporting and why")}
            </p>

            <div className="mb-4">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                {t("watchMore.scope.label", "What are you reporting?")}
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as ReportScope)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#7F77DD]/40"
              >
                {scopeOptions.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#0a0a0a]">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                {t("watchMore.reason.label", "Reason")}
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#7F77DD]/40"
              >
                {reasonOptions.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#0a0a0a]">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                {t("watchMore.detail.label", "Additional details")}
                <span className="ml-1 text-[10px] font-normal normal-case tracking-normal text-white/35">
                  ({t("watchMore.detail.optional", "optional")})
                </span>
              </label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder={t("watchMore.detail.placeholder", "Tell us anything else that would help")}
                className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-[#7F77DD]/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setReportOpen(false); setDetail(""); }}
                className="whitespace-nowrap rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[13px] font-bold text-white/80 transition hover:bg-white/[0.06]"
                disabled={pending}
              >
                {t("watchMore.cancel", "Cancel")}
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
                  alert(t("watchMore.reportThanks", "Thanks for your report. We'll review it shortly."));
                }}
                className="whitespace-nowrap rounded-lg bg-red-500 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
                disabled={pending}
              >
                {pending ? t("watchMore.submitting", "Submitting...") : t("watchMore.submit", "Submit report")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
