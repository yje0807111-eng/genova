import type { Metadata } from "next";
import { ShortsFeed, type ShortsFeedItem } from "@/components/shorts/shorts-feed";
import { fetchCommentCountsForVideoIds } from "@/lib/queries/comments-queries";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import { fetchVideosWithCreators } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Video } from "@/lib/types";

export const metadata: Metadata = {
  title: "Shorts | Genova",
  description: "Vertical full-screen films",
};

export const dynamic = "force-dynamic";

async function enrichForShorts(videos: Video[]): Promise<ShortsFeedItem[]> {
  if (videos.length === 0) return [];
  const commentCounts = await fetchCommentCountsForVideoIds(videos.map((v) => v.id));
  const supabase = await createServerSupabaseClient();
  const uploaderIds = [...new Set(videos.map((v) => v.uploadedBy).filter(Boolean))] as string[];
  const creatorIds = [...new Set(videos.map((v) => v.creatorId).filter(Boolean))] as string[];
  const profileMap = new Map<string, string | null>();
  const creatorAvMap = new Map<string, string>();

  if (supabase && uploaderIds.length > 0) {
    const { data } = await supabase.from("profiles").select("id, avatar_url").in("id", uploaderIds);
    for (const p of data ?? []) profileMap.set(p.id as string, (p.avatar_url as string | null) ?? null);
  }
  if (supabase && creatorIds.length > 0) {
    const { data } = await supabase.from("creators").select("id, avatar_url").in("id", creatorIds);
    for (const c of data ?? []) creatorAvMap.set(c.id as string, c.avatar_url as string);
  }

  return videos.map((v) => ({
    ...v,
    commentCount: commentCounts[v.id] ?? 0,
    uploaderAvatarUrl: v.uploadedBy ? profileMap.get(v.uploadedBy) ?? null : null,
    creatorAvatarUrl: v.creatorId ? creatorAvMap.get(v.creatorId) ?? null : null,
  }));
}

export default async function ShortsPage() {
  const raw = await fetchVideosWithCreators();
  const withEngagement = await attachEngagementToVideos(raw);
  const items = await enrichForShorts(withEngagement);

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a]">
      <ShortsFeed videos={items} />
    </div>
  );
}
