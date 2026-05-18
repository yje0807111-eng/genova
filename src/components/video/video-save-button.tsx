"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleSaveAction } from "@/app/actions/engagement";
import { useI18n } from "@/components/genova/language-provider";

type Props = {
  videoId: string;
  initialSaved: boolean;
  initialCount?: number;
  compact?: boolean;
  className?: string;
};

export function VideoSaveButton({ videoId, initialSaved, initialCount, className }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount ?? 0);
  const [pending, startTransition] = useTransition();

  // Reset local (optimistic) state when the source props change — the
  // documented "store previous value, adjust during render" pattern
  // (replaces a setState-in-effect; no post-paint flicker).
  const [prevKey, setPrevKey] = useState({ videoId, initialSaved, initialCount });
  if (
    prevKey.videoId !== videoId ||
    prevKey.initialSaved !== initialSaved ||
    prevKey.initialCount !== initialCount
  ) {
    setPrevKey({ videoId, initialSaved, initialCount });
    setSaved(initialSaved);
    setCount(initialCount ?? 0);
  }

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await toggleSaveAction(videoId);
      if (!res.ok) {
        if ("needAuth" in res && res.needAuth) router.push("/auth");
        return;
      }
      setSaved(res.saved);
      setCount(res.count);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm transition hover:bg-white/10 hover:text-white disabled:opacity-50 ${
        saved ? "border-amber-400/45 bg-amber-400/15 text-amber-300" : "text-white/55"
      } ${className ?? ""}`}
      aria-label={saved ? t("video.saved") : t("video.save")}
      title={saved ? t("video.saved") : t("video.save")}
    >
      <svg
        className={`h-4 w-4 shrink-0 ${saved ? "fill-amber-300 stroke-amber-200" : "fill-none stroke-white/60"} stroke-[1.6]`}
        viewBox="0 0 24 24"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinejoin="round" />
      </svg>
      <span className="min-w-[1rem] font-medium tabular-nums text-sm">
        {count > 99 ? "99+" : count}
      </span>
    </button>
  );
}
