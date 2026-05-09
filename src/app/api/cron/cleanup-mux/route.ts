import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function GET(req: Request) {
  // Vercel Cron 인증
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "DB connection failed" }, { status: 500 });
  }

  const { data: videos, error } = await supabase
    .from("videos")
    .select("mux_asset_id")
    .not("mux_asset_id", "is", null);

  if (error) {
    console.error("[cleanup-mux] supabase", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dbAssetIds = new Set(
    (videos ?? [])
      .map((v) => v.mux_asset_id as string | null)
      .filter((id): id is string => Boolean(id)),
  );

  let deleted = 0;
  let checked = 0;
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  try {
    for await (const asset of mux.video.assets.list({ limit: 100 })) {
      checked++;
      const createdAt = new Date(asset.created_at).getTime();
      if (createdAt > oneHourAgo) continue;
      if (dbAssetIds.has(asset.id)) continue;
      try {
        await mux.video.assets.delete(asset.id);
        deleted++;
      } catch (e) {
        console.error("[cleanup] delete failed", asset.id, e);
      }
    }
  } catch (e) {
    console.error("[cleanup-mux] mux list failed", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  return NextResponse.json({ checked, deleted });
}
