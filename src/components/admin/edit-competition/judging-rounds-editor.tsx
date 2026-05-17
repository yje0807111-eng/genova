"use client";

import { useI18n } from "@/components/genova/language-provider";
import {
  JUDGING_EVALUATOR_TYPES,
  type EditCompetitionFormState,
  type JudgingEvaluatorType,
  type JudgingRound,
} from "./types";

// 심사 진행 단계 구조화 에디터 — 차시(라운드)별 제목 + 심사 주체
// (운영진/심사위원/시청자 투표)별 비율(%)을 운영자가 직접 구성.
export function JudgingRoundsEditor({
  form,
  setForm,
  langTab,
}: {
  form: EditCompetitionFormState;
  setForm: (updater: (p: EditCompetitionFormState) => EditCompetitionFormState) => void;
  langTab: "ko" | "en" | "ja";
}) {
  const { t } = useI18n();
  const rounds = form.judging_rounds ?? [];
  const titleKey = `title_${langTab}` as "title_ko" | "title_en" | "title_ja";

  const evalLabel = (type: JudgingEvaluatorType) =>
    type === "staff"
      ? t("judging.eval.staff", "운영진")
      : type === "jury"
        ? t("judging.eval.jury", "심사위원")
        : t("judging.eval.audience", "시청자 투표");

  const update = (next: JudgingRound[]) =>
    setForm((p) => ({ ...p, judging_rounds: next }));

  const addRound = () =>
    update([
      ...rounds,
      { title_ko: "", title_en: "", title_ja: "", evaluators: [{ type: "staff", percent: 100 }] },
    ]);

  const removeRound = (ri: number) => update(rounds.filter((_, i) => i !== ri));

  const patchRound = (ri: number, patch: Partial<JudgingRound>) =>
    update(rounds.map((r, i) => (i === ri ? { ...r, ...patch } : r)));

  const addEvaluator = (ri: number) =>
    patchRound(ri, { evaluators: [...rounds[ri].evaluators, { type: "staff", percent: 0 }] });

  const removeEvaluator = (ri: number, ei: number) =>
    patchRound(ri, { evaluators: rounds[ri].evaluators.filter((_, i) => i !== ei) });

  const patchEvaluator = (
    ri: number,
    ei: number,
    patch: Partial<{ type: JudgingEvaluatorType; percent: number }>,
  ) =>
    patchRound(ri, {
      evaluators: rounds[ri].evaluators.map((ev, i) => (i === ei ? { ...ev, ...patch } : ev)),
    });

  return (
    <div>
      <label className="block text-[12px] font-semibold text-white/70">
        {t("adminJudging.title", "심사 진행 단계 (차시별 구성)")}
      </label>
      <p className="mb-2 mt-0.5 text-[10px] text-white/35">
        {t(
          "adminJudging.hint",
          "차시를 추가하고, 각 차시의 심사 주체와 비율(%)을 설정하세요. 비워두면 기존 기본 안내가 표시됩니다.",
        )}
      </p>

      <div className="space-y-3">
        {rounds.map((round, ri) => {
          const total = round.evaluators.reduce((s, e) => s + (Number(e.percent) || 0), 0);
          return (
            <div
              key={ri}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="shrink-0 rounded-md bg-[#534AB7]/20 px-2 py-1 text-[11px] font-bold text-[#AFA9EC]">
                  {t("adminJudging.round", "차시")} {ri + 1}
                </span>
                <input
                  type="text"
                  value={round[titleKey] ?? ""}
                  onChange={(e) => patchRound(ri, { [titleKey]: e.target.value } as Partial<JudgingRound>)}
                  placeholder={t("adminJudging.roundTitlePlaceholder", "차시 제목 (예: 1차 예선)")}
                  className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[13px] text-white outline-none placeholder:text-white/30"
                />
                <button
                  type="button"
                  onClick={() => removeRound(ri)}
                  className="shrink-0 rounded-md border border-white/10 px-2 py-1.5 text-[11px] text-white/45 transition hover:border-red-400/40 hover:text-red-300"
                >
                  {t("adminJudging.removeRound", "차시 삭제")}
                </button>
              </div>

              <div className="space-y-1.5">
                {round.evaluators.map((ev, ei) => (
                  <div key={ei} className="flex items-center gap-2">
                    <select
                      value={ev.type}
                      onChange={(e) =>
                        patchEvaluator(ri, ei, { type: e.target.value as JudgingEvaluatorType })
                      }
                      className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[12px] text-white outline-none [&>option]:bg-[#0a0a0a]"
                    >
                      {JUDGING_EVALUATOR_TYPES.map((tp) => (
                        <option key={tp} value={tp}>
                          {evalLabel(tp)}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={Number.isFinite(ev.percent) ? ev.percent : 0}
                        onChange={(e) =>
                          patchEvaluator(ri, ei, {
                            percent: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                          })
                        }
                        className="w-16 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[12px] tabular-nums text-white outline-none"
                      />
                      <span className="text-[12px] text-white/40">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEvaluator(ri, ei)}
                      className="ml-auto shrink-0 rounded-md px-2 py-1 text-[11px] text-white/35 transition hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => addEvaluator(ri)}
                  className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/55 transition hover:border-[#7F77DD]/40 hover:text-white"
                >
                  + {t("adminJudging.addEvaluator", "심사 주체 추가")}
                </button>
                <span
                  className={
                    "text-[11px] font-bold tabular-nums " +
                    (total === 100 ? "text-emerald-300" : "text-amber-300")
                  }
                >
                  {t("adminJudging.total", "합계")} {total}%
                  {total !== 100 ? ` · ${t("adminJudging.totalWarn", "합이 100%가 아닙니다")}` : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addRound}
        className="mt-3 w-full rounded-xl border border-dashed border-white/15 py-2 text-[12px] font-semibold text-white/55 transition hover:border-[#7F77DD]/50 hover:text-white"
      >
        + {t("adminJudging.addRound", "차시 추가")}
      </button>
    </div>
  );
}
