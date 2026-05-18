"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { MessageCircle, X } from "lucide-react";
import {
  CommentInput,
  VideoCommentsSection,
} from "@/components/comments/video-comments-section";
import { useI18n } from "@/components/genova/language-provider";
import { useExitAnimation } from "@/lib/hooks/use-exit-animation";
import type { VideoComment } from "@/lib/types";

/**
 * 모바일 전용 — YouTube 스타일 한 줄 댓글 미리보기.
 * 상단 댓글부터 일정 간격으로 한 개씩 회전 노출, 탭하면 하단에서
 * 올라오는 시트로 전체 댓글을 연다.
 */
export function MobileCommentPeek({
  videoId,
  comments,
  currentUserId,
  isVideoOwner,
}: {
  videoId: string;
  comments: VideoComment[];
  currentUserId: string | null;
  isVideoOwner?: boolean;
}) {
  const { t } = useI18n();
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const { render, closing } = useExitAnimation(open, 300);

  // 상단(0번)부터 순서대로 한 개씩 회전. 시트가 열려 있으면 멈춤.
  useEffect(() => {
    if (open || comments.length <= 1) return;
    const id = setInterval(() => {
      setIdx((p) => (p + 1) % comments.length);
    }, 4000);
    return () => clearInterval(id);
  }, [open, comments.length]);

  // 댓글 수가 줄어드는 등 경계 보정.
  const safeIdx = comments.length ? idx % comments.length : 0;
  const current = comments[safeIdx];

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="px-3 py-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2.5 text-left transition active:opacity-70"
      >
        <MessageCircle className="h-4 w-4 shrink-0 text-white/40" />
        {current ? (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-white/[0.06]">
              <Image
                src={current.avatarUrl || "/default-avatar.png"}
                alt=""
                width={24}
                height={24}
                className="h-full w-full object-cover"
              />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-white/75">
              <span className="font-semibold text-white/90">
                {current.displayName ?? "—"}
              </span>{" "}
              {current.content}
            </span>
          </span>
        ) : (
          <span className="min-w-0 flex-1 truncate text-[13px] text-white/40">
            {t("comments.empty", "첫 댓글을 남겨 보세요.")}
          </span>
        )}
        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-white/35">
          {comments.length}
        </span>
      </button>

      {render &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className={`fixed inset-0 z-[140] flex flex-col justify-end ${
              closing ? "anim-scrim-out" : "anim-scrim"
            } bg-black/70 backdrop-blur-sm`}
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`${
                closing ? "anim-sheet-out" : "anim-sheet"
              } flex h-[88vh] flex-col overflow-hidden rounded-t-2xl border-t border-white/[0.08] bg-[#0a0a0a]`}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-1 w-9 rounded-full bg-white/15" aria-hidden />
                </div>
                <h3 className="absolute left-1/2 -translate-x-1/2 text-[14px] font-bold text-white">
                  {t("watch.tab.comments", "댓글")} · {comments.length}
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/55 transition active:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3"
                onWheel={(e) => e.stopPropagation()}
              >
                <VideoCommentsSection
                  videoId={videoId}
                  initialComments={comments}
                  currentUserId={currentUserId}
                  hideInput
                  isVideoOwner={isVideoOwner}
                />
              </div>

              <div className="shrink-0 border-t border-white/10 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
                <CommentInput
                  videoId={videoId}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
