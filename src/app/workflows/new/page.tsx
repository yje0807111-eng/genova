import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WorkflowForm } from "@/components/workflows/workflow-form";

export const metadata: Metadata = {
  title: "New workflow",
  robots: { index: false, follow: false },
};

export default async function NewWorkflowPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-[820px] px-5 py-8 sm:px-8">
        <h1 className="mb-6 text-[22px] font-black tracking-tight text-white">
          새 워크플로우
        </h1>
        <WorkflowForm />
      </div>
    </div>
  );
}
