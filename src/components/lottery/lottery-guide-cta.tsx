"use client";

import Link from "next/link";
import { useUploadModal } from "@/components/upload/upload-modal-context";

/**
 * 응모권 안내의 하단 CTA (업로드 / 공모전 보기).
 *
 * LotteryGuideContent 는 server(page)/client(modal) 양쪽에서 쓰는
 * 순수 렌더라 useUploadModal 훅을 직접 못 쓴다 → CTA 만 client
 * island 로 분리.
 *
 * onNavigate: 모달에서 쓸 때 모달 close 를 넘긴다.  업로드 팝업이
 * 뜨거나 공모전 페이지로 이동할 때 응모권 안내 모달이 함께 닫히도록.
 * page 변형에서는 넘기지 않음(undefined) → 그대로 동작.
 */
export function LotteryGuideCta({
  uploadLabel,
  competitionLabel,
  onNavigate,
}: {
  uploadLabel: string;
  competitionLabel: string;
  onNavigate?: () => void;
}) {
  const { open: openUploadModal } = useUploadModal();

  return (
    <div className="mt-10 flex flex-wrap justify-center gap-3">
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          openUploadModal();
        }}
        className="rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(107,95,212,0.85) 0%, rgba(83,74,183,0.75) 50%, rgba(63,54,163,0.65) 100%)",
          border: "1px solid rgba(175,169,236,0.25)",
        }}
      >
        {uploadLabel}
      </button>
      <Link
        href="/competition"
        onClick={() => onNavigate?.()}
        className="rounded-xl border px-5 py-2.5 text-[13px] font-semibold text-white/80 transition hover:text-white"
        style={{
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        {competitionLabel}
      </Link>
    </div>
  );
}
