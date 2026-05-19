"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type WorkflowActionResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export type WorkflowInput = {
  title: string;
  summary: string;
  coverUrl: string | null;
  tools: string[];
  steps: string[];
  prompts: string;
  models: string;
  links: string[];
  visibility: "public" | "private";
};

function toPayload(form: WorkflowInput) {
  return {
    title: form.title.trim().slice(0, 160),
    summary: form.summary.trim().slice(0, 2000),
    cover_url: form.coverUrl?.trim() ? form.coverUrl.trim() : null,
    tools: form.tools.map((s) => s.trim()).filter(Boolean).slice(0, 30),
    steps: form.steps.map((s) => s.trim()).filter(Boolean).slice(0, 50),
    prompts: form.prompts.trim().slice(0, 4000),
    models: form.models.trim().slice(0, 500),
    links: form.links.map((s) => s.trim()).filter(Boolean).slice(0, 20),
    visibility: form.visibility === "private" ? "private" : "public",
  };
}

export async function createWorkflowAction(
  form: WorkflowInput,
): Promise<WorkflowActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };
  if (!form.title.trim())
    return { ok: false, message: "제목을 입력해주세요." };

  const { data, error } = await supabase
    .from("workflows")
    .insert({ author_id: user.id, ...toPayload(form) })
    .select("id")
    .single();
  if (error || !data) return { ok: false, message: error?.message ?? "저장 실패" };

  revalidatePath("/workflows");
  return { ok: true, id: data.id as string };
}

export async function updateWorkflowAction(
  id: string,
  form: WorkflowInput,
): Promise<WorkflowActionResult> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const { error } = await supabase
    .from("workflows")
    .update({ ...toPayload(form), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("author_id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/workflows");
  revalidatePath(`/workflows/${id}`);
  return { ok: true, id };
}

export async function deleteWorkflowAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { ok: false, message: "Configuration error." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const { error } = await supabase
    .from("workflows")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/workflows");
  return { ok: true };
}
