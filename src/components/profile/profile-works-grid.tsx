"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteVideoAction, updateVideoVisibilityAction } from "@/app/actions/video";
import { useI18n } from "@/components/genova/language-provider";
import { formatGenreDisplay } from "@/lib/constants/genres";
import type { Video } from "@/lib/types";

export function ProfileWorksGrid({ videos, emptyLabel }: { videos: Video[]; emptyLabel?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  if (videos.length === 0) {
    return (
      <p className="rounded-xl bg-[#1A1535]/80 p-8 text-center text-sm text-[#AFA9EC]">
        {emptyLabel ?? t("profile.noUploadsYet")}
      </p>
    );
  }

  const toggleVis = async (videoId: string, next: "public" | "private") => {
    setPending(videoId);
    try {
      const res = await updateVideoVisibilityAction(videoId, next);
      if (!res.ok) alert(res.message);
      router.refresh();
    } finally {
      setPending(null);
    }
  };

  const remove = async (videoId: string) => {
    if (!confirm(t("profile.confirmDeleteFilm"))) return;
    setPending(videoId);
    try {
      const res = await deleteVideoAction(videoId);
      if (!res.ok) alert(res.message);
      router.refresh();
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((v) => {
        const isPrivate = v.visibility === "private";
        const busy = pending === v.id;
        return (
          <div
            key={v.id}
            className="video-card-hover overflow-hidden rounded-xl border border-white/10 bg-[#1A1535]"
          >
            <Link href={`/watch/${v.id}`} className="block">
              <div className="relative aspect-video w-full">
                <Image src={v.thumbnailUrl} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-200" />
                {isPrivate && (
                  <span
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-[#EEEDFE]"
                    title={t("profile.private")}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="line-clamp-2 font-semibold text-[#EEEDFE]">{v.title}</p>
                <p className="mt-1 text-xs text-[#AFA9EC]">
                  {formatGenreDisplay(v.genre, v.subGenre)} · {v.runtime}
                </p>
              </div>
            </Link>
            <div className="flex flex-wrap gap-2 border-t border-white/10 px-3 pb-3 pt-2">
              <Link
                href={`/upload/edit/${v.id}`}
                className="rounded-full bg-[#534AB7]/70 px-3 py-1 text-xs font-medium text-[#EEEDFE] ring-1 ring-[#7F77DD]/40 hover:bg-[#534AB7]"
              >
                {t("profile.edit")}
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={() => void toggleVis(v.id, isPrivate ? "public" : "private")}
                className="rounded-full bg-[#26215C] px-3 py-1 text-xs text-[#EEEDFE] ring-1 ring-white/15 hover:bg-[#534AB7]/40 disabled:opacity-50"
              >
                {busy ? "..." : isPrivate ? t("profile.setPublic") : t("profile.setPrivate")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove(v.id)}
                className="rounded-full bg-red-950/50 px-3 py-1 text-xs text-red-200 ring-1 ring-red-800/50 hover:bg-red-950 disabled:opacity-50"
              >
                {t("profile.delete")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
