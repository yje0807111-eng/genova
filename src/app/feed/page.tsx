import { FeedYoutubeLayout } from "@/components/feed/feed-youtube-layout";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import { fetchVideosWithCreators } from "@/lib/queries";

export default async function FeedPage() {
  const raw = await fetchVideosWithCreators();
  const videos = await attachEngagementToVideos(raw);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, #080618 0%, #0D0B1F 32%, #080618 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          mixBlendMode: "soft-light",
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.26) 0.5px, transparent 0.8px), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.2) 0.5px, transparent 0.8px)",
          backgroundSize: "3px 3px, 4px 4px",
        }}
      />
      <div className="relative mx-auto w-full max-w-[1680px] space-y-6 px-12 py-10 text-white">
        <header className="relative space-y-3 pb-2 pt-1">
          <p className="eyebrow">Community</p>
          <h1 className="page-title">Feed</h1>
          <p className="max-w-2xl text-sm text-[rgba(255,255,255,0.5)]">Discover AI-crafted films from creators worldwide</p>
        </header>

        {videos.length === 0 ? (
          <p className="py-16 text-center text-[#AFA9EC]">No films yet.</p>
        ) : (
          <FeedYoutubeLayout videos={videos} />
        )}
      </div>
    </div>
  );
}
