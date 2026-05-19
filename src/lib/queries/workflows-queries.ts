import { createServerSupabaseClient } from "@/lib/supabase/server";

/** 독립 워크플로우 가이드 (영상에 종속되지 않는 콘텐츠 타입, Phase 3). */
export type WorkflowGuide = {
  id: string;
  authorId: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  title: string;
  summary: string;
  coverUrl: string | null;
  tools: string[];
  steps: string[];
  prompts: string;
  models: string;
  links: string[];
  visibility: "public" | "private";
  viewCount: number;
  createdAt: string;
};

type Row = {
  id: string;
  author_id: string;
  title: string | null;
  summary: string | null;
  cover_url: string | null;
  tools: string[] | null;
  steps: string[] | null;
  prompts: string | null;
  models: string | null;
  links: string[] | null;
  visibility: string | null;
  view_count: number | null;
  created_at: string;
};

function mapRow(
  r: Row,
  prof?: { display_name: string | null; avatar_url: string | null } | null,
): WorkflowGuide {
  return {
    id: r.id,
    authorId: r.author_id,
    authorName: prof?.display_name ?? null,
    authorAvatarUrl: prof?.avatar_url ?? null,
    title: r.title ?? "",
    summary: r.summary ?? "",
    coverUrl: r.cover_url?.trim() ? r.cover_url : null,
    tools: Array.isArray(r.tools) ? r.tools : [],
    steps: Array.isArray(r.steps) ? r.steps : [],
    prompts: r.prompts ?? "",
    models: r.models ?? "",
    links: Array.isArray(r.links) ? r.links : [],
    visibility: r.visibility === "private" ? "private" : "public",
    viewCount: typeof r.view_count === "number" ? r.view_count : 0,
    createdAt: r.created_at,
  };
}

async function attachAuthors(
  rows: Row[],
): Promise<WorkflowGuide[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase || rows.length === 0) return rows.map((r) => mapRow(r));
  const ids = [...new Set(rows.map((r) => r.author_id).filter(Boolean))];
  const { data: profiles } = await supabase
    .from("public_profiles")
    .select("id, display_name, avatar_url")
    .in("id", ids);
  const map = new Map(
    (profiles ?? []).map((p) => {
      const row = p as { id: string; display_name: string | null; avatar_url: string | null };
      return [row.id, { display_name: row.display_name, avatar_url: row.avatar_url }];
    }),
  );
  return rows.map((r) => mapRow(r, map.get(r.author_id) ?? null));
}

export async function fetchPublicWorkflows(limit = 40): Promise<WorkflowGuide[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return attachAuthors(data as Row[]);
}

export async function fetchWorkflowById(
  id: string,
): Promise<WorkflowGuide | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const [mapped] = await attachAuthors([data as Row]);
  return mapped ?? null;
}

export async function fetchMyWorkflows(): Promise<WorkflowGuide[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return attachAuthors(data as Row[]);
}
