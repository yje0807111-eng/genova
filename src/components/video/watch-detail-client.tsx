"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useI18n } from "@/components/genova/language-provider";
import { trackHashtagEvent } from "@/lib/hashtags/client-track";
import type { Video } from "@/lib/types";
import { RecommendationCard } from "./recommendation-card";

export function WatchDescriptionInner({
  description,
  tags,
}: {
  description: string | null | undefined;
  tags: string[];
}) {
  const { t } = useI18n();
  const text = description?.trim() || "";
  const isEmpty = !text && tags.length === 0;

  if (isEmpty) {
    return (
      <p className="text-[13px] text-white/30">
        {t("watch.detailsEmpty", "No details provided.")}
      </p>
    );
  }

  return (
    <>
      {text ? (
        <p className="text-sm leading-relaxed text-white/70 whitespace-pre-wrap">
          {text}
        </p>
      ) : null}
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/?q=${encodeURIComponent(tag)}`}
              onClick={() => trackHashtagEvent(tag, "click")}
              className="cursor-pointer text-[13px] text-[#7F77DD]/70 transition hover:text-[#7F77DD]"
            >
              #{tag}
            </Link>
          ))}
        </div>
      ) : null}
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
  currentSeriesName,
}: {
  sameGenreVideos: Video[];
  trendingVideos: Video[];
  currentVideoId?: string;
  /** 시리즈 시청 중이면 같은 시리즈 영상은 추천에서 제외(위 시리즈
   *  레일과 중복 방지). */
  currentSeriesName?: string | null;
}) {
  const { t } = useI18n();

  const combinedRecommendations = useMemo(() => {
    const sameSeries = currentSeriesName?.trim() || null;
    const seen = new Set<string>();
    const result: Video[] = [];
    const consider = (v: Video) => {
      if (seen.has(v.id) || v.id === currentVideoId) return;
      if (sameSeries && (v.seriesName?.trim() || null) === sameSeries) return;
      result.push(v);
      seen.add(v.id);
    };
    for (const v of sameGenreVideos) consider(v);
    for (const v of trendingVideos) consider(v);
    return result.slice(0, 20);
  }, [sameGenreVideos, trendingVideos, currentVideoId, currentSeriesName]);

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
