import { notFound } from "next/navigation";
import { fetchWorkflowById } from "@/lib/queries/workflows-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WorkflowDetailView } from "@/components/workflows/workflow-detail-view";

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const wf = await fetchWorkflowById(id);
  if (!wf) notFound();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  const isOwner = Boolean(user && user.id === wf.authorId);

  // 비공개 워크플로우는 작성자만 열람.
  if (wf.visibility === "private" && !isOwner) notFound();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <WorkflowDetailView wf={wf} isOwner={isOwner} />
    </div>
  );
}
