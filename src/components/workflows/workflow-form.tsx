"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/genova/language-provider";
import {
  createWorkflowAction,
  updateWorkflowAction,
  type WorkflowInput,
} from "@/app/actions/workflows";
import type { WorkflowGuide } from "@/lib/queries/workflows-queries";

const splitLines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
const splitCommas = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export function WorkflowForm({ initial }: { initial?: WorkflowGuide }) {
  const router = useRouter();
  const { t } = useI18n();
  const editing = Boolean(initial);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [tools, setTools] = useState((initial?.tools ?? []).join(", "));
  const [steps, setSteps] = useState((initial?.steps ?? []).join("\n"));
  const [prompts, setPrompts] = useState(initial?.prompts ?? "");
  const [models, setModels] = useState(initial?.models ?? "");
  const [links, setLinks] = useState((initial?.links ?? []).join("\n"));
  const [visibility, setVisibility] = useState<"public" | "private">(
    initial?.visibility ?? "public",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t("workflows.errTitle", "제목을 입력해주세요."));
      return;
    }
    setSaving(true);
    setError(null);
    const payload: WorkflowInput = {
      title,
      summary,
      coverUrl: coverUrl.trim() ? coverUrl.trim() : null,
      tools: splitCommas(tools),
      steps: splitLines(steps),
      prompts,
      models,
      links: splitLines(links),
      visibility,
    };
    const res = initial
      ? await updateWorkflowAction(initial.id, payload)
      : await createWorkflowAction(payload);
    setSaving(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.push(`/workflows/${res.id}`);
    router.refresh();
  };

  const inputCls =
    "w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[14px] text-white placeholder:text-white/30 outline-none transition focus:border-[#7F77DD]/40 focus:bg-white/[0.04]";
  const labelCls =
    "mb-2 block text-[12px] font-bold uppercase tracking-[0.18em] text-white/70";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className={labelCls}>{t("workflows.title", "제목")}</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
          placeholder={t(
            "workflows.titlePlaceholder",
            "예: 시네마틱 AI 단편 제작 파이프라인",
          )}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>{t("workflows.summary", "소개")}</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={t("workflows.summaryPlaceholder", "이 워크플로우가 무엇인지 (선택)")}
          className={`${inputCls} resize-none`}
        />
      </div>
      <div>
        <label className={labelCls}>{t("workflows.cover", "커버 이미지 URL")}</label>
        <input
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="https:// … (선택)"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>{t("workflows.tools", "AI 툴")}</label>
        <input
          value={tools}
          onChange={(e) => setTools(e.target.value)}
          placeholder={t("workflows.toolsPlaceholder", "쉼표로 구분 (예: Midjourney, Runway, Topaz)")}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>{t("workflows.steps", "제작 단계")}</label>
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          rows={6}
          placeholder={t(
            "workflows.stepsPlaceholder",
            "한 줄에 한 단계씩",
          )}
          className={`${inputCls} resize-none`}
        />
      </div>
      <div>
        <label className={labelCls}>{t("workflows.prompts", "핵심 프롬프트")}</label>
        <textarea
          value={prompts}
          onChange={(e) => setPrompts(e.target.value)}
          rows={4}
          maxLength={4000}
          placeholder={t("workflows.promptsPlaceholder", "주요 프롬프트나 노하우 (선택)")}
          className={`${inputCls} resize-none`}
        />
      </div>
      <div>
        <label className={labelCls}>{t("workflows.models", "모델 / 세팅")}</label>
        <input
          value={models}
          onChange={(e) => setModels(e.target.value)}
          placeholder={t("workflows.modelsPlaceholder", "예: Kling 1.6, Flux dev, seed 고정")}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>{t("workflows.links", "레퍼런스 링크")}</label>
        <textarea
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          rows={2}
          placeholder={t("workflows.linksPlaceholder", "한 줄에 하나씩 (선택)")}
          className={`${inputCls} resize-none`}
        />
      </div>
      <div className="flex items-center gap-2">
        {(["public", "private"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVisibility(v)}
            className={
              "rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors " +
              (visibility === v
                ? "bg-white text-[#0a0a0a]"
                : "border border-white/[0.10] bg-white/[0.03] text-white/55")
            }
          >
            {v === "public"
              ? t("workflows.public", "공개")
              : t("workflows.private", "비공개")}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-[13px] text-red-400">{error}</p>
      ) : null}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary rounded-xl px-5 py-2.5 text-[14px] font-bold text-white disabled:opacity-50"
        >
          {saving
            ? t("workflows.saving", "저장 중...")
            : editing
              ? t("workflows.update", "수정")
              : t("workflows.publish", "발행")}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-[14px] font-semibold text-white/60 transition hover:text-white"
        >
          {t("workflows.cancel", "취소")}
        </button>
      </div>
    </form>
  );
}
