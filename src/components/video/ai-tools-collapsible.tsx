"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";

export function AiToolsCollapsible({ tools }: { tools: string[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm text-white/30 transition hover:text-white/50"
      >
        <span>{t("watch.aiToolsUsed")}</span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open ? (
        <p className="mt-1 text-sm text-white/40 leading-relaxed">
          {tools.map((tool, i) => (
            <span key={tool}>
              {tool}
              {i < tools.length - 1 ? (
                <span className="mx-2 text-white/20">·</span>
              ) : null}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
