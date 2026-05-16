"use client";

import { Globe, Instagram, X, Youtube } from "lucide-react";
import { ProfileBioExpander } from "@/components/profile/profile-bio-expander";
import { useI18n } from "@/components/genova/language-provider";

type SocialLinkProps = {
  websiteUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  vimeoUrl: string | null;
};

function SocialLinks({
  websiteLabel,
  websiteUrl,
  twitterUrl,
  instagramUrl,
  youtubeUrl,
  tiktokUrl,
  vimeoUrl,
}: SocialLinkProps & { websiteLabel: string }) {
  const links = [
    { href: websiteUrl, label: websiteLabel, icon: <Globe className="h-4 w-4" /> },
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
 * Client component.  Renders the bio paragraph + the expand/collapse
 * toggle + the expanded-only block of tools chips, country / joined
 * meta, and social links.  Expand state lives in the imported
 * `<ProfileBioExpander>` island.  Reads locale via `useI18n` so the
 * bio re-localizes instantly on language switch (was a server
 * component until then, which lagged a router.refresh behind).
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
  const websiteLabel = t("profile.socialWebsite", "Website");

  const hasMore = Boolean(bioFull && bioFull.length > (headerIntro?.length ?? 0));
  const collapsedText = headerIntro;
  const expandedText = bioFull || headerIntro;

  return (
    <ProfileBioExpander
      hasMore={hasMore}
      collapsedView={
        collapsedText ? (
          <p className="mt-2 max-w-[520px] text-[13px] leading-relaxed text-white/65">
            {collapsedText}
          </p>
        ) : null
      }
      expandedView={
        collapsedText ? (
          <p className="mt-2 max-w-[520px] text-[13px] leading-relaxed text-white/65">
            {expandedText}
          </p>
        ) : null
      }
      expandedExtras={
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
            websiteLabel={websiteLabel}
            websiteUrl={websiteUrl}
            twitterUrl={twitterUrl}
            instagramUrl={instagramUrl}
            youtubeUrl={youtubeUrl}
            tiktokUrl={tiktokUrl}
            vimeoUrl={vimeoUrl}
          />
        </div>
      }
    />
  );
}
