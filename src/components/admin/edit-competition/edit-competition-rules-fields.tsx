"use client";

import { adminTokens } from "@/lib/admin-styles";
import type { EditCompetitionFormState } from "./types";

const inp =
  "w-full rounded-xl border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/20 focus:border-[#7F77DD]/60";

export function EditCompetitionRulesFields({
  form,
  setForm,
  langTab,
}: {
  form: EditCompetitionFormState;
  setForm: (updater: (p: EditCompetitionFormState) => EditCompetitionFormState) => void;
  langTab: "ko" | "en" | "ja";
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "var(--border-white-02)" }}>
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#AFA9EC]">규칙 및 심사</h2>
      <div className="space-y-2">
        <div>
          <label className={adminTokens.inputLabel}>
            주제 {langTab === "ko" ? "(한국어)" : langTab === "en" ? "(영어)" : "(일본어)"}
          </label>
          <p className="mb-1.5 text-[10px] text-white/25">각 주제를 줄바꿈(Enter)으로 구분하면 번호가 자동으로 붙습니다.</p>
          <textarea
            value={form[`rules_${langTab}` as "rules_ko" | "rules_en" | "rules_ja"]}
            onChange={(e) =>
              setForm((p) => ({ ...p, [`rules_${langTab}`]: e.target.value } as typeof p))
            }
            rows={6}
            className={inp + " resize-none"}
            placeholder={
              langTab === "ko"
                ? "예:\nAI가 인간을 대신할 수 없는 순간을 담아주세요.\n장르와 형식에 제한이 없습니다.\n90초 이내로 완성해주세요."
                : langTab === "en"
                  ? "e.g.:\nCapture a moment AI cannot replace.\nNo genre or format restrictions.\nComplete within 90 seconds."
                  : "例:\nAIが人間に代われない瞬間を表現してください。\nジャンルや形式に制限はありません。\n90秒以内に仕上げてください。"
            }
          />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>참가 자격 {langTab === "ko" ? "(한국어)" : langTab === "en" ? "(영어)" : "(일본어)"}</label>
          <textarea
            value={form[`eligibility_${langTab}` as "eligibility_ko" | "eligibility_en" | "eligibility_ja"]}
            onChange={(e) =>
              setForm((p) => ({ ...p, [`eligibility_${langTab}`]: e.target.value } as typeof p))
            }
            rows={2}
            className={inp + " resize-none"}
            placeholder={
              langTab === "ko"
                ? "예: 전 세계 AI 크리에이터 누구나"
                : langTab === "en"
                  ? "e.g. Open to all AI creators worldwide"
                  : "例: 世界中のAIクリエイター"
            }
          />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>출품 가이드라인 {langTab === "ko" ? "(한국어)" : langTab === "en" ? "(영어)" : "(일본어)"}</label>
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
            placeholder={
              langTab === "ko"
                ? "예: 90초 이내 AI 생성 영상"
                : langTab === "en"
                  ? "e.g. AI-generated video under 90 seconds"
                  : "例: 90秒以内のAI生成動画"
            }
          />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>심사 방법 {langTab === "ko" ? "(한국어)" : langTab === "en" ? "(영어)" : "(일본어)"}</label>
          <textarea
            value={
              form[`judging_criteria_${langTab}` as "judging_criteria_ko" | "judging_criteria_en" | "judging_criteria_ja"]
            }
            onChange={(e) =>
              setForm((p) => ({ ...p, [`judging_criteria_${langTab}`]: e.target.value } as typeof p))
            }
            rows={2}
            className={inp + " resize-none"}
            placeholder={
              langTab === "ko"
                ? "예: 심사위원 50% + 시청자 투표 50%"
                : langTab === "en"
                  ? "e.g. Judges 50% + Audience vote 50%"
                  : "例: 審査員50% + 視聴者投票50%"
            }
          />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>규칙 {langTab === "ko" ? "(한국어)" : langTab === "en" ? "(영어)" : "(일본어)"}</label>
          <textarea
            value={form[`rules_${langTab}` as "rules_ko" | "rules_en" | "rules_ja"]}
            onChange={(e) =>
              setForm((p) => ({ ...p, [`rules_${langTab}`]: e.target.value } as typeof p))
            }
            rows={3}
            className={inp + " resize-none"}
            placeholder={
              langTab === "ko"
                ? "예: AI로 제작한 영상만 출품 가능"
                : langTab === "en"
                  ? "e.g. Only AI-generated videos allowed"
                  : "例: AI生成動画のみ出品可能"
            }
          />
        </div>
      </div>
    </div>
  );
}
