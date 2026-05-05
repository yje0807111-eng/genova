import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ tags: [] });

  const { data } = await supabase
    .from("hashtag_stats")
    .select("tag, search_count, click_count")
    .order("search_count", { ascending: false })
    .order("click_count", { ascending: false })
    .limit(10);

  const tags = (data ?? [])
    .map((row) => ({
      tag: String((row as { tag: string }).tag),
      score: Number((row as { search_count: number }).search_count ?? 0) + Number((row as { click_count: number }).click_count ?? 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return NextResponse.json({ tags });
}
