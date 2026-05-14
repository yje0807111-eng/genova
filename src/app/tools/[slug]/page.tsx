import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchVideosWithCreators } from "@/lib/queries";
import { ToolDetailClient } from "@/components/tools/tool-detail-client";
import { TOOL_CATEGORY } from "@/lib/constants/tool-category";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const toolName = decodeURIComponent(slug);
  const category = TOOL_CATEGORY[toolName];
  const title = `Films made with ${toolName}`;
  const description = category
    ? `Discover AI-generated films created with ${toolName} (${category}) — curated on Genova.`
    : `Discover AI-generated films created with ${toolName} — curated on Genova.`;
  return {
    title,
    description,
    openGraph: { title: `${title} | Genova`, description },
    twitter: { card: "summary_large_image", title: `${title} | Genova`, description },
  };
}

export default async function ToolDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const decodedToolName = decodeURIComponent(slug);

  const videos = await fetchVideosWithCreators();
  const filteredVideos = videos.filter((v) =>
    v.aiTools?.some((tool) => tool === decodedToolName),
  );

  if (filteredVideos.length === 0) {
    notFound();
  }

  const category = TOOL_CATEGORY[decodedToolName];

  const totalViews = filteredVideos.reduce((sum, v) => sum + (v.viewCount ?? 0), 0);
  const uniqueCreatorIds = new Set(
    filteredVideos.map((v) => v.uploadedBy).filter((id): id is string => Boolean(id)),
  );
  const creatorCount = uniqueCreatorIds.size;

  type CreatorAgg = {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    videoCount: number;
    totalViews: number;
    recentThumbnails: (string | null)[];
  };
  const creatorMap = new Map<string, CreatorAgg>();
  for (const video of filteredVideos) {
    const id = video.uploadedBy;
    if (!id) continue;
    const displayName =
      video.uploaderDisplayName?.trim() ||
      video.creatorName?.trim() ||
      "Unknown";
    const avatarUrl = video.uploaderAvatarUrl ?? video.creatorAvatarUrl ?? null;
    const vc = video.viewCount ?? 0;
    const existing = creatorMap.get(id);
    if (existing) {
      existing.videoCount += 1;
      existing.totalViews += vc;
      if (existing.recentThumbnails.length < 3) {
        existing.recentThumbnails.push(video.thumbnailUrl ?? null);
      }
    } else {
      creatorMap.set(id, {
        id,
        displayName,
        avatarUrl,
        videoCount: 1,
        totalViews: vc,
        recentThumbnails: [video.thumbnailUrl ?? null],
      });
    }
  }
  const allCreators = Array.from(creatorMap.values()).sort((a, b) => b.videoCount - a.videoCount);
  const creators = allCreators.slice(0, 12);
  const totalCreatorCount = allCreators.length;

  const heroVideo = [...filteredVideos].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))[0];
  const heroThumbnail = heroVideo?.thumbnailUrl?.trim() ? heroVideo.thumbnailUrl : null;

  return (
    <ToolDetailClient
      toolName={decodedToolName}
      videos={filteredVideos}
      category={category}
      totalViews={totalViews}
      creatorCount={creatorCount}
      heroThumbnail={heroThumbnail}
      creators={creators}
      totalCreatorCount={totalCreatorCount}
    />
  );
}
