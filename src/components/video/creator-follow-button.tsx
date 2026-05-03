"use client";

import { useState } from "react";
import { UserCheck, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function CreatorFollowButton({ creatorName }: { creatorName: string }) {
  const [following, setFollowing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);

  const onFollow = () => {
    setFollowing(true);
    setToastMsg(`Now following ${creatorName}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const onUnfollow = () => {
    setFollowing(false);
    setShowUnfollowModal(false);
    setToastMsg(`Unfollowed ${creatorName}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => following ? setShowUnfollowModal(true) : onFollow()}
        className={cn(
          "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
          following
            ? "border border-border bg-card text-foreground hover:bg-white/5"
            : "bg-primary text-white hover:bg-primary/90",
        )}
      >
        {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
        {following ? "Following" : "Follow"}
      </button>

      {/* Toast */}
      {showToast ? (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-primary/30 bg-card px-4 py-3 shadow-lg shadow-purple-500/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {following
            ? <UserCheck className="h-4 w-4 text-primary" />
            : <UserPlus className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm text-foreground">{toastMsg}</span>
        </div>
      ) : null}

      {/* Unfollow modal */}
      {showUnfollowModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-foreground">Unfollow {creatorName}?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Their posts will no longer appear in your feed.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowUnfollowModal(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onUnfollow}
                className="rounded-lg bg-red-500/80 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition"
              >
                Unfollow
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
