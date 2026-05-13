"use client";

import Link from "next/link";
import { Trophy, Award, Medal, Star } from "lucide-react";
import type { Video } from "@/lib/types";
import { useI18n } from "@/components/genova/language-provider";
import type { LucideIcon } from "lucide-react";

interface AwardsGalleryProps {
  heroAwardVideos: {
    grandPrize: Video | null;
    excellence: Video | null;
    merit: Video | null;
    audience: Video | null;
  };
  competitionTitle?: string;
}

type SlotDef = {
  key: string;
  rank: "grand" | "excellence" | "merit" | "audience";
  labelKey: string;
  Icon: LucideIcon;
  color: string;
  borderColor: string;
  shadow: string;
  video: Video | null;
};

export function AwardsGallery({ heroAwardVideos, competitionTitle }: AwardsGalleryProps) {
  const { t } = useI18n();

  const slots: SlotDef[] = [
    {
      key: "grand",
      rank: "grand",
      labelKey: "awards.tier.grand",
      Icon: Trophy,
      color: "#F5D182",
      borderColor: "rgba(245,209,130,0.4)",
      shadow: "0 0 28px rgba(245,209,130,0.25)",
      video: heroAwardVideos.grandPrize,
    },
    {
      key: "excellence",
      rank: "excellence",
      labelKey: "awards.tier.excellence",
      Icon: Award,
      color: "rgba(192,192,192,0.9)",
      borderColor: "rgba(192,192,192,0.3)",
      shadow: "0 0 24px rgba(192,192,192,0.2)",
      video: heroAwardVideos.excellence,
    },
    {
      key: "merit",
      rank: "merit",
      labelKey: "awards.tier.merit",
      Icon: Medal,
      color: "#CD7F32",
      borderColor: "rgba(205,127,50,0.3)",
      shadow: "0 0 24px rgba(205,127,50,0.2)",
      video: heroAwardVideos.merit,
    },
    {
      key: "audience",
      rank: "audience",
      labelKey: "awards.tier.audience",
      Icon: Star,
      color: "#AFA9EC",
      borderColor: "rgba(175,169,236,0.3)",
      shadow: "0 0 24px rgba(175,169,236,0.2)",
      video: heroAwardVideos.audience,
    },
  ];

  return (
    <div className="space-y-5">
      {competitionTitle && (
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-[#F5D182]" />
          <h3 className="text-[18px] font-black tracking-tight text-white">
            {competitionTitle}
          </h3>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {slots.map((slot) => {
          const video = slot.video;
          const TierIcon = slot.Icon;
          const thumb = video?.thumbnailUrl?.trim();

          return (
            <div key={slot.key} className="group relative">
              {video ? (
                <Link
                  href={`/watch/${video.id}`}
                  className="block overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1"
                  style={{
                    border: `1px solid ${slot.borderColor}`,
                    boxShadow: slot.shadow,
                  }}
                >
                  <div className="relative aspect-[3/2] overflow-hidden bg-white/[0.02]">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={video.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/[0.03]">
                        <TierIcon className="h-10 w-10" style={{ color: slot.color, opacity: 0.3 }} />
                      </div>
                    )}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)",
                      }}
                    />
                    {/* Tier badge */}
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md px-2 py-1"
                      style={{
                        background: "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <TierIcon className="h-3.5 w-3.5" style={{ color: slot.color }} />
                      <span className="text-[11px] font-bold" style={{ color: slot.color }}>
                        {t(slot.labelKey)}
                      </span>
                    </div>
                    {/* Bottom info */}
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <p className="line-clamp-1 text-[13px] font-bold text-white">{video.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-white/55">
                        {video.creatorName?.trim() || video.uploaderDisplayName?.trim() || ""}
                      </p>
                    </div>
                    <div
                      className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[0.06] transition group-hover:ring-white/15"
                    />
                  </div>
                </Link>
              ) : (
                <div
                  className="flex aspect-[3/2] flex-col items-center justify-center rounded-xl"
                  style={{
                    border: `1px solid ${slot.borderColor}`,
                    background: "var(--border-white-02)",
                  }}
                >
                  <TierIcon className="h-8 w-8" style={{ color: slot.color, opacity: 0.25 }} />
                  <p className="mt-2 text-[11px] font-semibold" style={{ color: slot.color, opacity: 0.5 }}>
                    {t(slot.labelKey)}
                  </p>
                  <p className="mt-1 text-[10px] text-white/30">{t("awards.empty")}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
