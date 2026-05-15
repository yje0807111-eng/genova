"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, MoreHorizontal, UserCheck, UserPlus } from "lucide-react";
import { followUserAction, unfollowUserAction } from "@/app/actions/profile";
import { useI18n } from "@/components/genova/language-provider";
import { cn } from "@/lib/utils/cn";

/**
 * Non-owner CTA row: Message / Follow / More — three buttons under the
 * display name on profile/creator pages.  Self-contained client island:
 * owns its `following` state, drives `followUserAction` /
 * `unfollowUserAction` through `useTransition`, and dispatches the
 * `open-message` window event for the message drawer.
 *
 * Pulled out of `GenovaProfileClient` for C-2 so the surrounding
 * header can render server-side without lifting the action call back
 * up through the tree.  The shared `<FollowButton>` exists already
 * but uses tighter spacing — this row keeps the original profile-
 * header sizing (`px-4 py-2 text-sm`) intentionally.
 */
export function ProfileCtaRow({
  profileId,
  displayName,
  avatarUrl,
  showFollow,
  initialFollowing,
}: {
  profileId: string;
  displayName: string;
  avatarUrl: string;
  showFollow: boolean;
  initialFollowing: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);

  const onFollowToggle = () => {
    startTransition(async () => {
      if (following) {
        const res = await unfollowUserAction(profileId);
        if (res.ok) setFollowing(false);
      } else {
        const res = await followUserAction(profileId);
        if (res.ok) setFollowing(true);
      }
      router.refresh();
    });
  };

  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent("open-message", {
              detail: { userId: profileId, displayName, avatarUrl },
            }),
          );
        }}
        className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
      >
        <MessageCircle className="h-4 w-4" />
        {t("profile.message", "Message")}
      </button>
      {showFollow && (
        <button
          type="button"
          onClick={onFollowToggle}
          disabled={pending}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60",
            following
              ? "border border-white/20 bg-white/5 hover:bg-white/10"
              : "bg-[#534AB7] text-white hover:bg-[#6B5FD4]",
          )}
        >
          {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {following ? t("profile.following", "Following") : t("profile.follow", "Follow")}
        </button>
      )}
      <button
        type="button"
        className="rounded-lg border border-white/15 bg-white/5 p-2 transition hover:bg-white/10"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}
