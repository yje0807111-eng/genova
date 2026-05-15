"use client";

import { useUploadModal } from "@/components/upload/upload-modal-context";

/**
 * 응모권 안내의 "영상 업로드하기" CTA.
 *
 * LotteryGuideContent 는 서버(page)/클라(모달) 양쪽에서 쓰이는
 * 순수 렌더 컴포넌트라 useUploadModal 훅을 직접 못 쓴다.  이 작은
 * client island 만 분리해 업로드 모달을 연다 (업로드 전용 페이지는
 * 폐기 — 항상 팝업).
 */
export function LotteryUploadCta({ label }: { label: string }) {
  const { open } = useUploadModal();
  return (
    <button
      type="button"
      onClick={() => open()}
      className="rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(107,95,212,0.85) 0%, rgba(83,74,183,0.75) 50%, rgba(63,54,163,0.65) 100%)",
        border: "1px solid rgba(175,169,236,0.25)",
      }}
    >
      {label}
    </button>
  );
}
