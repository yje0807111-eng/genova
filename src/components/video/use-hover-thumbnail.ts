"use client";

import { useState } from "react";

/**
 * Shared hover-swap behavior for video card thumbnails: while the
 * cursor is over the card and a Mux playback id is available, swap
 * the static thumbnail for Mux's `animated.gif` preview.
 *
 * Three call sites used to inline this:
 *   - HoverPreviewCard (home grid)
 *   - VideoPosterCard inside HomeGenreCarousel
 *   - ProfileVideoCard inside profile-page-client
 *
 * Each kept its own layout shell (Link wrapper, badges, gradient
 * overlay, runtime/likes meta row) but duplicated the state + URL
 * pattern.  Consolidating here makes the GIF parameters
 * (`?width=640&fps=15`) a single source of truth, and isolates the
 * hover state so future server-component migration of any card's
 * outer wrapper is a one-line edit instead of a state-lift refactor.
 *
 * The returned `onMouseEnter` / `onMouseLeave` handlers are stable
 * across renders (closures over the setter only), so they're safe
 * to spread onto the outer wrapper without memoization.
 */
export function useHoverThumbnail({
  thumbnailUrl,
  muxPlaybackId,
}: {
  thumbnailUrl: string | null | undefined;
  muxPlaybackId: string | null | undefined;
}): {
  src: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
} {
  const [hovered, setHovered] = useState(false);
  const muxId = muxPlaybackId?.trim();
  const src =
    hovered && muxId
      ? `https://image.mux.com/${muxId}/animated.gif?width=640&fps=15`
      : thumbnailUrl?.trim() || "";
  return {
    src,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };
}
