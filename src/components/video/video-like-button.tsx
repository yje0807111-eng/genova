"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toggleLikeAction } from "@/app/actions/engagement";

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

  const size = compact ? "h-4 w-4" : "h-6 w-6";
  const textSize = compact ? "text-[10px]" : "text-sm";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className={`inline-flex rounded-full bg-black/45 text-[#EEEDFE] backdrop-blur-sm transition hover:bg-black/60 disabled:opacity-50 ${
        stacked ? "flex-col items-center gap-0.5 px-2 py-2" : "inline-flex items-center gap-1 px-1.5 py-0.5"
      } ${className ?? ""}`}
      aria-label="likes"
    >
      <svg className={`${size} shrink-0`} viewBox="0 0 24 24" aria-hidden>
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          className={liked ? "fill-rose-500 stroke-rose-500" : "fill-none stroke-[#AFA9EC]"}
          strokeWidth="1.5"
        />
      </svg>
      <span className={`min-w-[1rem] font-medium tabular-nums ${textSize}`}>{count}</span>
    </button>
  );
}
