"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { followUserAction, unfollowUserAction } from "@/app/actions/profile";

export function FollowButton({
  targetUserId,
  initialFollowing,
  onFollowerCountChange,
}: {
  targetUserId: string;
  initialFollowing: boolean;
  /** Follower count delta for profile owner (+1 / -1) */
  onFollowerCountChange?: (delta: number) => void;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing]);

  const toggle = async () => {
    setPending(true);
    try {
      if (following) {
        const res = await unfollowUserAction(targetUserId);
        if (res.ok) {
          setFollowing(false);
          onFollowerCountChange?.(-1);
        } else alert(res.message);
      } else {
        const res = await followUserAction(targetUserId);
        if (res.ok) {
          setFollowing(true);
          if (!("alreadyFollowing" in res && res.alreadyFollowing)) {
            onFollowerCountChange?.(1);
          }
        } else alert(res.message);
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void toggle()}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition disabled:opacity-60 ${
        following
          ? "border border-[#7F77DD] bg-transparent text-[#EEEDFE] hover:bg-[#534AB7]/40"
          : "bg-[#534AB7] text-[#EEEDFE] hover:bg-[#7F77DD]"
      }`}
    >
      {pending ? "..." : following ? "Following" : "Follow"}
    </button>
  );
}
