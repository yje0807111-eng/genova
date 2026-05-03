"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createCommentAction, deleteCommentAction, toggleCommentLikeAction } from "@/app/actions/comments";
import type { VideoComment } from "@/lib/types";
import { useI18n } from "@/components/genova/language-provider";
import { formatUploadedRelative } from "@/lib/format-uploaded-relative";
import { cn } from "@/lib/utils/cn";

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

/** Avoid hydration mismatch across locales */
function TimeLabel({ iso }: { iso: string }) {
  const { locale } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return <>{formatUploadedRelative(iso, locale)}</>;
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
  const { t } = useI18n();
  const router = useRouter();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [pending, startTransition] = useTransition();
  const [likeCount, setLikeCount] = useState(c.likeCount);
  const [liked, setLiked] = useState(c.likedByMe);
  const isOwner = currentUserId && c.userId === currentUserId;

  const onDelete = () => {
    if (!confirm(t("comments.deleteConfirm"))) return;
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
    const body = replyText.trim();
    if (!body) return;
    startTransition(async () => {
      const res = await createCommentAction(videoId, body, c.id);
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
    <div className={cn("py-3", depth > 0 ? "ml-8 border-l-2 border-white/5 pl-3" : "border-b border-white/5")}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#26215C]">
          {c.avatarUrl ? (
            <Link href={`/profile/${c.userId}`}>
              <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" />
            </Link>
          ) : (
            <Link
              href={`/profile/${c.userId}`}
              className="flex h-full w-full items-center justify-center text-xs font-bold text-white/60"
            >
              {(c.displayName ?? "U").slice(0, 1).toUpperCase()}
            </Link>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Name + time + delete */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <Link href={`/profile/${c.userId}`} className="text-sm font-semibold text-white hover:underline">
              {c.displayName ?? "User"}
            </Link>
            <span className="text-xs text-white/40">·</span>
            <span className="text-xs text-white/40">
              <TimeLabel iso={c.createdAt} />
            </span>
            {isOwner ? (
              <>
                <span className="text-xs text-white/40">·</span>
                <button
                  type="button"
                  onClick={() => void onDelete()}
                  disabled={pending}
                  className="text-xs text-red-400/70 hover:text-red-300 transition"
                >
                  {t("comments.delete")}
                </button>
              </>
            ) : null}
          </div>

          {/* Comment content */}
          <p className="mt-1 text-sm leading-relaxed text-white/80 whitespace-pre-wrap">{c.content}</p>

          {/* Actions: like + reply */}
          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              onClick={onLike}
              disabled={pending}
              className={cn(
                "flex items-center gap-1.5 text-xs transition",
                liked ? "text-rose-400" : "text-white/60 hover:text-rose-300",
              )}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinejoin="round"/>
              </svg>
              <span>{likeCount}</span>
            </button>

            {currentUserId && depth === 0 ? (
              <button
                type="button"
                onClick={() => setReplyOpen((v) => !v)}
                className="text-xs text-white/60 hover:text-[#7F77DD] transition"
              >
                {t("comments.reply")}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Reply input */}
      {replyOpen && currentUserId && depth === 0 && (
        <div className="mt-2 flex items-center gap-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void submitReply(); } }}
            placeholder={t("comments.placeholderReply")}
            className="flex-1 rounded-full border border-white/10 bg-[#0A0A18]/70 px-3 py-1.5 text-xs text-white outline-none focus:border-[#7F77DD]/50"
          />
          <button
            type="button"
            onClick={() => void submitReply()}
            disabled={pending}
            className="shrink-0 rounded-full bg-[#534AB7] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#7F77DD] disabled:opacity-50 transition"
          >
            {t("comments.post")}
          </button>
        </div>
      )}

      {/* Nested replies */}
      {c.replies?.length ? (
        <div className="mt-1 space-y-0">
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
  hideInput,
}: {
  videoId: string;
  initialComments: VideoComment[];
  currentUserId: string | null;
  /** Override default container class */
  className?: string;
  hideInput?: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    startTransition(async () => {
      const res = await createCommentAction(videoId, body, null);
      if (!res.ok) {
        if ("needAuth" in res && res.needAuth) router.push("/auth");
        return;
      }
      setText("");
      router.refresh();
    });
  };

  const sortedComments = useMemo(() => {
    return [...initialComments].sort((a, b) => {
      // Liked comments (likeCount > 0) go to top
      const aHasLikes = a.likeCount > 0;
      const bHasLikes = b.likeCount > 0;

      if (bHasLikes && !aHasLikes) return 1;   // b has likes, a doesn't → b goes first
      if (aHasLikes && !bHasLikes) return -1;  // a has likes, b doesn't → a goes first

      // Both have likes → sort by like count descending
      if (aHasLikes && bHasLikes) return b.likeCount - a.likeCount;

      // Neither has likes → sort by oldest first (chronological)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [initialComments]);

  return (
    <section
      className={
        className ?? ""
      }
    >
      {/* Comments list first */}
      <div className="divide-y divide-white/5">
        {initialComments.length === 0 ? (
          <p className="text-sm text-white/60">{t("comments.empty")}</p>
        ) : (
          sortedComments.map((c) => <CommentBlock key={c.id} c={c} videoId={videoId} currentUserId={currentUserId} depth={0} />)
        )}
      </div>

      {/* Input at the bottom */}
      {!hideInput ? (
        currentUserId ? (
          <div className="mt-4 border-t border-white/10 pt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder={t("comments.placeholder")}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0A0A18]/70 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#7F77DD]"
            />
            <button
              type="button"
              onClick={() => void submit()}
              disabled={pending}
              className="shrink-0 rounded-lg bg-[#534AB7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7F77DD] disabled:opacity-50"
            >
              {t("comments.post")}
            </button>
          </div>
        ) : (
          <p className="mt-4 border-t border-white/10 pt-4 text-sm text-white/60">
            <button type="button" onClick={() => router.push("/auth")} className="text-[#7F77DD] underline">
              {t("comments.signIn")}
            </button>
            {t("comments.afterLoginWrite")}
          </p>
        )
      ) : null}
    </section>
  );
}

export function CommentInput({
  videoId,
  currentUserId,
}: {
  videoId: string;
  currentUserId: string | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    startTransition(async () => {
      const res = await createCommentAction(videoId, body, null);
      if (!res.ok) {
        if ("needAuth" in res && res.needAuth) router.push("/auth");
        return;
      }
      setText("");
      router.refresh();
    });
  };

  if (!currentUserId) {
    return (
      <p className="text-xs text-white/60">
        <button type="button" onClick={() => router.push("/auth")} className="text-[#7F77DD] underline">
          {t("comments.signIn")}
        </button>
        {t("comments.afterLoginCompact")}
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void submit();
          }
        }}
        placeholder={t("comments.placeholderCompact")}
        className="flex-1 rounded-full border border-white/10 bg-[#0A0A18]/70 px-4 py-2 text-sm text-white outline-none focus:border-[#7F77DD]/50 focus:ring-1 focus:ring-[#7F77DD]/30 placeholder:text-white/40"
      />
      <button
        type="button"
        onClick={() => void submit()}
        disabled={pending || !text.trim()}
        className="shrink-0 rounded-full bg-[#534AB7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7F77DD] disabled:opacity-40 transition"
      >
        {t("comments.post")}
      </button>
    </div>
  );
}
