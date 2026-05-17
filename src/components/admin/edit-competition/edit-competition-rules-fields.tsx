"use client";

import { adminTokens } from "@/lib/admin-styles";
import { useI18n } from "@/components/genova/language-provider";
import type { EditCompetitionFormState } from "./types";
import { JudgingRoundsEditor } from "./judging-rounds-editor";

const inp =
  "w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3.5 py-2.5 text-[13px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#7F77DD]/45";

export function EditCompetitionRulesFields({
  form,
  setForm,
  langTab,
}: {
  form: EditCompetitionFormState;
  setForm: (updater: (p: EditCompetitionFormState) => EditCompetitionFormState) => void;
  langTab: "ko" | "en" | "ja";
}) {
  const { t } = useI18n();
  const suffix =
    langTab === "ko"
      ? t("adminCompEdit.langSuffixKo", "(Korean)")
      : langTab === "en"
        ? t("adminCompEdit.langSuffixEn", "(English)")
        : t("adminCompEdit.langSuffixJa", "(Japanese)");
  return (
    <div className="space-y-3">
      <div>
        <label className={adminTokens.inputLabel}>{t("adminCompEditRules.topicLabel", "Topic")} {suffix}</label>
        <p className="mb-1.5 text-[10px] text-white/25">{t("adminCompEditRules.topicHint", "Separate each topic with a line break (Enter) and numbers will be added automatically.")}</p>
        <textarea
          value={form[`rules_${langTab}` as "rules_ko" | "rules_en" | "rules_ja"]}
          onChange={(e) =>
            setForm((p) => ({ ...p, [`rules_${langTab}`]: e.target.value } as typeof p))
          }
          rows={6}
          className={inp + " resize-none"}
          placeholder={t(
            "adminCompEditRules.topicPlaceholder",
            "e.g.:\nCapture a moment AI cannot replace.\nNo genre or format restrictions.\nComplete within 90 seconds.",
          )}
        />
      </div>
      <div>
        <label className={adminTokens.inputLabel}>{t("adminCompEditRules.eligibilityLabel", "Eligibility")} {suffix}</label>
        <textarea
          value={form[`eligibility_${langTab}` as "eligibility_ko" | "eligibility_en" | "eligibility_ja"]}
          onChange={(e) =>
            setForm((p) => ({ ...p, [`eligibility_${langTab}`]: e.target.value } as typeof p))
          }
          rows={2}
          className={inp + " resize-none"}
          placeholder={t(
            "adminCompEditRules.eligibilityPlaceholder",
            "e.g. Open to all AI creators worldwide",
          )}
        />
      </div>
      <div>
        <label className={adminTokens.inputLabel}>{t("adminCompEditRules.submissionGuidelinesLabel", "Submission Guidelines")} {suffix}</label>
        <textarea
          value={
            form[
              `submission_guidelines_${langTab}` as
                | "submission_guidelines_ko"
                | "submission_guidelines_en"
                | "submission_guidelines_ja"
            ]
          }
          onChange={(e) =>
            setForm((p) => ({ ...p, [`submission_guidelines_${langTab}`]: e.target.value } as typeof p))
          }
          rows={2}
          className={inp + " resize-none"}
          placeholder={t(
            "adminCompEditRules.submissionGuidelinesPlaceholder",
            "e.g. AI-generated video under 90 seconds",
          )}
        />
      </div>
      <div>
        <label className={adminTokens.inputLabel}>{t("adminCompEditRules.judgingCriteriaLabel", "Judging Method")} {suffix}</label>
        <textarea
          value={
            form[`judging_criteria_${langTab}` as "judging_criteria_ko" | "judging_criteria_en" | "judging_criteria_ja"]
          }
          onChange={(e) =>
            setForm((p) => ({ ...p, [`judging_criteria_${langTab}`]: e.target.value } as typeof p))
          }
          rows={2}
          className={inp + " resize-none"}
          placeholder={t(
            "adminCompEditRules.judgingCriteriaPlaceholder",
            "e.g. Judges 50% + Audience vote 50%",
          )}
        />
      </div>
      <div>
        <label className={adminTokens.inputLabel}>{t("adminCompEditRules.judgingProcessLabel", "Judging Process (Steps)")} {suffix}</label>
        <p className="mb-1.5 text-[10px] text-white/25">{t("adminCompEditRules.judgingProcessHint", "One step per line. Use \"Title — description\" to split title and detail; a line without \"—\" becomes the step title.")}</p>
        <textarea
          value={
            form[`judging_process_${langTab}` as "judging_process_ko" | "judging_process_en" | "judging_process_ja"]
          }
          onChange={(e) =>
            setForm((p) => ({ ...p, [`judging_process_${langTab}`]: e.target.value } as typeof p))
          }
          rows={5}
          className={inp + " resize-none"}
          placeholder={t(
            "adminCompEditRules.judgingProcessPlaceholder",
            "e.g.:\nRound 1 — Staff pre-screening for rule compliance.\nRound 2 — Jury evaluation (100%).\nFinal — Results announced after the voting deadline.",
          )}
        />
      </div>
      <div>
        <JudgingRoundsEditor form={form} setForm={setForm} langTab={langTab} />
      </div>
      <div>
        <label className={adminTokens.inputLabel}>{t("adminCompEditRules.rulesLabel", "Rules")} {suffix}</label>
        <textarea
          value={form[`rules_${langTab}` as "rules_ko" | "rules_en" | "rules_ja"]}
          onChange={(e) =>
            setForm((p) => ({ ...p, [`rules_${langTab}`]: e.target.value } as typeof p))
          }
          rows={3}
          className={inp + " resize-none"}
          placeholder={t(
            "adminCompEditRules.rulesPlaceholder",
            "e.g. Only AI-generated videos allowed",
          )}
        />
      </div>
    </div>
  );
}
