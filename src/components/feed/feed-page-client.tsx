"use client";

import { AnimateIn } from "@/components/animate-in";
import { useI18n } from "@/components/genova/language-provider";
import { FeedYoutubeLayout } from "@/components/feed/feed-youtube-layout";
import type { Video } from "@/lib/types";

export function FeedPageClient({ videos }: { videos: Video[] }) {
  const { t } = useI18n();

  return (
    <div className="relative mx-auto w-full max-w-[1680px] space-y-6 px-12 py-10 text-white">
      <AnimateIn delay={0}>
        <div className="relative mb-2 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#1a1547] via-[#0f0d24] to-[#080618] px-10 py-10">
          {/* Background glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#534AB7]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 left-1/3 h-40 w-40 rounded-full bg-[#7F77DD]/10 blur-2xl" />

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7F77DD]">
            {t("feed.community", "Community")}
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            {t("nav.feed", "Feed")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/40">
            {t("feed.subtitle", "Discover AI films from creators worldwide")}
          </p>
        </div>
      </AnimateIn>

      {videos.length === 0 ? (
        <p className="py-16 text-center text-[#AFA9EC]">{t("feed.noFilmsYet")}</p>
      ) : (
        <FeedYoutubeLayout videos={videos} />
      )}
    </div>
  );
}
