"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Heart, MoreHorizontal, Pin, Trash2 } from "lucide-react";
import { createCommentAction, deleteCommentAction, pinCommentAction, toggleCommentLikeAction } from "@/app/actions/comments";
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

function CommentMenu({
  onPin,
  onDelete,
  isPinned,
}: {
  onPin?: () => void;
  onDelete: () => void;
  isPinned?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded p-1 text-white/40 hover:bg-white/[0.06] hover:text-white/80"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-32 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-xl">
          {onPin && (
            <button
              type="button"
              onClick={() => { onPin(); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-white/80 transition hover:bg-white/[0.04]"
            >
              <Pin className="h-3 w-3" />
              {isPinned ? t("comment.unpin", "핀 해제") : t("comment.pin", "핀 고정")}
            </button>
          )}
          <button
            type="button"
            onClick={() => { onDelete(); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-red-400 transition hover:bg-red-500/[0.06]"
          >
            <Trash2 className="h-3 w-3" />
            {t("comments.delete", "삭제")}
          </button>
        </div>
      )}
    </div>
  );
}

function CommentBlock({
  c,
  videoId,
  currentUserId,
  depth,
  isVideoOwner,
  onPinToggle,
}: {
  c: VideoComment;
  videoId: string;
  currentUserId: string | null;
  depth: number;
  isVideoOwner: boolean;
  onPinToggle: (commentId: string, pinned: boolean, pinOrder: number | null) => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [pending, startTransition] = useTransition();
  const [likeCount, setLikeCount] = useState(c.likeCount);
  const [liked, setLiked] = useState(c.likedByMe);
  const [pinned, setPinned] = useState(c.isPinned ?? false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const isOwner = currentUserId && c.userId === currentUserId;

  const onDelete = () => setShowDeleteModal(true);

  const confirmDelete = () => {
    setShowDeleteModal(false);
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

  const onPin = () => {
    startTransition(async () => {
      const res = await pinCommentAction(c.id, videoId, !pinned);
      if (res.ok) {
        const nextPinned = !pinned;
        setPinned(nextPinned);
        onPinToggle(c.id, nextPinned, res.pinOrder);
      }
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

  const canManage = isOwner || isVideoOwner;

  return (
    <div
      className={cn(
        "group relative flex gap-2.5 py-2.5",
        depth > 0 ? "ml-8 border-l-2 border-white/5 pl-3" : "border-b border-white/5",
      )}
    >
      {/* Avatar */}
      <Link href={`/profile/${c.userId}`} className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#26215C]">
        <Image src={c.avatarUrl || "/default-avatar.png"} alt="" width={28} height={28} className="h-full w-full object-cover" />
      </Link>

      <div className="min-w-0 flex-1">
        {/* Name + time + pin badge */}
        <div className="flex items-center gap-1.5">
          <Link href={`/profile/${c.userId}`} className="text-[12px] font-bold text-white hover:text-[#AFA9EC] transition">
            {c.displayName ?? "User"}
          </Link>
          <span className="text-[10px] text-white/35">
            <TimeLabel iso={c.createdAt} />
          </span>
          {depth === 0 && pinned && (
            <span className="flex items-center gap-0.5 text-[10px] text-[#AFA9EC]">
              <Pin className="h-2.5 w-2.5" />
              고정됨
            </span>
          )}
        </div>

        {/* Comment body */}
        <p className="mt-0.5 text-[13px] leading-relaxed text-white/80 whitespace-pre-wrap">{c.content}</p>

        {/* Action buttons */}
        <div className="mt-1.5 flex items-center gap-3">
          <button
            type="button"
            onClick={onLike}
            disabled={pending}
            className={cn(
              "flex items-center gap-1 text-[11px] transition",
              liked ? "text-rose-400" : "text-white/45 hover:text-rose-300",
            )}
          >
            <Heart className="h-3 w-3" fill={liked ? "currentColor" : "none"} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          {currentUserId && depth === 0 && (
            <button
              type="button"
              onClick={() => setReplyOpen((v) => !v)}
              className="text-[11px] text-white/45 hover:text-[#7F77DD] transition"
            >
              {t("comments.reply")}
            </button>
          )}
        </div>

        {/* Reply input */}
        {replyOpen && currentUserId && depth === 0 && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1 transition focus-within:border-[#7F77DD]/40">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void submitReply(); } }}
              placeholder={t("comment.replyPlaceholder", "답글 달기...")}
              className="flex-1 bg-transparent px-2 text-[12px] text-white placeholder:text-white/30 outline-none"
            />
            <button
              type="button"
              onClick={() => void submitReply()}
              disabled={pending || !replyText.trim()}
              className="shrink-0 rounded-md bg-[#534AB7] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#6b5fd4] disabled:opacity-50 transition"
            >
              {pending ? t("comment.submitting", "게시 중...") : t("comment.submit", "게시")}
            </button>
          </div>
        )}

        {/* Nested replies */}
        {c.replies?.length ? (
          <div className="mt-1 space-y-0">
            {c.replies.map((r) => (
              <CommentBlock
                key={r.id}
                c={r}
                videoId={videoId}
                currentUserId={currentUserId}
                depth={depth + 1}
                isVideoOwner={isVideoOwner}
                onPinToggle={onPinToggle}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Hover menu (owner / video-owner only) */}
      {canManage && (
        <div className="absolute right-0 top-2.5 opacity-0 transition group-hover:opacity-100">
          <CommentMenu
            onPin={isVideoOwner && depth === 0 ? onPin : undefined}
            onDelete={onDelete}
            isPinned={pinned}
          />
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-2xl border border-white/[0.08] p-6"
            style={{
              background: "linear-gradient(135deg, rgba(20,17,50,0.99) 0%, rgba(10,8,28,1) 100%)",
              boxShadow: "0 0 0 1px rgba(127,119,221,0.1), 0 40px 80px rgba(0,0,0,0.6)",
            }}
          >
            <h2 className="text-lg font-black text-white">댓글 삭제</h2>
            <p className="mt-1 text-sm text-white/35">이 댓글을 삭제하시겠습니까? 되돌릴 수 없습니다.</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-white/50 transition hover:border-white/20 hover:text-white"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                  boxShadow: "0 4px 16px rgba(220,38,38,0.3)",
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function VideoCommentsSection({
  videoId,
  initialComments,
  currentUserId,
  className,
  hideInput,
  isVideoOwner,
}: {
  videoId: string;
  initialComments: VideoComment[];
  currentUserId: string | null;
  /** Override default container class */
  className?: string;
  hideInput?: boolean;
  isVideoOwner?: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [comments, setComments] = useState<VideoComment[]>(initialComments);
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

  const onPinToggle = (commentId: string, pinned: boolean, pinOrder: number | null) => {
    setComments((prev) => {
      if (pinned) {
        const maxOrder = prev.reduce((max, item) => {
          if (!item.isPinned) return max;
          return Math.max(max, item.pinOrder ?? 0);
        }, -1);
        const nextOrder = pinOrder ?? (maxOrder >= 0 ? maxOrder + 1 : 0);
        return prev.map((item) =>
          item.id === commentId ? { ...item, isPinned: true, pinOrder: nextOrder } : item,
        );
      }

      const unpinned = prev.map((item) =>
        item.id === commentId ? { ...item, isPinned: false, pinOrder: null } : item,
      );
      const orderedPinned = [...unpinned]
        .filter((item) => item.isPinned)
        .sort((a, b) => (a.pinOrder ?? 0) - (b.pinOrder ?? 0));
      const orderMap = new Map(orderedPinned.map((item, idx) => [item.id, idx]));
      return unpinned.map((item) =>
        item.isPinned ? { ...item, pinOrder: orderMap.get(item.id) ?? null } : item,
      );
    });
  };

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      const aPinned = a.isPinned ?? false;
      const bPinned = b.isPinned ?? false;

      // 핀된 댓글 최상단, pin_order 오름차순 (0이 가장 위)
      if (aPinned && bPinned) return (a.pinOrder ?? 0) - (b.pinOrder ?? 0);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // 일반 댓글 기존 정렬
      const aHasLikes = a.likeCount > 0;
      const bHasLikes = b.likeCount > 0;
      if (bHasLikes && !aHasLikes) return 1;
      if (aHasLikes && !bHasLikes) return -1;
      if (aHasLikes && bHasLikes) return b.likeCount - a.likeCount;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [comments]);

  return (
    <section
      className={
        className ?? ""
      }
    >
      {/* Comments list first */}
      <div className="divide-y divide-white/5">
        {comments.length === 0 ? (
          <p className="text-sm text-white/55">{t("comments.empty")}</p>
        ) : (
          sortedComments.map((c) => (
            <CommentBlock
              key={c.id}
              c={c}
              videoId={videoId}
              currentUserId={currentUserId}
              depth={0}
              isVideoOwner={isVideoOwner ?? false}
              onPinToggle={onPinToggle}
            />
          ))
        )}
      </div>

      {/* Input at the bottom */}
      {!hideInput ? (
        currentUserId ? (
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1.5 transition focus-within:border-[#7F77DD]/40 focus-within:bg-white/[0.04]">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && text.trim()) {
                    e.preventDefault();
                    void submit();
                  }
                }}
                placeholder={t("comment.placeholder", "댓글을 입력하세요...")}
                className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/30 outline-none"
              />
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!text.trim() || pending}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-bold transition",
                  text.trim() && !pending
                    ? "bg-[#534AB7] text-white hover:bg-[#6b5fd4]"
                    : "bg-white/[0.04] text-white/30 cursor-not-allowed"
                )}
              >
                {pending ? t("comment.submitting", "게시 중...") : t("comment.submit", "게시")}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-4 border-t border-white/10 pt-4 text-sm text-white/55">
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
      <p className="text-xs text-white/55">
        <button type="button" onClick={() => router.push("/auth")} className="text-[#7F77DD] underline">
          {t("comments.signIn")}
        </button>
        {t("comments.afterLoginCompact")}
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1.5 transition focus-within:border-[#7F77DD]/40 focus-within:bg-white/[0.04]">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && text.trim()) {
            e.preventDefault();
            void submit();
          }
        }}
        placeholder={t("comment.placeholder", "댓글을 입력하세요...")}
        className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/30 outline-none"
      />
      <button
        type="button"
        onClick={() => void submit()}
        disabled={!text.trim() || pending}
        className={cn(
          "shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-bold transition",
          text.trim() && !pending
            ? "bg-[#534AB7] text-white hover:bg-[#6b5fd4]"
            : "bg-white/[0.04] text-white/30 cursor-not-allowed"
        )}
      >
        {pending ? t("comment.submitting", "게시 중...") : t("comment.submit", "게시")}
      </button>
    </div>
  );
}
