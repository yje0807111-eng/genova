"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Returns a 9-page-wide window centered on `currentPage`, clamped to
 * `[1, totalPages]`.  Used to render the numeric page-button row in
 * the middle of the paginator.
 */
function getVisiblePages(currentPage: number, totalPages: number): number[] {
  const WINDOW = 9;
  let start = Math.max(1, currentPage - Math.floor(WINDOW / 2));
  let end = start + WINDOW - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - WINDOW + 1);
  }
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

/**
 * Numeric paginator with first/prev/window/next/last controls.
 *
 * Owns the scroll-to-top side-effect on page change so the parent
 * shell doesn't need to thread `window.scrollTo` through callbacks.
 * Renders nothing when `totalPages <= 1` — the parent doesn't have
 * to gate it.
 *
 * No `useI18n` blocker (no translated labels).  All page navigation
 * state lives in the parent and is passed via `onPageChange`.
 */
export function ProfilePaginator({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const goto = (page: number, smooth = true) => {
    onPageChange(page);
    if (smooth) {
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const btnBase =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/50 transition hover:border-white/15 hover:bg-white/[0.05] hover:text-white disabled:opacity-30";

  return (
    <div className="w-full px-0">
      <div className="mt-8 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => goto(1)}
          disabled={currentPage === 1}
          className={btnBase}
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => goto(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={btnBase}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-2">
          {getVisiblePages(currentPage, totalPages).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => goto(page, false)}
              className={cn(
                "h-8 w-8 rounded-lg border text-xs transition",
                currentPage === page
                  ? "border-[#534AB7]/40 bg-[#534AB7]/20 font-medium text-[#AFA9EC]"
                  : "border-white/[0.08] bg-white/[0.02] text-white/50 hover:border-white/15 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => goto(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={btnBase}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => goto(totalPages)}
          disabled={currentPage === totalPages}
          className={btnBase}
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
