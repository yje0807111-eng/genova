"use client";

import type { ReactNode } from "react";

/**
 * Tiny client island carved out of `HomeCompetitionBanner` so the rest
 * of the banner can render server-side (B.2-8a).  Sole reason this
 * needs to stay client: the smooth-scroll-to-`[data-content-start]`
 * handler.  Label text is rendered as `children` from the (server)
 * parent so the translation lookup stays on the server.
 */
export function BrowseFilmsButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => {
        const el = document.querySelector("[data-content-start]");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.15] bg-white/[0.03] px-5 py-2.5 text-[13px] font-semibold text-white/80 backdrop-blur-md transition hover:border-white/[0.3] hover:bg-white/[0.06] hover:text-white"
    >
      {children}
    </button>
  );
}
