import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * 업로드 폼 시리즈 드롭다운용 — 현재 로그인 사용자가 이미 올린
 * 시리즈 목록 + 각 시리즈의 마지막(최대) 에피소드 번호.
 *
 * 새 에피소드 업로드 시 시리즈를 선택하면 에피소드 번호를
 * lastEpisode + 1 로 자동 채우기 위한 데이터.  RLS 는 본인
 * 행으로 클립되며, 비로그인/미설정 시 { series: [] }.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ series: [] });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ series: [] });

  const { data, error } = await supabase
    .from("videos")
    .select("series_name, episode_number")
    .eq("uploaded_by", user.id)
    .not("series_name", "is", null);

  if (error || !data) return NextResponse.json({ series: [] });

  // series_name 별 최대 episode_number 집계.
  const map = new Map<string, number>();
  for (const row of data) {
    const name = (row.series_name as string | null)?.trim();
    if (!name) continue;
    const ep = Number(row.episode_number) || 0;
    map.set(name, Math.max(map.get(name) ?? 0, ep));
  }

  const series = Array.from(map.entries())
    .map(([name, lastEpisode]) => ({ name, lastEpisode }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ series });
}
