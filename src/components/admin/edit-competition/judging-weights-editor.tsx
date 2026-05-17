"use client";

import { useI18n } from "@/components/genova/language-provider";
import type { EditCompetitionFormState, JudgingWeight } from "./types";

// 평가 배점 구조화 에디터 — 항목(라벨, 다국어)별 비율(%) 구성.
// 비워두면 상세 페이지는 기존 기본 4항목으로 fallback.
export function JudgingWeightsEditor({
  form,
  setForm,
  langTab,
}: {
  form: EditCompetitionFormState;
  setForm: (updater: (p: EditCompetitionFormState) => EditCompetitionFormState) => void;
  langTab: "ko" | "en" | "ja";
}) {
  const { t } = useI18n();
  const weights = form.judging_weights ?? [];
  const labelKey = `label_${langTab}` as "label_ko" | "label_en" | "label_ja";
  const total = weights.reduce((s, w) => s + (Number(w.percent) || 0), 0);

  const update = (next: JudgingWeight[]) =>
    setForm((p) => ({ ...p, judging_weights: next }));

  const addRow = () =>
    update([...weights, { label_ko: "", label_en: "", label_ja: "", percent: 0 }]);

  const removeRow = (i: number) => update(weights.filter((_, idx) => idx !== i));

  const patch = (i: number, p: Partial<JudgingWeight>) =>
    update(weights.map((w, idx) => (idx === i ? { ...w, ...p } : w)));

  return (
    <div>
      <label className="block text-[12px] font-semibold text-white/70">
        {t("adminJudging.weightsTitle", "평가 배점 (항목별 비율)")}
      </label>
      <p className="mb-2 mt-0.5 text-[10px] text-white/35">
        {t(
          "adminJudging.weightsHint",
          "평가 항목과 비율(%)을 설정하세요. 비워두면 기본 4항목(창의성/기술/스토리/임팩트)이 표시됩니다.",
        )}
      </p>

      <div className="space-y-1.5">
        {weights.map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={w[labelKey] ?? ""}
              onChange={(e) => patch(i, { [labelKey]: e.target.value } as Partial<JudgingWeight>)}
              placeholder={t("adminJudging.weightLabelPlaceholder", "항목 (예: 창의성)")}
              className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[13px] text-white outline-none placeholder:text-white/30"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                value={Number.isFinite(w.percent) ? w.percent : 0}
                onChange={(e) =>
                  patch(i, { percent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })
                }
                className="w-16 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[12px] tabular-nums text-white outline-none"
              />
              <span className="text-[12px] text-white/40">%</span>
            </div>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="shrink-0 rounded-md px-2 py-1 text-[11px] text-white/35 transition hover:text-red-300"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/55 transition hover:border-[#7F77DD]/40 hover:text-white"
        >
          + {t("adminJudging.addCriterion", "항목 추가")}
        </button>
        {weights.length > 0 ? (
          <span
            className={
              "text-[11px] font-bold tabular-nums " +
              (total === 100 ? "text-emerald-300" : "text-amber-300")
            }
          >
            {t("adminJudging.total", "합계")} {total}%
            {total !== 100 ? ` · ${t("adminJudging.totalWarn", "합이 100%가 아닙니다")}` : ""}
          </span>
        ) : null}
      </div>
    </div>
  );
}
