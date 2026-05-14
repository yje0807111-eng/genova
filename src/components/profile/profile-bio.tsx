"use client";

import { useState } from "react";
import { ChevronDown, Globe, Instagram, X, Youtube } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { cn } from "@/lib/utils/cn";

type SocialLinkProps = {
  websiteUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  vimeoUrl: string | null;
};

function SocialLinks({
  websiteUrl,
  twitterUrl,
  instagramUrl,
  youtubeUrl,
  tiktokUrl,
  vimeoUrl,
}: SocialLinkProps) {
  const { t } = useI18n();
  const links = [
    { href: websiteUrl, label: t("profile.socialWebsite"), icon: <Globe className="h-4 w-4" /> },
    { href: twitterUrl, label: "X", icon: <X className="h-4 w-4" /> },
    { href: instagramUrl, label: "Instagram", icon: <Instagram className="h-4 w-4" /> },
    { href: youtubeUrl, label: "YouTube", icon: <Youtube className="h-4 w-4" /> },
    {
      href: tiktokUrl,
      label: "TikTok",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
        </svg>
      ),
    },
    {
      href: vimeoUrl,
      label: "Vimeo",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.53 3.67-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.38-.51 1.07-.78 4.18-1.82 6.97-3.02 8.37-3.6 3.98-1.66 4.81-1.95 5.35-1.96.12 0 .38.03.55.17.14.12.18.28.2.45-.02.07-.02.13-.02.22z" />
        </svg>
      ),
    },
  ].filter((item) => Boolean(item.href?.trim()));

  if (!links.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((item) => (
        <a
          key={item.label}
          href={item.href ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-white/[0.08] p-1.5 text-white/55 transition hover:border-[#7F77DD]/40 hover:text-white"
          aria-label={item.label}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}

type ProfileBioProps = {
  headerIntro: string;
  bioFull: string;
  headerToolsLine: string;
  country: string | null;
  joinedLabel: string | null;
  websiteUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  vimeoUrl: string | null;
};

/**
 * Bio paragraph + Show more/less toggle + expanded details (tools chips,
 * country, joined date, social links).
 *
 * Self-contained `expanded` state — no other shell component reads it,
 * so the local toggle lives here.  Stays `"use client"` only because of
 * `useI18n` (Show more/less labels + the Website social label).
 */
export function ProfileBio({
  headerIntro,
  bioFull,
  headerToolsLine,
  country,
  joinedLabel,
  websiteUrl,
  twitterUrl,
  instagramUrl,
  youtubeUrl,
  tiktokUrl,
  vimeoUrl,
}: ProfileBioProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const hasMore = Boolean(bioFull && bioFull.length > (headerIntro?.length ?? 0));

  return (
    <>
      {headerIntro ? (
        <p className="mt-2 max-w-[520px] text-[13px] leading-relaxed text-white/65">
          {expanded ? (bioFull || headerIntro) : headerIntro}
        </p>
      ) : null}

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-[#AFA9EC] transition hover:text-white"
        >
          {expanded ? t("profile.showLess", "Show less") : t("profile.showMore", "Show more")}
          <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
        </button>
      )}

      {expanded && (
        <div className="mt-4 flex flex-col items-center gap-3">
          {headerToolsLine && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {headerToolsLine.split(" · ").map((tool) => (
                <span
                  key={tool}
                  className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-xs text-white/70"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-white/50">
            {country ? <span>📍 {country}</span> : null}
            {joinedLabel ? <span>{joinedLabel}</span> : null}
          </div>
          <SocialLinks
            websiteUrl={websiteUrl}
            twitterUrl={twitterUrl}
            instagramUrl={instagramUrl}
            youtubeUrl={youtubeUrl}
            tiktokUrl={tiktokUrl}
            vimeoUrl={vimeoUrl}
          />
        </div>
      )}
    </>
  );
}
