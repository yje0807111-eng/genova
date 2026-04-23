import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TrophyRow = {
  id: string;
  type: "weekly_genre" | "competition";
  rank: number | null;
  genre: string | null;
  competitionId: string | null;
  competitionTitle?: string | null;
  award: string | null;
  weekStart: string | null;
  createdAt: string;
};

function mapTrophy(r: Record<string, unknown>): TrophyRow {
  return {
    id: r.id as string,
    type: r.type as TrophyRow["type"],
    rank: (r.rank as number | null) ?? null,
    genre: (r.genre as string | null) ?? null,
    competitionId: (r.competition_id as string | null) ?? null,
    award: (r.award as string | null) ?? null,
    weekStart: r.week_start ? String(r.week_start) : null,
    createdAt: r.created_at as string,
  };
}

export async function fetchTrophiesForUser(userId: string): Promise<TrophyRow[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("trophies")
    .select("id, type, rank, genre, competition_id, award, week_start, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const base = data.map((row) => mapTrophy(row as Record<string, unknown>));
  const compIds = [...new Set(base.map((t) => t.competitionId).filter(Boolean))] as string[];
  if (compIds.length === 0) return base;

  const { data: comps } = await supabase.from("competitions").select("id, title").in("id", compIds);
  const titleById = new Map<string, string>();
  for (const c of comps ?? []) {
    titleById.set(c.id as string, c.title as string);
  }
  return base.map((t) =>
    t.competitionId ? { ...t, competitionTitle: titleById.get(t.competitionId) ?? null } : t,
  );
}
