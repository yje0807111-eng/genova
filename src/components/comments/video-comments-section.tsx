"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createCommentAction, deleteCommentAction, toggleCommentLikeAction } from "@/app/actions/comments";
import type { VideoComment } from "@/lib/types";

/** Total comments including replies */
export function countCommentsInTree(comments: VideoComment[]): number {
  let n = 0;
  const walk = (c: VideoComment) => {
    n += 1;
    c.replies?.forEach(walk);
  };
  comments.forEach(walk);
  return n;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const yy = String(d.getFullYear() % 100).padStart(2, "0");
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yy}. ${mm}. ${dd}. ${hh}:${mi}`;
}

/** Avoid hydration mismatch across locales */
function TimeLabel({ iso }: { iso: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return <>{formatTime(iso)}</>;
}

function CommentBlock({
  c,
  videoId,
  currentUserId,
  depth,
}: {
  c: VideoComment;
  videoId: string;
  currentUserId: string | null;
  depth: number;
}) {
  const router = useRouter();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [pending, startTransition] = useTransition();
  const [likeCount, setLikeCount] = useState(c.likeCount);
  const [liked, setLiked] = useState(c.likedByMe);

  const isOwner = currentUserId && c.userId === currentUserId;

  const onDelete = () => {
    if (!confirm("Delete this comment?")) return;
    startTransition(async () => {
      const res = await deleteCommentAction(c.id, videoId);
      if (!res.ok) {
        if ("needAuth" in res && res.needAuth) router.push("/auth");
        return;
      }
      router.refresh();
    });
  };

  const onLike = () => {
    startTransition(async () => {
      const res = await toggleCommentLikeAction(c.id, videoId);
      if (!res.ok) {
        if ("needAuth" in res && res.needAuth) router.push("/auth");
        return;
      }
      setLiked(res.liked);
      setLikeCount(res.count);
    });
  };

  const submitReply = () => {
    const t = replyText.trim();
    if (!t) return;
    startTransition(async () => {
      const res = await createCommentAction(videoId, t, c.id);
      if (!res.ok) {
        if ("needAuth" in res && res.needAuth) router.push("/auth");
        return;
      }
      setReplyText("");
      setReplyOpen(false);
      router.refresh();
    });
  };

  return (
    <div className={depth > 0 ? "ml-4 border-l border-white/10 pl-3" : ""}>
      <div className="flex gap-2">
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#26215C]">
          {c.avatarUrl ? (
            <Link href={`/profile/${c.userId}`} className="block h-full w-full">
              <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" />
            </Link>
          ) : (
            <Link
              href={`/profile/${c.userId}`}
              className="flex h-full w-full items-center justify-center text-[10px] text-[#AFA9EC] hover:underline"
            >
              ?
            </Link>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Link
              href={`/profile/${c.userId}`}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="cursor-pointer text-xs font-semibold text-[#EEEDFE] hover:underline"
            >
              {c.displayName ?? "User"}
            </Link>
            <span className="text-[9px] text-[#AFA9EC]/90">
              <TimeLabel iso={c.createdAt} />
            </span>
            {isOwner ? (
              <button
                type="button"
                onClick={() => void onDelete()}
                className="text-[9px] text-red-300/90 hover:underline"
                disabled={pending}
              >
                Delete
              </button>
            ) : null}
          </div>
          <p className="mt-0.5 whitespace-pre-wrap text-xs leading-snug text-[#E8E4FF]">{c.content}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <button
              type="button"
              onClick={onLike}
              disabled={pending}
              className={`inline-flex items-center gap-0.5 text-[10px] leading-none ${liked ? "text-rose-400" : "text-[#AFA9EC]"} hover:text-rose-300`}
            >
              <span aria-hidden>♥</span>
              <span>{likeCount}</span>
            </button>
            {currentUserId ? (
              <button
                type="button"
                onClick={() => setReplyOpen((v) => !v)}
                className="text-[10px] leading-none text-[#7F77DD] hover:underline"
              >
                Reply
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {replyOpen && currentUserId && (
        <div className="mt-2 ml-10 flex flex-col gap-1.5 sm:ml-10 sm:flex-row sm:items-end">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            placeholder="Write a reply..."
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#0A0A18]/70 px-2 py-1.5 text-[11px] text-[#EEEDFE] outline-none focus:ring-1 focus:ring-[#7F77DD]"
          />
          <button
            type="button"
            onClick={() => void submitReply()}
            disabled={pending}
            className="shrink-0 rounded-md bg-[#534AB7] px-2.5 py-1 text-[11px] font-medium text-[#EEEDFE] hover:bg-[#7F77DD] disabled:opacity-50"
          >
            Post
          </button>
        </div>
      )}
      {c.replies?.length ? (
        <div className="mt-2 space-y-2">
          {c.replies.map((r) => (
            <CommentBlock key={r.id} c={r} videoId={videoId} currentUserId={currentUserId} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function VideoCommentsSection({
  videoId,
  initialComments,
  currentUserId,
  className,
}: {
  videoId: string;
  initialComments: VideoComment[];
  currentUserId: string | null;
  /** Override default container class */
  className?: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [totalCount, setTotalCount] = useState(() => countCommentsInTree(initialComments));

  useEffect(() => {
    setTotalCount(countCommentsInTree(initialComments));
  }, [initialComments]);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    startTransition(async () => {
      const res = await createCommentAction(videoId, t, null);
      if (!res.ok) {
        if ("needAuth" in res && res.needAuth) router.push("/auth");
        return;
      }
      setText("");
      router.refresh();
    });
  };

  return (
    <section
      className={
        className ?? "rounded-xl border border-white/10 bg-[#1A1535]/80 p-5"
      }
    >
      <h2 className="text-base font-bold text-[#EEEDFE]">
        Comments {totalCount}
      </h2>

      {currentUserId ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Write a comment"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0A0A18]/70 px-3 py-2 text-sm text-[#EEEDFE] outline-none focus:ring-1 focus:ring-[#7F77DD]"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={pending}
            className="shrink-0 rounded-lg bg-[#534AB7] px-4 py-2 text-sm font-semibold text-[#EEEDFE] hover:bg-[#7F77DD] disabled:opacity-50"
          >
            Post
          </button>
        </div>
      ) : (
        <p className="mt-2 text-sm text-[#AFA9EC]">
          <button type="button" onClick={() => router.push("/auth")} className="text-[#7F77DD] underline">
            Sign in
          </button>
          to write comments.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {initialComments.length === 0 ? (
          <p className="text-sm text-[#AFA9EC]">Be the first to comment.</p>
        ) : (
          initialComments.map((c) => <CommentBlock key={c.id} c={c} videoId={videoId} currentUserId={currentUserId} depth={0} />)
        )}
      </div>
    </section>
  );
}
