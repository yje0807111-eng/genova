"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shared hover-swap behavior for video card thumbnails.
 *
 * While the cursor dwells on a card (and a Mux playback id exists),
 * swap the static thumbnail for Mux's animated preview.
 *
 * Quality fixes over the naive "swap src on mouseenter":
 *  1. Hover-intent delay (~250ms) — a cursor merely passing over the
 *     grid while scrolling no longer fires a Mux request per card.
 *  2. Preload-then-show — the preview is fetched in the background
 *     first; we only swap once it's decoded, so the first hover
 *     doesn't flash an empty/half-loaded frame.
 *  3. animated.webp instead of animated.gif — far smaller payload
 *     and better quality at the same fps.
 *
 * Used by HoverPreviewCard (home grid), the HomeGenreCarousel poster,
 * and ProfileVideoCard.  The returned handlers are recreated per
 * render but only ever spread onto a DOM element's listeners, so no
 * memoization is needed.
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
  const muxId = muxPlaybackId?.trim();
  const staticSrc = thumbnailUrl?.trim() || "";
  const previewSrc = muxId
    ? `https://image.mux.com/${muxId}/animated.webp?width=640&fps=15`
    : "";

  const [showPreview, setShowPreview] = useState(false);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Once the preview has decoded for this card, skip the load wait on
  // subsequent hovers (browser cache already holds it).
  const preloadedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (enterTimer.current) clearTimeout(enterTimer.current);
    };
  }, []);

  const onMouseEnter = () => {
    if (!previewSrc) return;
    if (enterTimer.current) clearTimeout(enterTimer.current);
    enterTimer.current = setTimeout(() => {
      if (preloadedRef.current) {
        setShowPreview(true);
        return;
      }
      // Background-decode the webp, only flip once ready.
      const img = new Image();
      img.onload = () => {
        preloadedRef.current = true;
        setShowPreview(true);
      };
      img.src = previewSrc;
    }, 250);
  };

  const onMouseLeave = () => {
    if (enterTimer.current) {
      clearTimeout(enterTimer.current);
      enterTimer.current = null;
    }
    setShowPreview(false);
  };

  const src = showPreview && previewSrc ? previewSrc : staticSrc;
  return { src, onMouseEnter, onMouseLeave };
}
