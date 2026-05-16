"use client";

import { AnimateIn } from "@/components/animate-in";
import { useI18n } from "@/components/genova/language-provider";
import { LotteryCounter } from "@/components/lottery/lottery-counter";
import { ProfileBio } from "@/components/profile/profile-bio";
import { ProfileCtaRow } from "@/components/profile/profile-cta-row";
import { ProfileEditPencilTrigger } from "@/components/profile/profile-edit-pencil-trigger";
import {
  ProfileAvatar,
  ProfileCoverBanner,
  ProfileHandleRow,
  ProfilePageGlow,
} from "@/components/profile/profile-static-header";
import type { MonthlyTicketCount } from "@/lib/queries/lottery-queries";
import type { Profile } from "@/lib/queries/profile-queries";

type Props = {
  // Identity / layout
  profileId: string;
  displayName: string;
  handle: string;
  mainGenre: string | null;
  bannerUrl: string | null;
  avatarUrl: string;

  // Bio block (forwarded to <ProfileBio>)
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

  // Stats
  videoCount: number;
  followersCount: number;
  followingCount: number;

  // Conditional UI
  isOwner: boolean;
  showFollow: boolean;
  initialFollowing: boolean;

  // Owner-only — used by <ProfileEditPencilTrigger> + <ProfileSettingsModal>.
  // Optional so non-owner routes (`/creator/[id]`) can omit them; the
  // pencil only renders when both `isOwner` and `profile` are present.
  profile?: Profile | null;
  userEmail?: string | null;
  hasPassword?: boolean;
  authProvider?: string;

  // Owner-only lottery snapshot for the in-header counter card.
  // Same conditional render as the edit pencil — only the profile
  // owner sees it; null/undefined hides the card entirely.
  lotteryCount?: MonthlyTicketCount | null;
};

/**
 * Server-rendered profile header (C-2b).  Replaces the inline header
 * JSX that used to live inside `GenovaProfileClient`.  Composed at the
 * route page (`/profile/[id]/page.tsx`, `/creator/[id]/page.tsx`) and
 * threaded into the client shell through a `headerSlot: ReactNode`
 * prop, so the entire banner / avatar / name / bio / stats area
 * renders on the server with locale-aware text — no English flash,
 * no hydration round-trip, no need for the client shell to own the
 * data.
 *
 * Three small client islands plug into the otherwise-server tree:
 *   - <ProfileEditPencilTrigger>  — owner-only edit button + settings modal
 *   - <ProfileBio> wraps <ProfileBioExpander> internally for expand state
 *   - <ProfileCtaRow>             — non-owner Message / Follow / More
 *
 * The `videoCount` value is a server snapshot of `works.length`.
 * Bulk visibility toggles inside `GenovaProfileClient` mutate
 * `localWorks` but never add/remove items, so the count stays
 * accurate; if that invariant changes, lift the count back into the
 * client shell behind another slot.
 */
export function ProfileHeader(props: Props) {
  const { t, locale } = useI18n();

  return (
    <div>
      <ProfilePageGlow />
      <div className="relative z-10">
        <div>
          <ProfileCoverBanner bannerUrl={props.bannerUrl} />

          <AnimateIn delay={0.05}>
            <div className="relative z-10 mx-auto w-full max-w-[800px] -mt-60 px-6 pb-2 sm:px-8 md:-mt-72">
              <div className="flex flex-col items-center text-center">
                <ProfileAvatar avatarUrl={props.avatarUrl} displayName={props.displayName} />

                {/* Display name + edit icon */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
                  <h1 className="text-[22px] font-black tracking-tight text-white md:text-[28px]">
                    {props.displayName}
                  </h1>
                  {props.isOwner && props.profile ? (
                    <ProfileEditPencilTrigger
                      profile={props.profile}
                      userEmail={props.userEmail ?? null}
                      hasPassword={props.hasPassword ?? false}
                      authProvider={props.authProvider ?? "email"}
                      handle={props.handle}
                    />
                  ) : null}
                </div>

                <ProfileHandleRow handle={props.handle} mainGenre={props.mainGenre} />

                <ProfileBio
                  headerIntro={props.headerIntro}
                  bioFull={props.bioFull}
                  headerToolsLine={props.headerToolsLine}
                  country={props.country}
                  joinedLabel={props.joinedLabel}
                  websiteUrl={props.websiteUrl}
                  twitterUrl={props.twitterUrl}
                  instagramUrl={props.instagramUrl}
                  youtubeUrl={props.youtubeUrl}
                  tiktokUrl={props.tiktokUrl}
                  vimeoUrl={props.vimeoUrl}
                />

                {/* CTA row — message / follow / more for non-owners */}
                {!props.isOwner ? (
                  <ProfileCtaRow
                    profileId={props.profileId}
                    displayName={props.displayName}
                    avatarUrl={props.avatarUrl}
                    showFollow={props.showFollow}
                    initialFollowing={props.initialFollowing}
                  />
                ) : null}

                {/* Stats row */}
                <div className="mt-4 flex items-center gap-5 md:gap-7">
                  <Stat label={t("profile.videos", "Videos")} value={props.videoCount} />
                  <div className="h-8 w-px bg-white/[0.08]" />
                  <Stat label={t("profile.followers", "Followers")} value={props.followersCount} />
                  <div className="h-8 w-px bg-white/[0.08]" />
                  <Stat
                    label={t("profile.followingCountLabel", "Following")}
                    value={props.followingCount}
                  />
                </div>

                {/* Owner-only entry-lottery counter (Phase 3). Renders
                    nothing when lotteryCount is null/undefined.  Compact
                    one-line pill so it doesn't dominate the header. */}
                {props.isOwner && props.lotteryCount ? (
                  <div className="mt-3">
                    <LotteryCounter count={props.lotteryCount} />
                  </div>
                ) : null}
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[18px] font-bold tabular-nums text-white md:text-[20px]">
        {value.toLocaleString()}
      </span>
      <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">
        {label}
      </span>
    </div>
  );
}
