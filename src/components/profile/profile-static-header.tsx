import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * Static profile-header pieces extracted from `profile-page-client.tsx`
 * (Phase 2).  None of these take state, hooks, or event handlers —
 * they're pure render-from-props.  No `"use client"` directive: when
 * the parent shell stays client they ship as client JS regardless,
 * but the shape is server-compatible for a future shell carve-up.
 */

/** Fixed full-viewport gradient blob behind the profile shell. */
export function ProfilePageGlow() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          "radial-gradient(ellipse at 20% 0%, rgba(83,74,183,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(127,119,221,0.05) 0%, transparent 50%)",
      }}
    />
  );
}

/** Cover banner image with bottom-fade mask, falls back to /default-banner.png. */
export function ProfileCoverBanner({ bannerUrl }: { bannerUrl: string | null }) {
  return (
    <div className="relative">
      <div className="relative h-[220px] w-full overflow-hidden md:h-[400px]">
        {/* eslint-disable-next-line @next/next/no-img-element -- mask-image gradient on the <img> directly; next/image fill mode strips inline style on a layout-shift-prone path */}
        <img
          src={bannerUrl || "/default-banner.png"}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            maskImage: "linear-gradient(180deg, black 0%, black 50%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(180deg, black 0%, black 50%, transparent 100%)",
          }}
        />
      </div>
    </div>
  );
}

/** Circular avatar with subtle default-image opacity dim. */
export function ProfileAvatar({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string;
  displayName: string;
}) {
  const isDefault = avatarUrl === "/default-avatar.png";
  return (
    <div className="relative">
      <div className="h-28 w-28 overflow-hidden rounded-full ring-2 ring-[#0a0a0a]/80 md:h-32 md:w-32">
        <Image
          src={avatarUrl || "/default-avatar.png"}
          alt={displayName}
          width={176}
          height={176}
          className={cn("h-full w-full object-cover transition", isDefault && "opacity-60")}
          unoptimized={(avatarUrl || "").startsWith("http")}
        />
      </div>
    </div>
  );
}

const GENRE_LABEL: Record<string, string> = {
  film: "Filmmaker",
  animation: "Animator",
  music: "Music Video",
  documentary: "Documentary",
  horror: "Horror",
  sci_fi: "Sci-Fi",
  art: "Art",
  daily: "Daily",
};

/** @{handle} · GENRE row under the display name. */
export function ProfileHandleRow({
  handle,
  mainGenre,
}: {
  handle: string;
  mainGenre: string | null;
}) {
  return (
    <div className="mt-1 flex items-center gap-2 text-[14px] text-white/45">
      <span>@{handle}</span>
      {mainGenre && (
        <>
          <span className="text-white/15">·</span>
          <span className="font-semibold uppercase tracking-[0.12em] text-[#AFA9EC]/80">
            {GENRE_LABEL[mainGenre] ?? mainGenre}
          </span>
        </>
      )}
    </div>
  );
}
