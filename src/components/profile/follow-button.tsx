"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserPlus } from "lucide-react";
import { followUserAction, unfollowUserAction } from "@/app/actions/profile";
import { useI18n } from "@/components/genova/language-provider";
import { cn } from "@/lib/utils/cn";

export function FollowButton({
  targetUserId,
  initialFollowing,
}: {
  targetUserId: string;
  initialFollowing: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  const onToggle = () => {
    startTransition(async () => {
      if (following) {
        const res = await unfollowUserAction(targetUserId);
        if (res.ok) {
          setFollowing(false);
        }
      } else {
        const res = await followUserAction(targetUserId);
        if (res.ok) {
          setFollowing(true);
        }
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition disabled:opacity-60",
        following
          ? "border border-white/[0.10] bg-white/[0.04] text-white/55 hover:bg-white/[0.07] hover:text-white/80"
          : "border border-white/[0.12] bg-white/[0.08] text-white/85 hover:bg-white/[0.13]",
      )}
    >
      {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      {following ? t("profile.following") : t("profile.follow")}
    </button>
  );
}
