"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { MuxPlayerClient as MuxPlayerClientType } from "./mux-player-client";

/**
 * E2: client-side wrapper that lazy-loads MuxPlayerClient.
 *
 * Why this exists:
 *   @mux/mux-player-react is ~150 KB minified.  Importing it directly
 *   from the watch-page server component pulls it into the initial
 *   SSR / hydration bundle and delays first paint.  Wrapping it in
 *   next/dynamic with ssr: false defers the player until after the
 *   page shell renders, so the user sees the surrounding chrome
 *   (title, comments rail, etc.) immediately and the player streams
 *   in shortly after.
 *
 * Why the indirection (separate file from mux-player-client):
 *   `next/dynamic({ ssr: false })` is a client-only API and can't be
 *   called from a server component.  Watch page (page.tsx) is
 *   server-rendered, so we expose this thin client wrapper for it to
 *   import.  The actual player implementation stays in
 *   ./mux-player-client.tsx — no behaviour changes.
 */
const LazyMuxPlayerClient = dynamic(
  () =>
    import("./mux-player-client").then((mod) => ({
      default: mod.MuxPlayerClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full w-full bg-black"
        // Quiet placeholder — the parent <div> already supplies the
        // aspect-video container, so this just fills it black while
        // the bundle streams in.  A pulse would distract from the
        // page shell which is the visible-first thing.
      />
    ),
  },
);

export type MuxPlayerProps = ComponentProps<typeof MuxPlayerClientType>;

export function MuxPlayer(props: MuxPlayerProps) {
  return <LazyMuxPlayerClient {...props} />;
}
