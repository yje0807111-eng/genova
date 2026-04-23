"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toggleSaveAction } from "@/app/actions/engagement";

type Props = {
  videoId: string;
  initialSaved: boolean;
  compact?: boolean;
  className?: string;
};

export function VideoSaveButton({ videoId, initialSaved, compact, className }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSaved(initialSaved);
  }, [videoId, initialSaved]);

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
      router.refresh();
    });
  };

  const size = compact ? "h-4 w-4" : "h-6 w-6";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className={`inline-flex items-center rounded-full bg-black/45 p-1.5 text-[#EEEDFE] backdrop-blur-sm transition hover:bg-black/60 disabled:opacity-50 ${className ?? ""}`}
      aria-label="Save"
      title={saved ? "Saved" : "Save"}
    >
      <svg
        className={`${size} ${saved ? "fill-[#FFD873] text-[#FFD873]" : "fill-none text-[#AFA9EC]"} stroke-current stroke-[1.6]`}
        viewBox="0 0 24 24"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
