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
    { value: "video", label: t("report.scope.video", "영상") },
    { value: "audio", label: t("report.scope.audio", "오디오") },
    { value: "thumbnail", label: t("report.scope.thumbnail", "썸네일") },
    { value: "caption", label: t("report.scope.caption", "자막") },
    { value: "comment", label: t("report.scope.comment", "댓글 영역") },
  ] as const;

  const reasonOptions = [
    { value: "spam", label: t("report.reason.spam", "스팸/사기") },
    { value: "copyright", label: t("report.reason.copyright", "저작권 침해") },
    { value: "harassment", label: t("report.reason.harassment", "괴롭힘") },
    { value: "sexual", label: t("report.reason.sexual", "성적 콘텐츠") },
    { value: "violence", label: t("report.reason.violence", "폭력") },
    { value: "hate", label: t("report.reason.hate", "혐오 발언") },
    { value: "misinfo", label: t("report.reason.misinfo", "허위 정보") },
    { value: "other", label: t("report.reason.other", "기타") },
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
          left: rect.right - 160,
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
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30 text-[#AFA9EC] backdrop-blur-sm transition hover:bg-black/50 hover:text-white"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && dropdownPos ? (
        <div
          className="fixed z-[100] min-w-[160px] rounded-xl border border-white/10 bg-[#1A1535] p-1.5 shadow-xl"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => { setReportOpen(false); setDetail(""); }}>
          <div
            className="w-full max-w-[480px] rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h3 className="text-[16px] font-bold text-white">
                {t("report.title", "신고하기")}
              </h3>
            </div>

            <p className="mb-5 text-[13px] text-white/55">
              {t("report.description", "신고 범위와 사유를 선택해주세요")}
            </p>

            <div className="mb-4">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                {t("report.scope.label", "신고 범위")}
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
                {t("report.reason.label", "신고 사유")}
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
                {t("report.detail.label", "상세 내용")}
                <span className="ml-1 text-[10px] font-normal normal-case tracking-normal text-white/35">
                  ({t("report.detail.optional", "선택")})
                </span>
              </label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder={t("report.detail.placeholder", "추가로 알려주실 내용이 있다면 작성해주세요")}
                className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-[#7F77DD]/40"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setReportOpen(false); setDetail(""); }}
                className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[13px] font-bold text-white/80 transition hover:bg-white/[0.06]"
                disabled={pending}
              >
                {t("report.cancel", "취소")}
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
                className="rounded-lg bg-red-500 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
                disabled={pending}
              >
                {pending ? t("report.submitting", "제출 중...") : t("report.submit", "신고 제출")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
