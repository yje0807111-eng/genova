"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/genova/language-provider";
import { cn } from "@/lib/utils/cn";
import type { Video } from "@/lib/types";

interface Props {
  related: Video[];
  currentVideoId: string;
}

type Tag = { label: string; kind: "now" | "series" | "comp" };

/**
 * Server component — renders the "Up next" thumbnail rail beside the
 * player.  Cards share the site-wide glass badge (now playing / series
 * / submission) and a refined current-item highlight.
 */
export function UpNextMiniRail({ related, currentVideoId }: Props) {
  const { t } = useI18n();

  const tagFor = (v: Video): Tag | null => {
    if (v.id === currentVideoId)
      return { label: t("watch.now", "Now playing"), kind: "now" };
    if (v.seriesName)
      return { label: t("series.sectionLabel", "Series"), kind: "series" };
    if (v.purpose === "competition")
      return { label: t("profile.submission", "Submission"), kind: "comp" };
    return null;
  };

  const dotColor = (kind: Tag["kind"]) =>
    kind === "comp" ? "#F5C451" : "#9D95F0";

  const GlassBadge = ({ tag, sm }: { tag: Tag; sm?: boolean }) => (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-black/40 font-semibold text-white/90 backdrop-blur-md ring-1 ring-white/10",
        sm ? "px-1.5 py-0.5 text-[8.5px]" : "px-2.5 py-1 text-[10.5px]",
      )}
    >
      <span
        className={cn(
          "rounded-full",
          sm ? "h-1 w-1" : "h-1.5 w-1.5",
          tag.kind === "now" && "animate-pulse",
        )}
        style={{
          background: dotColor(tag.kind),
          boxShadow: `0 0 6px ${
            tag.kind === "comp"
              ? "rgba(245,196,81,0.8)"
              : "rgba(157,149,240,0.85)"
          }`,
        }}
        aria-hidden
      />
      {tag.label}
    </span>
  );

  return (
    <>
      {/* 모바일 — 제목이 카드 내부(하단 오버레이) */}
      <div className="flex flex-col gap-3 px-2 md:hidden">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#AFA9EC]/70">
          <span>✦</span>
          {t("watch.recommend.eyebrow", "MORE TO WATCH")}
        </p>
        {related.map((v) => {
          const tag = tagFor(v);
          const isCurrent = v.id === currentVideoId;
          return (
            <Link
              key={`m-${v.id}`}
              href={`/watch/${v.id}`}
              className={cn(
                "relative block aspect-video w-full overflow-hidden rounded-lg ring-1",
                isCurrent ? "ring-[#9D95F0]/70" : "ring-white/[0.06]",
              )}
              style={
                isCurrent
                  ? {
                      boxShadow:
                        "0 0 0 1px rgba(157,149,240,0.5), 0 8px 26px -8px rgba(127,119,221,0.55)",
                    }
                  : undefined
              }
            >
              {v.thumbnailUrl ? (
                <Image
                  src={v.thumbnailUrl}
                  alt={v.title}
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-white/[0.04]" />
              )}
              <div
                className="absolute inset-0"
                style={{ background: "var(--gradient-card-overlay)" }}
              />
              {tag ? (
                <div className="absolute left-2.5 top-2.5">
                  <GlassBadge tag={tag} />
                </div>
              ) : null}
              {v.runtime && (
                <div className="absolute right-2.5 top-2.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white/85 backdrop-blur-sm">
                  {v.runtime}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="line-clamp-2 text-[14px] font-bold leading-tight text-white">
                  {v.title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 데스크톱 — 썸네일 전용 레일 */}
      <div className="hidden flex-col gap-1.5 md:flex">
        {related.map((v) => {
          const tag = tagFor(v);
          const isCurrent = v.id === currentVideoId;
          return (
            <Link
              key={v.id}
              href={`/watch/${v.id}`}
              title={v.title}
              className={cn(
                "group relative block aspect-video w-full shrink-0 overflow-hidden rounded-md ring-1 transition",
                isCurrent
                  ? "ring-[#9D95F0]/70"
                  : "ring-white/[0.05] hover:ring-white/25",
              )}
              style={
                isCurrent
                  ? {
                      boxShadow:
                        "0 0 0 1px rgba(157,149,240,0.5), 0 8px 26px -8px rgba(127,119,221,0.55)",
                    }
                  : undefined
              }
            >
              {v.thumbnailUrl ? (
                <Image
                  src={v.thumbnailUrl}
                  alt={v.title}
                  fill
                  sizes="(max-width: 1024px) 50vw, 200px"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-white/[0.04]" />
              )}

              {tag ? (
                <div className="absolute left-1.5 top-1.5">
                  <GlassBadge tag={tag} sm />
                </div>
              ) : null}

              {v.runtime && (
                <div className="absolute bottom-1 right-1 rounded bg-black/55 px-1 py-px text-[8px] font-bold tabular-nums text-white/85 backdrop-blur-sm">
                  {v.runtime}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}
