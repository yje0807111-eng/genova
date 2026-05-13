"use client";

import MuxPlayer, { type MuxPlayerRefAttributes } from "@mux/mux-player-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { saveVideoProgress } from "@/app/actions/video-progress";

export function MuxPlayerClient({
  playbackId,
  title,
  nextVideoId,
  userId,
  videoId,
  initialProgressSeconds = 0,
}: {
  playbackId: string;
  title: string;
  nextVideoId?: string | null;
  userId?: string | null;
  videoId: string;
  initialProgressSeconds?: number;
}) {
  const router = useRouter();
  const [autoplayOn, setAutoplayOn] = useState(true);
  const playerRef = useRef<HTMLElement | null>(null);
  const lastSavedAtRef = useRef(0);
  const restoreDoneRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("genova_autoplay");
    if (stored !== null) setAutoplayOn(stored === "true");
  }, []);

  useEffect(() => {
    restoreDoneRef.current = false;
    lastSavedAtRef.current = 0;
  }, [videoId, playbackId]);

  const restoreInitialTime = () => {
    if (restoreDoneRef.current) return;
    if (!initialProgressSeconds || initialProgressSeconds <= 0) return;
    const media = playerRef.current as unknown as HTMLMediaElement | null;
    if (!media) return;
    try {
      media.currentTime = initialProgressSeconds;
      restoreDoneRef.current = true;
    } catch {
      // Ignore seeking failures during early metadata lifecycle.
    }
  };

  return (
    <MuxPlayer
      ref={playerRef as React.Ref<MuxPlayerRefAttributes>}
      playbackId={playbackId}
      envKey={process.env.NEXT_PUBLIC_MUX_ENV_KEY}
      streamType="on-demand"
      className="h-full w-full aspect-video"
      accentColor="#534AB7"
      title={title}
      autoPlay
      onLoadedMetadata={restoreInitialTime}
      onTimeUpdate={(e) => {
        if (!userId) return;
        const media = e.currentTarget as unknown as HTMLMediaElement;
        const now = Date.now();
        if (now - lastSavedAtRef.current < 5000) return;
        const currentTime = Number(media.currentTime ?? 0);
        const duration = Number(media.duration ?? 0);
        if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) return;
        lastSavedAtRef.current = now;
        void saveVideoProgress({
          videoId,
          progressSeconds: currentTime,
          durationSeconds: duration,
        });
      }}
      onEnded={(e) => {
        if (userId) {
          const media = e.currentTarget as unknown as HTMLMediaElement;
          const duration = Number(media.duration ?? 0);
          if (Number.isFinite(duration) && duration > 0) {
            void saveVideoProgress({
              videoId,
              progressSeconds: duration,
              durationSeconds: duration,
            });
          }
        }
        if (autoplayOn && nextVideoId) {
          setTimeout(() => {
            router.push(`/watch/${nextVideoId}`);
          }, 500);
        }
      }}
    />
  );
}
