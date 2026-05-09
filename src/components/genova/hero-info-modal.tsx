"use client";

import { useEffect, useMemo, useState } from "react";
import type { Video } from "@/lib/types";

type Props = {
  videos: Video[];
};

type HeroInfoEvent = CustomEvent<{ videoId?: string }>;

export function HeroInfoModal({ videos }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedVideo = useMemo(
    () => videos.find((video) => video.id === selectedId) ?? null,
    [videos, selectedId],
  );

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as HeroInfoEvent).detail;
      if (!detail?.videoId) return;
      setSelectedId(detail.videoId);
      setOpen(true);
    };

    window.addEventListener("open-hero-info", handleOpen as EventListener);
    return () => window.removeEventListener("open-hero-info", handleOpen as EventListener);
  }, []);

  if (!open || !selectedVideo) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0c0a1d] p-6 text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-xl font-bold">{selectedVideo.title}</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md border border-white/20 px-2 py-1 text-sm text-white/70 hover:text-white"
          >
            닫기
          </button>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">
          {selectedVideo.description?.trim() || "추가 정보가 없습니다."}
        </p>
      </div>
    </div>
  );
}
