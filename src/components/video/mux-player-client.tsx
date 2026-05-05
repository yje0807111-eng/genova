"use client";

import MuxPlayer from "@mux/mux-player-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function MuxPlayerClient({
  playbackId,
  title,
  nextVideoId,
}: {
  playbackId: string;
  title: string;
  nextVideoId?: string | null;
}) {
  const router = useRouter();
  const [autoplayOn, setAutoplayOn] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("genova_autoplay");
    if (stored !== null) setAutoplayOn(stored === "true");
  }, []);

  return (
    <MuxPlayer
      playbackId={playbackId}
      envKey={process.env.NEXT_PUBLIC_MUX_ENV_KEY}
      streamType="on-demand"
      className="h-full w-full"
      style={{ aspectRatio: "16/9" }}
      accentColor="#534AB7"
      title={title}
      autoPlay
      onEnded={() => {
        if (autoplayOn && nextVideoId) {
          setTimeout(() => {
            router.push(`/watch/${nextVideoId}`);
          }, 500);
        }
      }}
    />
  );
}
