"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { deleteWorkflowAction } from "@/app/actions/workflows";
import type { WorkflowGuide } from "@/lib/queries/workflows-queries";

export function WorkflowDetailView({
  wf,
  isOwner,
}: {
  wf: WorkflowGuide;
  isOwner: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    setDeleting(true);
    const res = await deleteWorkflowAction(wf.id);
    setDeleting(false);
    if (!res.ok) return;
    router.push("/workflows");
    router.refresh();
  };

  const sectionTitle =
    "mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#AFA9EC]/70";

  return (
    <div className="mx-auto w-full max-w-[820px] px-5 py-8 sm:px-8">
      {wf.coverUrl ? (
        <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-2xl border border-white/[0.08]">
          <Image src={wf.coverUrl} alt="" fill sizes="820px" className="object-cover" />
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[24px] font-black leading-tight tracking-tight text-white sm:text-[30px]">
            {wf.title}
          </h1>
          <p className="mt-2 text-[13px] text-white/45">
            {wf.authorName ?? "Creator"}
            {wf.visibility === "private"
              ? ` · ${t("workflows.private", "비공개")}`
              : ""}
          </p>
        </div>
        {isOwner ? (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/workflows/${wf.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[12px] font-semibold text-white/70 transition hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("workflows.edit", "수정")}
            </Link>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[12px] font-semibold text-white/55 transition hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("workflows.delete", "삭제")}
            </button>
          </div>
        ) : null}
      </div>

      {wf.summary ? (
        <p className="mt-4 whitespace-pre-wrap text-[14px] leading-relaxed text-white/75">
          {wf.summary}
        </p>
      ) : null}

      <div className="mt-8 space-y-7">
        {wf.tools.length > 0 && (
          <section>
            <p className={sectionTitle}>{t("workflow.tools", "AI 툴")}</p>
            <div className="flex flex-wrap gap-1.5">
              {wf.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[12px] text-white/70"
                >
                  {tool}
                </span>
              ))}
            </div>
          </section>
        )}
        {wf.steps.length > 0 && (
          <section>
            <p className={sectionTitle}>{t("workflow.steps", "제작 단계")}</p>
            <ol className="space-y-2">
              {wf.steps.map((step, i) => (
                <li
                  key={`${i}-${step.slice(0, 12)}`}
                  className="flex gap-2.5 text-[14px] leading-relaxed text-white/80"
                >
                  <span className="shrink-0 font-bold tabular-nums text-[#AFA9EC]/70">
                    {i + 1}.
                  </span>
                  <span className="min-w-0">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
        {wf.prompts.trim() && (
          <section>
            <p className={sectionTitle}>{t("workflow.prompts", "핵심 프롬프트")}</p>
            <p className="whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[13px] leading-relaxed text-white/75">
              {wf.prompts}
            </p>
          </section>
        )}
        {wf.models.trim() && (
          <section>
            <p className={sectionTitle}>{t("workflow.models", "모델 / 세팅")}</p>
            <p className="text-[14px] text-white/75">{wf.models}</p>
          </section>
        )}
        {wf.links.length > 0 && (
          <section>
            <p className={sectionTitle}>{t("workflow.links", "레퍼런스")}</p>
            <div className="space-y-1">
              {wf.links.map((href) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-[13px] text-[#AFA9EC] underline-offset-2 hover:underline"
                >
                  {href}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>

      {confirmDelete ? (
        <div
          className="anim-scrim fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="w-full max-w-[340px] rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[15px] font-bold text-white">
              {t("workflows.deleteTitle", "워크플로우 삭제")}
            </h2>
            <p className="mt-2 text-[13px] text-white/45">
              {t("workflows.deleteConfirm", "이 워크플로우를 삭제할까요?")}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 text-[13px] font-semibold text-white/55 transition hover:text-white"
              >
                {t("workflows.cancel", "취소")}
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="flex-1 rounded-xl py-2.5 text-[13px] font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                }}
              >
                {t("workflows.delete", "삭제")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
