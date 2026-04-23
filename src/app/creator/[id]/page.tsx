import { notFound } from "next/navigation";
import Link from "next/link";
import { formatGenreDisplay } from "@/lib/constants/genres";
import { fetchCreatorById, fetchVideosByCreator } from "@/lib/queries";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const creator = await fetchCreatorById(id);
  if (!creator) notFound();

  const works = await fetchVideosByCreator(creator.id);

  return (
    <div className="page-cinematic mx-auto max-w-6xl space-y-6 px-6 py-8 text-[#F8F7FF]">
        <header className="space-y-2">
          <p className="eyebrow">Creators</p>
          <h1 className="page-title text-3xl sm:text-4xl">Creator Profile</h1>
          <p className="page-subtitle">Discover creator identity, awards, and all published works.</p>
        </header>
        <section className="rounded-2xl border border-white/10 bg-[#1A1535]/80 p-6">
          <div className="flex flex-wrap items-center gap-5">
            <img src={creator.avatarUrl} alt={creator.name} className="h-20 w-20 rounded-full object-cover" />
            <div>
              <h1 className="text-3xl font-bold">{creator.name}</h1>
              <p className="text-[#AFA9EC]">{creator.bio}</p>
            </div>
            <button type="button" className="ml-auto rounded-[6px] bg-[#534AB7] px-4 py-2 text-[#EEEDFE]">
              Follow
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 px-3 py-1">Awards {creator.awardCount}</span>
            {creator.isPartner && (
              <span className="rounded-full bg-[#7F77DD] px-3 py-1 text-[#0A0A18]">Genova Original Partner</span>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Works</h2>
          {works.length === 0 ? (
            <p className="text-[#AFA9EC]">No works yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {works.map((work) => (
                <Link key={work.id} href={`/watch/${work.id}`} className="group block">
                  <article className="overflow-hidden rounded-xl border border-white/10 bg-[#1A1535]/85 transition hover:border-[#7F77DD]/65">
                    <div className="aspect-video overflow-hidden bg-[#120f2b]">
                      {work.thumbnailUrl ? (
                        <img
                          src={work.thumbnailUrl}
                          alt=""
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-[#7F77DD]">No thumbnail</div>
                      )}
                    </div>
                    <div className="space-y-1 p-3">
                      <p className="line-clamp-2 font-semibold">{work.title}</p>
                      <p className="text-sm text-[#AFA9EC]">{formatGenreDisplay(work.genre, work.subGenre)}</p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
    </div>
  );
}
