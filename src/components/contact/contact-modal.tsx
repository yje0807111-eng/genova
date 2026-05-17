"use client";

import { createPortal } from "react-dom";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { X, Send } from "lucide-react";
import { toast } from "sonner";
import { useExitAnimation } from "@/lib/hooks/use-exit-animation";
import { useI18n } from "@/components/genova/language-provider";
import {
  submitOperatorMessageAction,
  type OperatorMessageCategory,
} from "@/app/actions/operator-messages";

/**
 * User → operator contact / issue-report popup.
 * `open=false` closed; submits to operator_messages via server action.
 */
export function ContactModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const { render, closing } = useExitAnimation(open, 200);

  const [category, setCategory] = useState<OperatorMessageCategory>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!render || typeof window === "undefined") return null;

  const categories: { value: OperatorMessageCategory; label: string }[] = [
    { value: "bug", label: t("contact.catBug", "Bug") },
    { value: "suggestion", label: t("contact.catSuggestion", "Suggestion") },
    { value: "error", label: t("contact.catError", "Error report") },
    { value: "other", label: t("contact.catOther", "Other") },
  ];

  const handleSubmit = async () => {
    if (message.trim().length < 5) {
      toast.error(
        t("contact.errTooShort", "Please describe the issue (at least 5 characters)."),
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitOperatorMessageAction({
        category,
        message,
        email: email.trim() || undefined,
        pageUrl:
          typeof window !== "undefined"
            ? window.location.origin + pathname
            : pathname,
      });
      if (res.ok) {
        toast.success(
          t("contact.success", "Sent. Thank you for the feedback!"),
        );
        setMessage("");
        setEmail("");
        setCategory("bug");
        onClose();
      } else {
        toast.error(
          res.error === "too_short"
            ? t("contact.errTooShort", "Please describe the issue (at least 5 characters).")
            : t("contact.errFailed", "Failed to send. Please try again."),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className={`${closing ? "anim-scrim-out" : "anim-scrim"} fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[8vh] backdrop-blur-sm`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${closing ? "anim-modal-out" : "anim-modal"} relative mb-[6vh] w-full max-w-[520px] rounded-2xl border border-white/[0.08] bg-[#0a0a0a] px-6 py-7 text-white sm:px-8`}
        style={{ boxShadow: "0 30px 70px rgba(0,0,0,0.5)" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/55 transition hover:border-white/20 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#AFA9EC]">
          Genova
        </p>
        <h1 className="mt-2 text-[22px] font-black tracking-tight md:text-[26px]">
          {t("contact.title", "Contact the operator")}
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-white/55">
          {t(
            "contact.desc",
            "Found a bug, an error, or have a suggestion? Send it to the operator directly.",
          )}
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-white/55">
              {t("contact.categoryLabel", "Category")}
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={
                    category === c.value
                      ? "rounded-lg border border-[#7F77DD]/50 bg-[#7F77DD]/[0.12] px-3 py-1.5 text-[12px] font-bold text-[#AFA9EC] transition"
                      : "rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[12px] font-medium text-white/55 transition hover:border-white/20 hover:text-white/80"
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-white/55">
              {t("contact.messageLabel", "Message")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder={t(
                "contact.messagePlaceholder",
                "Describe what happened, what you expected, and the steps to reproduce it.",
              )}
              className="w-full resize-y break-keep rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3 text-[13px] leading-relaxed text-white placeholder:text-white/30 focus:border-[#7F77DD]/50 focus:outline-none"
            />
            <p className="mt-1 text-right text-[11px] tabular-nums text-white/30">
              {message.length}/4000
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-white/55">
              {t("contact.emailLabel", "Reply email (optional)")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("contact.emailPlaceholder", "you@example.com")}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:border-[#7F77DD]/50 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-bold disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submitting
              ? t("contact.sending", "Sending...")
              : t("contact.send", "Send to operator")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
