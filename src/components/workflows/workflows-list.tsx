"use client";

import Link from "next/link";
import { Plus, Workflow } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { WorkflowCard } from "@/components/workflows/workflow-card";
import type { WorkflowGuide } from "@/lib/queries/workflows-queries";

export function WorkflowsList({
  workflows,
  canCreate,
}: {
  workflows: WorkflowGuide[];
  canCreate: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-8 sm:px-8">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#AFA9EC]/70">
            <Workflow className="h-3.5 w-3.5" />
            {t("workflows.eyebrow", "MAKING-OF")}
          </p>
          <h1 className="text-[24px] font-black tracking-tight text-white sm:text-[28px]">
            {t("workflows.pageTitle", "워크플로우")}
          </h1>
          <p className="mt-1 text-[13px] text-white/45">
            {t(
              "workflows.pageDesc",
              "AI 필름메이커들이 어떻게 만들었는지 공유하는 제작 가이드.",
            )}
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/workflows/new"
            className="btn-primary inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            {t("workflows.new", "새 워크플로우")}
          </Link>
        ) : null}
      </div>

      {workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] py-20 text-center">
          <Workflow className="mb-3 h-8 w-8 text-[#7F77DD]/45" />
          <p className="text-[15px] font-bold text-white/55">
            {t("workflows.empty", "아직 등록된 워크플로우가 없어요.")}
          </p>
          <p className="mt-1 text-[13px] text-white/30">
            {t("workflows.emptyHint", "첫 제작 가이드를 공유해보세요.")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {workflows.map((wf) => (
            <WorkflowCard key={wf.id} wf={wf} />
          ))}
        </div>
      )}
    </div>
  );
}
