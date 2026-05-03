"use client";

import MuxPlayer from "@mux/mux-player-react";

type Props = {
  title: string;
  vimeoId: string | null;
  muxPlaybackId?: string | null;
};

export function WatchVideoEmbed({ title, vimeoId, muxPlaybackId }: Props) {
  if (muxPlaybackId) {
    return (
      <MuxPlayer
        playbackId={muxPlaybackId}
        streamType="on-demand"
        accentColor="#534AB7"
        style={{ width: "100%", height: "100%", aspectRatio: "16/9" }}
        metadata={{ video_title: title }}
      />
    );
  }

  const id = vimeoId?.trim();
  if (!id) {
    return (
      <div className="flex h-full min-h-[200px] w-full items-center justify-center bg-black text-sm text-white/50">
        Video unavailable
      </div>
    );
  }

  return (
    <iframe
      src={`https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&badge=0&like=0&watchlater=0&share=0`}
      className="h-full w-full"
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      title={title}
    />
  );
}
