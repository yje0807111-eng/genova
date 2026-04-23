import { NextResponse } from "next/server";
import { suggestSearchAutocomplete } from "@/lib/queries/search-queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ videos: [], profiles: [], tags: [], genre: null });
  }
  const data = await suggestSearchAutocomplete(q);
  return NextResponse.json(data);
}
