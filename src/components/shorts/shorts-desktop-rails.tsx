"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { formatGenreDisplay } from "@/lib/constants/genres";
import { formatViewCountShort } from "@/lib/view-count";
import { normalizeToolName } from "@/lib/constants/ai-tools";
import { hrefForVideoCreator } from "@/lib/creator-links";
import type { ShortsFeedItem } from "@/components/shorts/shorts-feed";
import { useUploadModal } from "@/components/upload/upload-modal-context";

function displayName(v: ShortsFeedItem): string {
  if (v.creatorName) return v.creatorName;
  if (v.uploaderDisplayName) return v.uploaderDisplayName;
  return "Creator";
}

function avatarForVideo(v: ShortsFeedItem): string | null {
  if (v.creatorId && v.creatorAvatarUrl) return v.creatorAvatarUrl;
  return v.uploaderAvatarUrl;
}

const railShell =
  "flex h-full min-h-0 flex-col overflow-y-auto rounded-xl border border-white/10 bg-[linear-gradient(165deg,rgba(13,11,30,0.92)_0%,rgba(10,10,10,0.96)_100%)] px-4 py-5 shadow-[inset_0_1px_0_var(--tint-purple-12)] backdrop-blur-md";

export function ShortsLeftRail({
  videos,
  activeIndex,
  onSelectIndex,
}: {
  videos: ShortsFeedItem[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
}) {
  const { open: openUploadModal } = useUploadModal();
  const upNext = useMemo(() => {
    const out: { v: ShortsFeedItem; index: number }[] = [];
    for (let i = activeIndex + 1; i < videos.length && out.length < 5; i += 1) {
      out.push({ v: videos[i], index: i });
    }
    if (out.length < 3 && videos.length > 1) {
      for (let i = 0; i < activeIndex && out.length < 5; i += 1) {
        if (!out.some((x) => x.index === i)) out.push({ v: videos[i], index: i });
      }
    }
    return out.slice(0, 5);
  }, [videos, activeIndex]);

  return (
    <aside className={`${railShell} hidden w-[min(280px,22vw)] shrink-0 lg:block`}>
      <Link
        href="/feed"
        className="mb-4 inline-flex w-fit items-center gap-1 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-semibold text-[#EEEDFE] backdrop-blur-sm transition hover:border-[#7F77DD]/50"
      >
        ← Feed
      </Link>

      <p className="eyebrow text-[10px]">Shorts</p>
      <h2 className="mt-1 font-display text-lg font-bold leading-tight tracking-tight text-[#F8F7FF]">AI film feed</h2>
      <p className="mt-2 text-xs leading-relaxed text-[#AFA9EC]">
        Swipe or scroll through public films from the Genova community — vertical, full bleed, creator-first.
      </p>

      <div className="my-5 h-px bg-gradient-to-r from-transparent via-[#534AB7]/35 to-transparent" />

      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7F77DD]">Up next</p>
      <ul className="mt-3 space-y-2">
        {upNext.length === 0 ? (
          <li className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs text-[#AFA9EC]/80">
            End of queue — browse Watch for more.
          </li>
        ) : (
          upNext.map(({ v, index }) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => onSelectIndex(index)}
                className="group flex w-full gap-3 rounded-lg border border-transparent p-1.5 text-left transition hover:border-[#534AB7]/40 hover:bg-white/[0.04]"
              >
                <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-[#1a1a1a] ring-1 ring-white/10">
                  <Image src={v.thumbnailUrl} alt="" fill sizes="40px" className="object-cover opacity-90 transition group-hover:opacity-100" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-semibold leading-snug text-[#EEEDFE]">{v.title}</p>
                  <p className="mt-0.5 truncate text-[10px] text-[#7F77DD]">{formatGenreDisplay(v.genre, v.subGenre)}</p>
                </div>
              </button>
            </li>
          ))
        )}
      </ul>

      <div className="my-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7F77DD]">Explore</p>
      <nav className="mt-3 flex flex-col gap-1.5 text-sm">
        <Link href="/feed" className="rounded-lg px-2 py-2 text-[#AFA9EC] transition hover:bg-white/[0.05] hover:text-[#F8F7FF]">
          Browse catalog →
        </Link>
        <Link href="/competition" className="rounded-lg px-2 py-2 text-[#AFA9EC] transition hover:bg-white/[0.05] hover:text-[#F8F7FF]">
          Competitions →
        </Link>
        <button type="button" onClick={() => openUploadModal()} className="rounded-lg px-2 py-2 text-left text-[#AFA9EC] transition hover:bg-white/[0.05] hover:text-[#F8F7FF]">
          Upload a film →
        </button>
      </nav>

      <p className="mt-6 text-[10px] leading-relaxed text-[#AFA9EC]/50">
        {videos.length} title{videos.length === 1 ? "" : "s"} in this session
      </p>
    </aside>
  );
}

export function ShortsRightRail({
  videos,
  activeIndex,
  onSelectIndex,
}: {
  videos: ShortsFeedItem[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
}) {
  const active = videos[activeIndex] ?? null;

  const related = useMemo(() => {
    if (!active) return [] as { v: ShortsFeedItem; index: number }[];
    const others = videos.map((v, index) => ({ v, index })).filter((x) => x.v.id !== active.id);
    const same = others.filter((x) => Boolean(active.genre) && x.v.genre === active.genre);
    const sameIds = new Set(same.map((s) => s.v.id));
    const rest = others.filter((x) => !sameIds.has(x.v.id));
    return [...same, ...rest].slice(0, 4);
  }, [videos, active]);

  if (!active) {
    return <aside className={`${railShell} hidden w-[min(300px,24vw)] shrink-0 lg:block`} aria-hidden />;
  }

  const name = displayName(active);
  const av = avatarForVideo(active);
  const profileHref = hrefForVideoCreator(active);
  const views = formatViewCountShort(active.viewCount);
  const likes = formatViewCountShort(active.likeCount);

  return (
    <aside className={`${railShell} hidden w-[min(300px,24vw)] shrink-0 lg:block`}>
      <p className="eyebrow text-[10px]">Now playing</p>
      <h2 className="mt-1 line-clamp-2 font-display text-base font-bold leading-snug text-[#F8F7FF]">{active.title}</h2>
      <p className="mt-1 text-[11px] text-[#7F77DD]">{formatGenreDisplay(active.genre, active.subGenre)}</p>

      <div className="my-4 h-px bg-gradient-to-r from-transparent via-[#534AB7]/35 to-transparent" />

      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7F77DD]">Creator</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/15 bg-[#26215C]">
          {av ? (
            <Image src={av} alt="" width={44} height={44} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#AFA9EC]">{name.slice(0, 1)}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {profileHref ? (
            <Link href={profileHref} className="block truncate text-sm font-semibold text-[#F8F7FF] hover:underline">
              {name}
            </Link>
          ) : (
            <span className="block truncate text-sm font-semibold text-[#F8F7FF]">{name}</span>
          )}
          <p className="truncate text-[10px] text-[#AFA9EC]/80">Public · AI-assisted</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-white/[0.04] px-2 py-2 ring-1 ring-white/10">
          <dt className="text-[9px] font-medium uppercase tracking-wider text-[#AFA9EC]/70">Views</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[#EEEDFE]">{views}</dd>
        </div>
        <div className="rounded-lg bg-white/[0.04] px-2 py-2 ring-1 ring-white/10">
          <dt className="text-[9px] font-medium uppercase tracking-wider text-[#AFA9EC]/70">Likes</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[#EEEDFE]">{likes}</dd>
        </div>
        <div className="rounded-lg bg-white/[0.04] px-2 py-2 ring-1 ring-white/10">
          <dt className="text-[9px] font-medium uppercase tracking-wider text-[#AFA9EC]/70">Comments</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[#EEEDFE]">{active.commentCount}</dd>
        </div>
      </dl>

      {active.aiTools.length > 0 ? (
        <>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7F77DD]">AI pipeline</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {active.aiTools.slice(0, 8).map((t) => (
              <li key={t}>
                <span className="inline-block rounded-md bg-[#1a1a1a]/90 px-2 py-0.5 text-[10px] font-medium text-[#AFA9EC] ring-1 ring-white/10">
                  {normalizeToolName(t)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <div className="my-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7F77DD]">More in this feed</p>
      <ul className="mt-3 space-y-2">
        {related.length === 0 ? (
          <li className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-center text-xs text-[#AFA9EC]/70">No other titles yet.</li>
        ) : (
          related.map(({ v, index }) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => onSelectIndex(index)}
                className="group flex w-full gap-3 rounded-lg border border-transparent p-1.5 text-left transition hover:border-[#534AB7]/40 hover:bg-white/[0.04]"
              >
                <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-[#1a1a1a] ring-1 ring-white/10">
                  <Image src={v.thumbnailUrl} alt="" fill sizes="36px" className="object-cover opacity-90 transition group-hover:opacity-100" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-[#EEEDFE]">{v.title}</p>
                  <p className="mt-0.5 truncate text-[10px] text-[#7F77DD]">{formatGenreDisplay(v.genre, v.subGenre)}</p>
                </div>
              </button>
            </li>
          ))
        )}
      </ul>

      <Link
        href={`/watch/${active.id}`}
        className="mt-5 flex w-full items-center justify-center rounded-lg border border-[#534AB7]/50 bg-[#534AB7]/20 px-4 py-2.5 text-center text-sm font-semibold text-[#EEEDFE] transition hover:border-[#7F77DD]/60 hover:bg-[#534AB7]/35"
      >
        Open full page
      </Link>
    </aside>
  );
}
