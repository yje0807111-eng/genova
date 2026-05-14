"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useI18n } from "@/components/genova/language-provider";
import { AiToolsCollapsible } from "@/components/video/ai-tools-collapsible";
import { trackHashtagEvent } from "@/lib/hashtags/client-track";
import type { Video } from "@/lib/types";
import { RecommendationCard } from "./recommendation-card";

export function WatchDescriptionInner({
  description,
  tags,
  aiTools,
}: {
  description: string | null | undefined;
  tags: string[];
  aiTools: string[];
}) {
  const { t } = useI18n();
  const text = description?.trim() ? description.trim() : t("watch.descriptionFallback");

  return (
    <>
      <p className="text-sm leading-relaxed text-white/70 whitespace-pre-wrap">{text}</p>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}&tab=tags#search-tags-section`}
              onClick={() => {
                trackHashtagEvent(tag, "click");
                setTimeout(() => {
                  const el = document.getElementById("search-tags-section");
                  if (el) {
                    const top = el.getBoundingClientRect().top + window.scrollY - 80;
                    window.scrollTo({ top, behavior: "smooth" });
                  }
                }, 400);
              }}
              className="cursor-pointer text-[13px] text-[#7F77DD]/70 transition hover:text-[#7F77DD]"
            >
              #{tag}
            </Link>
          ))}
        </div>
      ) : null}
      {aiTools.length > 0 ? <AiToolsCollapsible tools={aiTools} /> : null}
    </>
  );
}

function WatchRecommendationSectionHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-5">
      <p className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#AFA9EC]/70">
        <span>✦</span>
        {eyebrow}
      </p>
      <h2 className="text-[18px] font-bold text-white">{title}</h2>
    </div>
  );
}

export function WatchRecommendationsSections({
  sameGenreVideos,
  trendingVideos,
  currentVideoId,
}: {
  sameGenreVideos: Video[];
  trendingVideos: Video[];
  currentVideoId?: string;
}) {
  const { t } = useI18n();

  const combinedRecommendations = useMemo(() => {
    const seen = new Set<string>();
    const result: Video[] = [];
    for (const v of sameGenreVideos) {
      if (!seen.has(v.id) && v.id !== currentVideoId) {
        result.push(v);
        seen.add(v.id);
      }
    }
    for (const v of trendingVideos) {
      if (!seen.has(v.id) && v.id !== currentVideoId) {
        result.push(v);
        seen.add(v.id);
      }
    }
    return result.slice(0, 20);
  }, [sameGenreVideos, trendingVideos, currentVideoId]);

  if (combinedRecommendations.length === 0) return null;

  return (
    <section className="px-6 py-12 sm:px-8">
      <WatchRecommendationSectionHeader
        eyebrow={t("watch.recommend.eyebrow", "MORE TO WATCH")}
        title={t("watch.recommend.title", "이어 볼만한 작품")}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {combinedRecommendations.map((item) => (
          <RecommendationCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
