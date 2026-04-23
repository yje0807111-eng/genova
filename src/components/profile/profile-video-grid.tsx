import Link from "next/link";
import { formatGenreDisplay } from "@/lib/constants/genres";
import type { Video } from "@/lib/types";

export function ProfileVideoGrid({ videos, emptyLabel }: { videos: Video[]; emptyLabel: string }) {
  if (videos.length === 0) {
    const label = emptyLabel.trim() || "No films yet.";
    return <p className="rounded-xl bg-[#1A1535]/80 p-8 text-center text-sm text-[#AFA9EC]">{label}</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((v) => (
        <Link
          key={v.id}
          href={`/watch/${v.id}`}
          className="video-card-hover overflow-hidden rounded-lg border border-white/10 bg-[#1A1535] transition hover:border-[#7F77DD]"
        >
          <img src={v.thumbnailUrl} alt="" className="aspect-video w-full object-cover transition duration-200" />
          <div className="space-y-0.5 p-2.5">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#EEEDFE]">{v.title}</p>
            <p className="text-[11px] leading-snug text-[#AFA9EC]">{formatGenreDisplay(v.genre, v.subGenre)}</p>
            <p className="text-[11px] text-[#AFA9EC]">
              ♥ <span className="text-[#E8E4FF]">{v.likeCount ?? 0}</span>
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
