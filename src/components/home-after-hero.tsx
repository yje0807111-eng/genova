"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useRef } from "react";
import { AnimateIn } from "@/components/animate-in";
import { GenovaSymbol } from "@/components/genova-symbol";
import { ProfileTextLink } from "@/components/links/profile-text-link";
import { hrefForSpotlightCreator } from "@/lib/creator-links";
import { formatGenreDisplay } from "@/lib/constants/genres";
import type { Creator, Video } from "@/lib/types";

function FilmOverlayCard({ video, originalBadge = false }: { video: Video; originalBadge?: boolean }) {
  return (
    <Link
      href={`/watch/${video.id}`}
      className="ui-card ui-card-hover group relative block aspect-video overflow-hidden rounded-[2px] bg-[#0F0D24]"
    >
      {video.thumbnailUrl ? (
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="h-full w-full object-cover transition duration-300 ease-out group-hover:scale-[1.05] group-hover:brightness-90"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-[#1A1535] to-[#26215C]" />
      )}
      {originalBadge ? (
        <span className="absolute left-2 top-2 rounded-[2px] bg-[#534AB7] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
          Original
        </span>
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
        <p className="line-clamp-1 text-[14px] font-medium text-white">{video.title}</p>
        <span className="ui-badge-genre mt-1 inline-flex px-2 py-0.5 font-medium">
          {formatGenreDisplay(video.genre, video.subGenre)}
        </span>
      </div>
    </Link>
  );
}

function RowSlider({
  title,
  href,
  children,
  trackStyle,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
  trackStyle?: CSSProperties;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const shift = (dir: "left" | "right") => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({ left: dir === "left" ? -900 : 900, behavior: "smooth" });
  };

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <Link href={href} className="text-sm text-[#AFA9EC] transition hover:text-[#EEEDFE]">
          View All
        </Link>
      </div>
      <div className="stream-row">
        <button type="button" className="stream-arrow stream-arrow-left" onClick={() => shift("left")} aria-label="Scroll left">
          ‹
        </button>
        <div ref={trackRef} className="stream-track" style={trackStyle}>
          {children}
        </div>
        <button type="button" className="stream-arrow stream-arrow-right" onClick={() => shift("right")} aria-label="Scroll right">
          ›
        </button>
      </div>
    </section>
  );
}

function translateCreatorName(name: string): string {
  const map: Record<string, string> = {
    이서하: "Seoha Lee",
    박도윤: "Doyoon Park",
    정하린: "Harin Jung",
  };
  return map[name] ?? name;
}

function translateCreatorBio(bio: string): string {
  const map: Record<string, string> = {
    "생성형 AI로 감성 SF를 만드는 디렉터": "Director creating emotional sci-fi with generative AI",
    "광고와 뮤직비디오를 넘나드는 비주얼 메이커": "Visual maker working across commercials and music videos",
    "단편 시리즈 세계관 제작 전문 크리에이터": "Creator specializing in short-form cinematic universes",
  };
  return map[bio] ?? bio;
}

function translateCompetitionTitle(title: string): string {
  const map: Record<string, string> = {
    "Genova AI 영상 공모전 2026": "Genova AI Film Contest 2026",
  };
  return map[title] ?? title;
}

function translateCompetitionPrize(prizeInfo: string): string {
  const map: Record<string, string> = {
    "총 상금 5,000만원 + Genova Original 계약": "Total Prize $50,000 + Genova Original Deal",
  };
  return map[prizeInfo] ?? prizeInfo;
}

export function HomeAfterHero({
  latestVideos,
  originals,
  creators,
  competition,
  dDay,
}: {
  latestVideos: Video[];
  originals: Video[];
  creators: Creator[];
  competition: { title: string; prizeInfo: string } | null;
  dDay: number;
}) {
  const competitionTitle = competition ? translateCompetitionTitle(competition.title) : null;
  const competitionPrizeInfo = competition ? translateCompetitionPrize(competition.prizeInfo) : null;
  const originalsTrackRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="space-y-10 py-10">
      <AnimateIn delay={0.03}>
      <section className="mx-auto max-w-[1680px] px-12 py-10">
        {latestVideos.length === 0 ? (
          <p className="text-[#AFA9EC]">No films yet.</p>
        ) : (
          <RowSlider
            title="Latest Films"
            href="/feed"
            trackStyle={{ gridAutoColumns: "minmax(290px, 17vw)", gap: "1.25rem" }}
          >
            {latestVideos.slice(0, 12).map((video) => (
              <FilmOverlayCard key={video.id} video={video} />
            ))}
          </RowSlider>
        )}
      </section>
      </AnimateIn>

      <AnimateIn delay={0.08}>
      <section className="relative overflow-hidden px-0">
        <div className="relative mx-auto w-full max-w-[1900px] overflow-hidden border border-[rgba(255,255,255,0.06)] border-l-[2px] border-l-[#534AB7] bg-[#0D0B1F] px-12 py-10">
          <div className="relative flex w-full flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="relative space-y-3">
            <span className="eyebrow">Featured Competition</span>
            <h3 className="text-2xl font-bold">{competitionTitle ?? "No active competition"}</h3>
            {competition ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-[2px] border border-[rgba(255,255,255,0.15)] bg-[#080618] px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#FF6B6B]" />
                  <p className="text-sm font-semibold tracking-wide text-white">
                    {dDay > 0 ? `SUBMISSION CLOSES IN D-${dDay}` : "SUBMISSION ENDS TODAY"}
                  </p>
                </div>
                <p className="text-sm text-[rgba(255,255,255,0.5)]">{competitionPrizeInfo}</p>
              </>
            ) : null}
          </div>
          <Link href="/competition" className="btn-primary relative inline-flex w-fit rounded-[2px] px-5 py-2 text-[13px] font-medium">
            Enter Now
          </Link>
        </div>
        </div>
      </section>
      </AnimateIn>

      <AnimateIn delay={0.12}>
      <section className="mx-auto max-w-[1680px] px-12 py-10">
        <div className="space-y-5">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Genova Originals</h2>
            <Link href="/feed" className="text-sm text-[#AFA9EC] transition hover:text-[#EEEDFE]">
              View All
            </Link>
          </div>
          {originals.length === 0 ? (
            <p className="text-[#AFA9EC]">No films yet.</p>
          ) : (
            <div className="stream-row">
              <button
                type="button"
                className="stream-arrow stream-arrow-left"
                onClick={() => originalsTrackRef.current?.scrollBy({ left: -900, behavior: "smooth" })}
                aria-label="Scroll originals left"
              >
                ‹
              </button>
              <div ref={originalsTrackRef} className="stream-track" style={{ gridAutoColumns: "minmax(320px, 20vw)", gap: "1.25rem" }}>
                {originals.slice(0, 10).map((video) => (
                  <FilmOverlayCard key={video.id} video={video} originalBadge />
                ))}
              </div>
              <button
                type="button"
                className="stream-arrow stream-arrow-right"
                onClick={() => originalsTrackRef.current?.scrollBy({ left: 900, behavior: "smooth" })}
                aria-label="Scroll originals right"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </section>
      </AnimateIn>

      <AnimateIn delay={0.16}>
      <section className="relative overflow-hidden bg-[#0D0B1F] py-10">
        <div className="section-blob -right-40 -top-40" />
        <div className="section-content mx-auto max-w-[1680px] px-12">
          <h2 className="mb-8 text-3xl font-bold">Featured Creators</h2>
          {creators.length === 0 ? (
            <p className="text-[#AFA9EC]">No creators yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {creators.map((creator, idx) => (
                <div
                  key={creator.id}
                  className="rounded-xl border border-white/10 bg-[#0F0D1E] p-5 transition hover:border-[#534AB7]"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={creator.avatarUrl}
                      alt={creator.name}
                      className="h-18 w-18 shrink-0 rounded-full object-cover transition duration-300 hover:scale-105"
                    />
                    <div className="min-w-0 flex-1">
                      <ProfileTextLink
                        href={hrefForSpotlightCreator(creator.id)}
                        className="block truncate text-lg font-semibold text-[#EEEDFE] hover:underline"
                      >
                        {translateCreatorName(creator.name)}
                      </ProfileTextLink>
                      <p className="mt-1 line-clamp-2 text-sm text-[#AFA9EC]">{translateCreatorBio(creator.bio)}</p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-[#B8B3EE]">
                        <span>{((creator as unknown as { followerCount?: number }).followerCount ?? creator.awardCount * 320 + 800 + idx * 140).toLocaleString()} followers</span>
                        <span className="text-white/20">•</span>
                        <span>{((creator as unknown as { filmCount?: number }).filmCount ?? creator.awardCount + 6 + (idx % 3))} films</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {["Runway", "Midjourney", idx % 2 ? "Suno" : "ElevenLabs"].map((tool) => (
                          <span key={tool} className="rounded-full bg-[#26215C] px-2 py-0.5 text-[11px] text-[#AFA9EC]">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={hrefForSpotlightCreator(creator.id)}
                    className="mt-4 inline-flex rounded-full border border-[#534AB7]/60 px-4 py-2 text-sm font-semibold text-[#EEEDFE] hover:bg-[#534AB7]/30"
                  >
                    Follow
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      </AnimateIn>
    </div>
  );
}
