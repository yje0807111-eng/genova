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
        "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60",
        following
          ? "border border-border bg-card text-foreground hover:bg-white/5"
          : "bg-primary text-white hover:bg-primary/90",
      )}
    >
      {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      {following ? t("profile.following") : t("profile.follow")}
    </button>
  );
}
