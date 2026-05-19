import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { fetchWorkflowById } from "@/lib/queries/workflows-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WorkflowForm } from "@/components/workflows/workflow-form";

export const metadata: Metadata = {
  title: "Edit workflow",
  robots: { index: false, follow: false },
};

export default async function EditWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const wf = await fetchWorkflowById(id);
  if (!wf) notFound();
  if (wf.authorId !== user.id) notFound();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-[820px] px-5 py-8 sm:px-8">
        <h1 className="mb-6 text-[22px] font-black tracking-tight text-white">
          워크플로우 수정
        </h1>
        <WorkflowForm initial={wf} />
      </div>
    </div>
  );
}
