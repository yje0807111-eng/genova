import { NextRequest, NextResponse } from "next/server";
import { fetchVideosWithCreators } from "@/lib/queries";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") ?? "0", 10);
  const offset = page * PAGE_SIZE;

  try {
    const videos = await fetchVideosWithCreators({ limit: PAGE_SIZE, offset });
    const withEngagement = await attachEngagementToVideos(videos);

    return NextResponse.json({
      videos: withEngagement,
      page,
      hasMore: videos.length === PAGE_SIZE,
    });
  } catch (error) {
    console.error("[/api/videos] error:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}
