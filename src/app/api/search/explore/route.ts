import { NextResponse } from "next/server";
import { fetchTrendingProfilesByFollowers, fetchTrendingVideosByLikes } from "@/lib/queries/search-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const [videos, profiles] = await Promise.all([fetchTrendingVideosByLikes(4), fetchTrendingProfilesByFollowers(4)]);
  return NextResponse.json({ videos, profiles });
}
