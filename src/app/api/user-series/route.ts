import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json([]);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([]);

  const { data } = await supabase
    .from("videos")
    .select("series_name, episode_number")
    .eq("uploaded_by", user.id)
    .not("series_name", "is", null)
    .order("created_at", { ascending: false });

  if (!data) return NextResponse.json([]);

  // 시리즈별로 그룹핑해서 고유 시리즈 이름 + 최대 에피소드 번호 반환
  const seriesMap = new Map<string, number>();
  for (const row of data) {
    if (!row.series_name) continue;
    const current = seriesMap.get(row.series_name) ?? 0;
    seriesMap.set(row.series_name, Math.max(current, row.episode_number ?? 0));
  }

  const result = Array.from(seriesMap.entries()).map(([name, maxEp]) => ({
    name,
    nextEpisode: maxEp + 1,
  }));

  return NextResponse.json(result);
}
