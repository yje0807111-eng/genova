"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimateIn } from "@/components/animate-in";
import { toggleLikeAction } from "@/app/actions/engagement";
import type { Video } from "@/lib/types";
import { VideoLikeButton } from "@/components/video/video-like-button";
import { useI18n } from "@/components/genova/language-provider";

type CompetitionHeader = {
  id: string;
  title: string;
  prizeInfo: string;
} | null;

function creatorLabel(v: Video, t: (key: string, fallback?: string) => string): string {
  return v.creatorName ?? v.uploaderDisplayName ?? t("video.creatorFallback");
}

type ModalContext = "finalist" | "archive";

type Ranked = { video: Video; rank: number };

function CompetitionVoteButton({
  videoId,
  initialCount,
  initialLiked,
  canVote,
  fullWidth = true,
}: {
  videoId: string;
  initialCount: number;
  initialLiked: boolean;
  canVote: boolean;
  fullWidth?: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setCount(initialCount);
    setLiked(initialLiked);
  }, [initialCount, initialLiked, videoId]);

  if (!canVote) {
    return <p className="text-center text-xs text-[#AFA9EC]">{t("competition.page.signInToVote")}</p>;
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const res = await toggleLikeAction(videoId);
          if (!res.ok) {
            if ("needAuth" in res && res.needAuth) router.push("/auth");
            return;
          }
          setLiked(res.liked);
          setCount(res.count);
          router.refresh();
        });
      }}
      className={`${fullWidth ? "w-full" : ""} inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#EEEDFE] transition disabled:opacity-50 ${
        liked ? "bg-[#7F77DD] shadow-[0_0_0_1px_rgba(238,237,254,0.18)_inset]" : "bg-[#534AB7] hover:bg-[#665cc9]"
      }`}
    >
      <span aria-hidden>♥</span>
      <span>
        {liked ? t("competition.page.voted") : t("competition.page.vote")} {count}
      </span>
    </button>
  );
}

