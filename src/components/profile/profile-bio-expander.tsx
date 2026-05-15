"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { cn } from "@/lib/utils/cn";

/**
 * Client wrapper that owns the bio expand/collapse state and swaps
 * between two server-rendered ReactNode slots.  Pulled out of
 * `ProfileBio` (formerly entirely client) so the surrounding bio
 * markup — paragraph text, tools chips, country/joined meta, social
 * link row — can render on the server (C-2 server-slot pattern).
 *
 * The toggle button text is the only string this island translates
 * itself; everything else is pre-rendered by the server caller and
 * comes in via the slots.
 *
 * Slots:
 *   - `collapsedView`  — paragraph shown when collapsed (server-rendered)
 *   - `expandedView`   — paragraph shown when expanded (server-rendered)
 *   - `expandedExtras` — tools/country/joined/socials block, expanded only
 */
export function ProfileBioExpander({
  hasMore,
  collapsedView,
  expandedView,
  expandedExtras,
}: {
  hasMore: boolean;
  collapsedView: ReactNode;
  expandedView: ReactNode;
  expandedExtras: ReactNode;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {expanded ? expandedView : collapsedView}

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-[#AFA9EC] transition hover:text-white"
        >
          {expanded ? t("profile.showLess", "Show less") : t("profile.showMore", "Show more")}
          <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
        </button>
      )}

      {expanded && expandedExtras}
    </>
  );
}
