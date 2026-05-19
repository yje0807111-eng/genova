import type { Metadata } from "next";
import { fetchPublicWorkflows } from "@/lib/queries/workflows-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WorkflowsList } from "@/components/workflows/workflows-list";

export const metadata: Metadata = {
  title: "Workflows",
};

export default async function WorkflowsPage() {
  const supabase = await createServerSupabaseClient();
  const [workflows, userRes] = await Promise.all([
    fetchPublicWorkflows(),
    supabase?.auth.getUser() ?? Promise.resolve({ data: { user: null } }),
  ]);
  const canCreate = Boolean(userRes?.data?.user);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <WorkflowsList workflows={workflows} canCreate={canCreate} />
    </div>
  );
}