export function CompetitionPageClient({
  competition,
  dDay,
  rankedFinalists,
  archiveVideos,
  canVote,
}: {
  competition: CompetitionHeader;
  dDay: number;
  rankedFinalists: Ranked[];
  archiveVideos: Video[];
  canVote: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState<Video | null>(null);
  const [ctx, setCtx] = useState<ModalContext>("finalist");

  const close = () => setOpen(null);

  const openModal = (video: Video, kind: ModalContext) => {
    setCtx(kind);
    setOpen(video);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <AnimateIn delay={0} className="rounded-xl border border-white/10 bg-[#0D0B1E]/90 p-5 sm:p-6">
        <p className="text-xs text-[#AFA9EC]">{t("competition.page.currentLabel")}</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          {competition?.title ?? t("competition.page.noCompetitionTitle")}
        </h1>
        {competition && (
          <>
            <p className="mt-2 text-sm text-[#AFA9EC]">{competition.prizeInfo}</p>
            <p className="mt-2 text-sm font-semibold">
              {dDay > 0 ? `D-${dDay}` : t("competition.detail.endsToday")}
            </p>
            <p className="mt-2 text-xs text-[#AFA9EC]">{t("competition.page.rankingHint")}</p>
          </>
        )}
      </AnimateIn>

      <AnimateIn delay={0.1} className="space-y-3">
        <h2 className="text-lg font-bold">{t("competition.page.finalsVote")}</h2>
        {!competition ? (
          <p className="text-sm text-[#AFA9EC]">{t("competition.page.noOpenCompetition")}</p>
        ) : rankedFinalists.length === 0 ? (
          <p className="text-sm text-[#AFA9EC]">{t("competition.page.noFinalists")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rankedFinalists.map(({ video, rank }, idx) => (
              <AnimateIn key={video.id} delay={0.18 + idx * 0.08}>
                <div className="video-card-hover overflow-hidden rounded-lg border border-white/[0.08] bg-[#07061A]/80">
                <div className="flex h-full flex-col">
                  <button
                    type="button"
                    onClick={() => openModal(video, "finalist")}
                    className="w-full text-left transition hover:bg-[#1A1535]/60"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-black/30">
                      <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover transition duration-200" />
                      <span className="absolute left-2 top-2 rounded bg-black/65 px-2 py-0.5 text-xs font-bold text-[#FFD873]">
                        #{rank}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-semibold text-[#EEEDFE]">{video.title}</p>
                      <p className="mt-1 text-xs text-[#AFA9EC]">{creatorLabel(video, t)}</p>
                    </div>
                  </button>
                  <div className="mt-auto border-t border-white/10 p-3">
                    <CompetitionVoteButton
                      videoId={video.id}
                      initialCount={video.likeCount ?? 0}
                      initialLiked={video.likedByMe ?? false}
                      canVote={canVote}
                    />
                  </div>
                </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        )}
      </AnimateIn>

      <AnimateIn delay={0.2} className="space-y-3">
        <h2 className="text-lg font-bold">{t("competition.page.awardArchive")}</h2>
        {archiveVideos.length === 0 ? (
          <p className="text-sm text-[#AFA9EC]">{t("competition.page.noWinners")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {archiveVideos.map((video, idx) => (
              <AnimateIn key={video.id} delay={0.24 + idx * 0.08}>
                <div className="video-card-hover overflow-hidden rounded-lg border border-white/[0.08] bg-[#07061A]/80">
                <div className="relative flex gap-3">
                  <button
                    type="button"
                    onClick={() => openModal(video, "archive")}
                    className="flex min-w-0 flex-1 gap-3 text-left transition hover:bg-white/[0.03]"
                  >
                    <div className="relative aspect-video w-36 shrink-0 overflow-hidden bg-black/30 sm:w-44">
                      <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover transition duration-200" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center py-2 pr-2">
                      <p className="line-clamp-2 text-sm font-medium text-[#EEEDFE]">{video.title}</p>
                      <p className="mt-1 text-xs text-[#AFA9EC]">{creatorLabel(video, t)}</p>
                      {video.award && (
                        <span className="mt-2 inline-block max-w-full truncate rounded bg-[#534AB7]/40 px-2 py-0.5 text-[10px] text-[#E8E4FF]">
                          {video.award}
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="flex shrink-0 items-start py-2 pr-2" onClick={(e) => e.stopPropagation()}>
                    <VideoLikeButton
                      videoId={video.id}
                      initialCount={video.likeCount ?? 0}
                      initialLiked={video.likedByMe ?? false}
                      compact
                    />
                  </div>
                </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        )}
      </AnimateIn>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={close}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-white/15 bg-[#1A1535] p-4 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="comp-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-lg text-[#EEEDFE] transition hover:bg-black/70"
              aria-label={t("common.close")}
            >
              ×
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              <iframe
                src={`https://player.vimeo.com/video/${open.vimeoId}`}
                className="h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={open.title}
              />
            </div>
            <h3 id="comp-modal-title" className="mt-4 pr-10 text-lg font-bold text-[#EEEDFE]">
              {open.title}
            </h3>
            <p className="mt-1 text-sm text-[#AFA9EC]">{creatorLabel(open, t)}</p>

            <div className="mt-4 space-y-3">
              <CompetitionVoteButton
                key={`${open.id}-modal`}
                videoId={open.id}
                initialCount={open.likeCount ?? 0}
                initialLiked={open.likedByMe ?? false}
                canVote={canVote}
              />
              {ctx === "archive" && (
                <Link
                  href={`/watch/${open.id}`}
                  className="inline-flex w-full justify-center rounded-full bg-[#534AB7] px-4 py-2 text-sm font-semibold text-[#EEEDFE] hover:bg-[#7F77DD]"
                >
                  {t("competition.page.viewFilm")}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
