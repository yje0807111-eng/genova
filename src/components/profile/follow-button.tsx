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
          : "border border-[#7F77DD]/25 text-[#E6E3FA] hover:brightness-125",
      )}
      style={
        following
          ? undefined
          : {
              background:
                "linear-gradient(135deg, #4A3F9E 0%, #322A78 55%, #1E1A52 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }
      }
    >
      {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      {following ? t("profile.following") : t("profile.follow")}
    </button>
  );
}
