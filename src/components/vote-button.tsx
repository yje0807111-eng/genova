"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitVote, type VoteActionResult } from "@/app/actions/vote";

type Props = {
  videoId: string;
  competitionId: string;
  initiallyVoted: boolean;
  /** Remove default top margin in modal contexts */
  className?: string;
};

function messageFor(result: VoteActionResult): string | null {
  if (result.ok) return null;
  switch (result.code) {
    case "login_required":
      return "Please sign in to vote.";
    case "duplicate":
      return "You already voted for this film.";
    case "not_configured":
      return result.message ?? "Configuration error.";
    default:
      return result.message ?? "Vote failed.";
  }
}

export function VoteButton({ videoId, competitionId, initiallyVoted, className }: Props) {
  const [voted, setVoted] = useState(initiallyVoted);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onVote = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await submitVote(videoId, competitionId);
      const msg = messageFor(result);
      if (result.ok) {
        setVoted(true);
        setFeedback("Vote submitted successfully.");
        return;
      }
      if (result.code === "duplicate") {
        setVoted(true);
      }
      setFeedback(msg);
    });
  };

  if (voted) {
    return (
      <p className={`text-sm text-[#AFA9EC] ${className ?? "mt-4"}`}>
        Voted
        {feedback ? ` · ${feedback}` : ""}
      </p>
    );
  }

  return (
    <div className={`space-y-2 ${className ?? "mt-4"}`}>
      <button
        type="button"
        disabled={isPending}
        onClick={onVote}
        className="rounded-full bg-[#534AB7] px-4 py-2 text-sm font-semibold text-[#EEEDFE] transition hover:bg-[#7F77DD] disabled:opacity-60"
      >
        {isPending ? "Processing..." : "Vote"}
      </button>
      {feedback && (
        <p className="text-sm text-amber-200">
          {feedback}{" "}
          {feedback.includes("sign in") && (
            <Link href="/auth" className="underline">
              Sign In
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
