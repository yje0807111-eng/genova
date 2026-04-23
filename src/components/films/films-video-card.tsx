import Link from "next/link";
import { formatGenreDisplay } from "@/lib/constants/genres";
import type { Video } from "@/lib/types";

type Size = "hero" | "large" | "medium";

export function FilmsVideoCard({
  video,
  size = "medium",
  awardLabel,
}: {
  video: Video;
  size?: Size;
  /** When set, shows an award ribbon on the card */
  awardLabel?: string | null;
}) {
  const aspect =
    size === "hero"
      ? "aspect-[21/9] min-h-[220px] sm:min-h-[280px]"
      : size === "large"
        ? "aspect-[16/10] min-h-[200px]"
        : "aspect-video";

  return (
    <Link
      href={`/watch/${video.id}`}
      className={`ui-card ui-card-hover group relative block w-full overflow-hidden rounded-[2px] bg-[#0F0D24] transition duration-200 ease-out will-change-transform hover:z-[1] ${aspect}`}
    >
      {video.thumbnailUrl ? (
        <img
          src={video.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:brightness-[0.65]"
        />
      ) : (
        <div className="h-full w-full bg-[#0F0D24]" />
      )}

      {awardLabel ? (
        <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] rounded-[2px] border border-[rgba(83,74,183,0.3)] bg-[rgba(83,74,183,0.2)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#534AB7]">
          {awardLabel}
        </span>
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent opacity-0 transition duration-200 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 sm:p-5">
        <p className="line-clamp-2 text-[14px] font-medium leading-snug text-white">{video.title}</p>
        <p className="mt-1 line-clamp-1 text-[12px] text-[rgba(255,255,255,0.5)]">{formatGenreDisplay(video.genre, video.subGenre)}</p>
      </div>
    </Link>
  );
}

export function FilmsComingSoon({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex min-h-[200px] flex-col items-center justify-center rounded-[2px] border border-dashed border-[rgba(255,255,255,0.15)] bg-[#0F0D24] px-6 py-16 text-center ${className}`}
    >
      <p className="eyebrow">Genova</p>
      <p className="mt-3 text-lg font-medium text-white">Coming Soon</p>
      <p className="mt-2 max-w-sm text-sm text-[rgba(255,255,255,0.5)]">This lineup is being curated. Check back shortly.</p>
    </div>
  );
}
