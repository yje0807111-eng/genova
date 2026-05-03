import { NextRequest, NextResponse } from "next/server";
import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function GET(req: NextRequest) {
  const uploadId = req.nextUrl.searchParams.get("uploadId");
  if (!uploadId) return NextResponse.json({ error: "Missing uploadId" }, { status: 400 });

  try {
    const upload = await mux.video.uploads.retrieve(uploadId);
    const assetId = upload.asset_id;
    if (!assetId) return NextResponse.json({ status: "waiting" });

    const asset = await mux.video.assets.retrieve(assetId);
    const playbackId = asset.playback_ids?.[0]?.id;

    return NextResponse.json({
      status: asset.status,
      assetId,
      playbackId: playbackId ?? null,
      duration: asset.duration ?? null,
    });
  } catch (error) {
    console.error("Mux asset error:", error);
    return NextResponse.json({ error: "Failed to retrieve asset" }, { status: 500 });
  }
}
