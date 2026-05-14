import Image from "next/image";
import Link from "next/link";
import { getServerLocale } from "@/lib/i18n/server";
import { formatGenreDisplay } from "@/lib/constants/genres";
import type { Video } from "@/lib/types";

/**
 * Server component — Phase B.2-6.  Only used `useI18n()` to read the
 * locale for `formatGenreDisplay`; no event handlers, no state.  Now
 * async and reads the locale on the server.
 */
export async function ProfileVideoGrid({ videos, emptyLabel }: { videos: Video[]; emptyLabel: string }) {
  const locale = await getServerLocale();
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
          <div className="relative aspect-video w-full">
            <Image src={v.thumbnailUrl} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-200" />
          </div>
          <div className="space-y-0.5 p-2.5">
            <p className="typo-card-title line-clamp-2 text-[#EEEDFE]">{v.title}</p>
            <p className="typo-card-meta text-[#AFA9EC]">{formatGenreDisplay(v.genre, v.subGenre, locale)}</p>
            <p className="typo-card-meta text-[#AFA9EC]">
              ♥ <span className="text-[#E8E4FF]">{v.likeCount ?? 0}</span>
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
