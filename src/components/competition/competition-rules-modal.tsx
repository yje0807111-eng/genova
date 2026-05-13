"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CompetitionRulesModal({ open, onClose }: Props) {
  const { t } = useI18n();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto p-4 pt-[5vh]"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-8 mb-[5vh]"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/35 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6">
          <div
            className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em]"
            style={{
              background: "linear-gradient(135deg, rgba(127,119,221,0.12) 0%, rgba(83,74,183,0.06) 100%)",
              border: "1px solid rgba(127,119,221,0.2)",
              color: "#AFA9EC",
            }}
          >
            <span>✦</span> Genova
          </div>
          <h2
            className="text-2xl font-black text-white bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(125deg, #ffffff 0%, #e8e4ff 50%, #AFA9EC 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t("competition.rulesModalTitle")}
          </h2>
          <p className="mt-1 text-[13px] text-white/35">{t("competition.rulesModalSubtitle")}</p>
        </div>

        <div className="space-y-4">
          {[
            { num: "01", title: t("competition.rules.r1.title"), desc: t("competition.rules.r1.desc") },
            { num: "02", title: t("competition.rules.r2.title"), desc: t("competition.rules.r2.desc") },
            { num: "03", title: t("competition.rules.r3.title"), desc: t("competition.rules.r3.desc") },
            { num: "04", title: t("competition.rules.r4.title"), desc: t("competition.rules.r4.desc") },
            { num: "05", title: t("competition.rules.r5.title"), desc: t("competition.rules.r5.desc") },
            { num: "06", title: t("competition.rules.r6.title"), desc: t("competition.rules.r6.desc") },
            { num: "07", title: t("competition.rules.r7.title"), desc: t("competition.rules.r7.desc") },
            { num: "08", title: t("competition.rules.r8.title"), desc: t("competition.rules.r8.desc") },
          ].map((rule) => (
            <div
              key={rule.num}
              className="flex gap-4 rounded-xl p-4"
              style={{ background: "rgba(127,119,221,0.04)", border: "1px solid rgba(127,119,221,0.12)" }}
            >
              <span
                className="shrink-0 text-[11px] font-black"
                style={{ color: "rgba(127,119,221,0.6)", fontVariantNumeric: "tabular-nums" }}
              >
                {rule.num}
              </span>
              <div>
                <p className="mb-1 text-[13px] font-bold text-white">{rule.title}</p>
                <p className="text-[12px] leading-relaxed text-white/50">{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-6 py-2.5 text-[13px] font-bold text-white transition hover:scale-[1.02]"
            style={{ background: "#534AB7", border: "1px solid transparent" }}
          >
            {t("common.confirm")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
