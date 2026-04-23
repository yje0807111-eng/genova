import { FilmsComingSoon, FilmsVideoCard } from "@/components/films/films-video-card";
import { FILMS_GENRE_KEYS, FILMS_GENRE_LABELS } from "@/lib/constants/genres";
import { attachEngagementToVideos } from "@/lib/queries/engagement-queries";
import { buildFilmsPageData } from "@/lib/films-page-data";
import { fetchVideosWithCreators } from "@/lib/queries";

export default async function FilmsPage() {
  const raw = await fetchVideosWithCreators();
  const videos = await attachEngagementToVideos(raw);
  const { originals, awardWinners, editorsPicks, genreSpotlight } = buildFilmsPageData(videos);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05030f]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, #080618 0%, #0D0B1F 35%, #080618 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          mixBlendMode: "soft-light",
          backgroundImage:
            "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.35) 0.5px, transparent 0.9px)",
          backgroundSize: "4px 4px",
        }}
      />

      <div className="relative mx-auto max-w-[1680px] px-12 pb-24 pt-10 text-white">
        <header className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="eyebrow">Curated</p>
          <h1 className="page-title">Films</h1>
          <p className="text-base text-[rgba(255,255,255,0.5)] sm:text-lg">
            Handpicked originals, award winners, and editor&apos;s picks
          </p>
        </header>

        <div className="mt-20 space-y-24">
          {/* Genova Originals */}
          <section className="space-y-8" aria-labelledby="films-originals">
            <div className="flex flex-col gap-2 border-b border-white/10 pb-5">
              <h2 id="films-originals" className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Genova Originals
              </h2>
              <p className="text-sm text-[#AFA9EC]">Exclusive productions and branded originals from the Genova network.</p>
            </div>
            {originals.length === 0 ? (
              <FilmsComingSoon />
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {originals.slice(0, 2).map((video) => (
                  <FilmsVideoCard key={video.id} video={video} size="hero" />
                ))}
              </div>
            )}
            {originals.length > 2 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {originals.slice(2, 8).map((video) => (
                  <FilmsVideoCard key={video.id} video={video} size="large" />
                ))}
              </div>
            ) : null}
          </section>

          {/* Award Winners */}
          <section className="space-y-8" aria-labelledby="films-awards">
            <div className="flex flex-col gap-2 border-b border-white/10 pb-5">
              <h2 id="films-awards" className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Award Winners
              </h2>
              <p className="text-sm text-[#AFA9EC]">Festival honorees and competition laurels.</p>
            </div>
            {awardWinners.length === 0 ? (
              <FilmsComingSoon />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {awardWinners.map((video) => (
                  <FilmsVideoCard key={video.id} video={video} size="medium" awardLabel={video.award ?? "Award"} />
                ))}
              </div>
            )}
          </section>

          {/* Editor's Picks */}
          <section className="space-y-8" aria-labelledby="films-picks">
            <div className="flex flex-col gap-2 border-b border-white/10 pb-5">
              <h2 id="films-picks" className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Editor&apos;s Picks
              </h2>
              <p className="text-sm text-[#AFA9EC]">Finalists and staff favorites worth your queue.</p>
            </div>
            {editorsPicks.length === 0 ? (
              <FilmsComingSoon />
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {editorsPicks.map((video) => (
                  <FilmsVideoCard key={video.id} video={video} size="large" />
                ))}
              </div>
            )}
          </section>

          {/* Genre Spotlight */}
          <section className="space-y-10" aria-labelledby="films-genres">
            <div className="flex flex-col gap-2 border-b border-white/10 pb-5">
              <h2 id="films-genres" className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Genre Spotlight
              </h2>
              <p className="text-sm text-[#AFA9EC]">A rotating lens across genres — fresh voices in every category.</p>
            </div>
            <nav className="flex flex-wrap gap-2 pb-2" aria-label="Jump to Films genre">
              {FILMS_GENRE_KEYS.map((k) => (
                <a
                  key={k}
                  href={`#films-spotlight-${k}`}
                  className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#AFA9EC] transition hover:border-[#7F77DD]/45 hover:text-[#EEEDFE]"
                >
                  {FILMS_GENRE_LABELS[k]}
                </a>
              ))}
            </nav>
            <div className="space-y-14">
              {genreSpotlight.map(({ genreKey, label, picks }) => (
                <div key={genreKey} id={`films-spotlight-${genreKey}`} className="scroll-mt-28 space-y-5">
                  <h3 className="text-lg font-semibold tracking-tight text-[#E8E4FF]">{label}</h3>
                  {picks.length === 0 ? (
                    <FilmsComingSoon className="min-h-[160px] py-12" />
                  ) : (
                    <div
                      className={`grid gap-5 ${picks.length > 1 ? "sm:grid-cols-2" : "max-w-2xl"}`}
                    >
                      {picks.map((video) => (
                        <FilmsVideoCard key={video.id} video={video} size="large" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
