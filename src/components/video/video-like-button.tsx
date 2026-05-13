"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toggleLikeAction } from "@/app/actions/engagement";
import { useI18n } from "@/components/genova/language-provider";

type Props = {
  videoId: string;
  initialCount: number;
  initialLiked: boolean;
  compact?: boolean;
  /** Icon above count (e.g. Shorts rail) */
  stacked?: boolean;
  /** Prevent click propagation in nested cards/modals */
  className?: string;
};

export function VideoLikeButton({ videoId, initialCount, initialLiked, compact, stacked, className }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setCount(initialCount);
    setLiked(initialLiked);
  }, [videoId, initialCount, initialLiked]);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await toggleLikeAction(videoId);
      if (!res.ok) {
        if ("needAuth" in res && res.needAuth) router.push("/auth");
        return;
      }
      setLiked(res.liked);
      setCount(res.count);
      router.refresh();
    });
  };

  const size = "h-4 w-4";
  const textSize = compact ? "text-xs" : "text-sm";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className={`inline-flex ${stacked ? "flex-col items-center gap-0.5" : "items-center gap-1.5"} rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm transition hover:bg-white/10 hover:text-white disabled:opacity-50 ${
        liked ? "border-rose-400/40 bg-rose-500/15 text-rose-300" : "text-white/55"
      } ${className ?? ""}`}
      aria-label={t("video.likesAria")}
    >
      <svg className={`${size} shrink-0`} viewBox="0 0 24 24" aria-hidden>
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          className={liked ? "fill-rose-400 stroke-rose-300" : "fill-none stroke-white/60"}
          strokeWidth="1.5"
        />
      </svg>
      <span className={`min-w-[1rem] font-medium tabular-nums ${textSize}`}>{count}</span>
    </button>
  );
}
