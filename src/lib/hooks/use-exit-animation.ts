"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Keeps a popup/modal mounted long enough to play an exit animation.
 *
 * Usage:
 *   const { render, closing } = useExitAnimation(open, 200);
 *   if (!render) return null;
 *   <div className={closing ? "anim-scrim-out" : "anim-scrim"} ...>
 *     <div className={closing ? "anim-modal-out" : "anim-modal"} ...>
 *
 * `durationMs` must match the *-out CSS animation duration so the node
 * unmounts exactly when the exit finishes.
 */
export function useExitAnimation(open: boolean, durationMs = 200) {
  const [render, setRender] = useState(open);
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      if (timer.current) clearTimeout(timer.current);
      setRender(true);
      setClosing(false);
      return;
    }
    if (!render) return;
    setClosing(true);
    timer.current = setTimeout(() => {
      setRender(false);
      setClosing(false);
    }, durationMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [open, render, durationMs]);

  return { render, closing };
}
