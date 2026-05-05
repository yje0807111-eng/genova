"use client";

import Link from "next/link";
import { LocalizedGenreText } from "@/components/genova/localized-genre";
import { useI18n } from "@/components/genova/language-provider";
import { AiToolsCollapsible } from "@/components/video/ai-tools-collapsible";
import { formatGenreDisplay } from "@/lib/constants/genres";
import { trackHashtagEvent } from "@/lib/hashtags/client-track";
import { intlDateLocale } from "@/lib/i18n/browser-locale";
import type { Video } from "@/lib/types";
import { formatViewCountShort } from "@/lib/view-count";

export function WatchVideoMetaRow({
  genre,
  subGenre,
  runtime,
  viewCount,
  createdAt,
}: {
  genre: string | null | undefined;
  subGenre?: string | null | undefined;
  runtime?: string | null;
  viewCount: number;
  createdAt: string;
}) {
  const { locale, t } = useI18n();
  const dateLocale = intlDateLocale(locale);
  const dateStr = new Date(createdAt).toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-white/50">
      <LocalizedGenreText genre={genre} subGenre={subGenre} />
      {runtime ? (
        <>
          <span className="text-white/20">·</span>
          <span>{runtime}</span>
        </>
      ) : null}
      <span className="text-white/20">·</span>
      <span>
        {formatViewCountShort(viewCount)} {t("feed.views")}
      </span>
      <span className="text-white/20">·</span>
      <span>{dateStr}</span>
    </div>
  );
}

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
              onClick={() => trackHashtagEvent(tag, "click")}
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

function RecommendationCard({ item }: { item: Video }) {
  const { locale, t } = useI18n();
  const itemGenre = formatGenreDisplay(item.genre, item.subGenre, locale);

  return (
    <Link
      href={"/watch/" + item.id}
      className="group relative overflow-hidden rounded-xl bg-[#0f0d24] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_24px_rgba(83,74,183,0.25)]"
      style={{ borderColor: "rgba(127,119,221,0.15)", border: "1px solid rgba(127,119,221,0.15)" }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a1547] to-[#0f0d24]" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(8,6,24,1) 0%, rgba(8,6,24,0.8) 40%, rgba(8,6,24,0.3) 65%, transparent 100%)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-8">
          <h3 className="line-clamp-1 text-[13px] font-bold text-white">{item.title}</h3>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="text-[11px] text-[#AFA9EC]/70">{itemGenre}</span>
            {item.viewCount ? (
              <>
                <span className="text-white/20">·</span>
                <span className="text-[11px] text-white/50">
                  {formatViewCountShort(item.viewCount)} {t("feed.views")}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function WatchRecommendationsSections({
  forYouVideos,
  sameGenreVideos,
  trendingVideos,
  mainGenre,
  subGenre,
}: {
  forYouVideos: Video[];
  sameGenreVideos: Video[];
  trendingVideos: Video[];
  mainGenre: string | null | undefined;
  subGenre?: string | null;
}) {
  const { locale, t } = useI18n();
  const genreTitle = formatGenreDisplay(mainGenre, subGenre, locale);

  return (
    <div className="mt-8 space-y-10">
      {forYouVideos.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-[20px] font-bold text-white">{t("watch.forYouTitle")}</h2>
            <span className="text-[12px] text-white/30">{t("watch.forYouSubtitle")}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {forYouVideos.map((item) => (
              <RecommendationCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {sameGenreVideos.length > 0 ? (
        <section>
          <div className="mb-4 border-t border-white/[0.06] pt-6">
            <h2 className="text-[20px] font-bold text-white">
              {locale !== "en" ? (
                t("watch.moreInGenre").replace("{genre}", genreTitle)
              ) : (
                <>
                  {t("watch.moreInGenreLead")}{" "}
                  <span className="text-[#7F77DD]">{genreTitle}</span>
                </>
              )}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {sameGenreVideos.map((item) => (
              <RecommendationCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {trendingVideos.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center gap-2 border-t border-white/[0.06] pt-6">
            <span className="text-lg">🔥</span>
            <h2 className="text-[20px] font-bold text-white">{t("watch.trendingTitle")}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {trendingVideos.map((item) => (
              <RecommendationCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
