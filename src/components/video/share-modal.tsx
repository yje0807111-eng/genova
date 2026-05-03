"use client";

import { useState } from "react";
import { Check, Facebook, Link, Share2, Twitter, X } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { cn } from "@/lib/utils/cn";

export function ShareButton({ title, className }: { title: string; className?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white",
          className,
        )}
      >
        <Share2 className="h-4 w-4" />
        {t("share.share")}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">{t("share.modalTitle")}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-white/5 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 line-clamp-1 text-xs text-muted-foreground">{title}</p>

            {/* Copy link */}
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <Link className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-xs text-muted-foreground">{url}</span>
              <button
                type="button"
                onClick={copyLink}
                className="flex items-center gap-1 shrink-0 rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90 transition"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" /> {t("share.copied")}
                  </>
                ) : (
                  t("share.copy")
                )}
              </button>
            </div>

            {/* Social share */}
            <div className="flex gap-3">
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground hover:bg-white/5 transition"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground hover:bg-white/5 transition"
              >
                <Facebook className="h-4 w-4" />
                {t("share.facebook")}
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
