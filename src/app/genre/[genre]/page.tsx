import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MAIN_GENRE_LABELS,
  MAIN_GENRES_WITH_SUB,
  SUB_GENRE_KEYS,
  SUB_GENRE_LABELS,
  formatGenreDisplay,
  normalizeMainGenreKey,
  type MainGenreKey,
} from "@/lib/constants/genres";
import { genreCardGradient } from "@/lib/search-ui";
import { fetchVideosByGenre, type GenrePageSort } from "@/lib/queries/search-queries";

export const dynamic = "force-dynamic";

function buildGenreHref(genre: MainGenreKey, sub: string | null, sort: GenrePageSort): string {
  const p = new URLSearchParams();
  if (sort !== "latest") p.set("sort", sort);
  if (sub) p.set("sub", sub);
  const qs = p.toString();
  return qs ? `/genre/${genre}?${qs}` : `/genre/${genre}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ genre: string }>;
}) {
  const { genre: raw } = await params;
  const key = normalizeMainGenreKey(decodeURIComponent(raw));
  if (!key || key === "other") {
    return { title: "Genre | Genova" };
  }
  return { title: `${MAIN_GENRE_LABELS[key]} | Genova` };
}

export default async function GenreExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ genre: string }>;
  searchParams: Promise<{ sub?: string; sort?: string }>;
}) {
  const { genre: raw } = await params;
  const sp = await searchParams;
  const key = normalizeMainGenreKey(decodeURIComponent(raw));
  if (!key || key === "other") {
    notFound();
  }

  const sortRaw = (sp.sort ?? "latest").toLowerCase();
  const sort: GenrePageSort =
    sortRaw === "popular" ? "popular" : sortRaw === "award" ? "award" : "latest";

  const subCandidate = (sp.sub ?? "").trim();
  const subValid =
    subCandidate &&
    (SUB_GENRE_KEYS as readonly string[]).includes(subCandidate) &&
    MAIN_GENRES_WITH_SUB.has(key)
      ? subCandidate
      : null;

  const videos = await fetchVideosByGenre(key, subValid, sort);
  const gradient = genreCardGradient(key);
  const showSubFilter = MAIN_GENRES_WITH_SUB.has(key);

  return (
    <div className="page-cinematic mx-auto max-w-6xl space-y-6 px-6 py-8 text-[#F8F7FF]">
        <nav className="text-sm text-[#AFA9EC]">
          <Link href="/search" className="hover:text-[#EEEDFE]">
            Search
          </Link>
          <span className="mx-2 text-white/30">/</span>
          <span className="text-[#EEEDFE]">{MAIN_GENRE_LABELS[key]}</span>
        </nav>

        <header className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} px-8 py-9 shadow-lg ring-1 ring-white/10`}>
          <div className="relative z-10 max-w-2xl space-y-2">
            <p className="eyebrow !text-[#C8C3FF]">Genre</p>
            <h1 className="page-title text-3xl">{MAIN_GENRE_LABELS[key]}</h1>
            <p className="page-subtitle !text-[#E8E4FF]/90">{videos.length} films with curated genre filters and sorting.</p>
          </div>
        </header>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {showSubFilter ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7F77DD]">Sub Genre</p>
              <div className="flex flex-wrap gap-1 border-b border-white/10">
                <Link
                  href={buildGenreHref(key, null, sort)}
                  className={`tab-underline text-sm font-medium ${
                    !subValid ? "border-b-[#7F77DD] text-[#EEEDFE]" : ""
                  }`}
                >
                  All
                </Link>
                {(SUB_GENRE_KEYS as readonly string[])
                  .filter((k) => k !== "other")
                  .map((sk) => (
                    <Link
                      key={sk}
                      href={buildGenreHref(key, sk, sort)}
                      className={`tab-underline text-sm font-medium ${
                        subValid === sk ? "border-b-[#7F77DD] text-[#EEEDFE]" : ""
                      }`}
                    >
                      {SUB_GENRE_LABELS[sk as keyof typeof SUB_GENRE_LABELS]}
                    </Link>
                  ))}
              </div>
            </div>
          ) : (
            <div />
          )}

          <div className="flex flex-wrap items-center gap-1 border-b border-white/10">
            {(
              [
                ["latest", "Latest"],
                ["popular", "Popular"],
                ["award", "Awards First"],
              ] as const
            ).map(([k, label]) => (
              <Link
                key={k}
                href={buildGenreHref(key, subValid, k as GenrePageSort)}
                className={`tab-underline text-sm font-medium ${
                  sort === k ? "border-b-[#7F77DD] text-[#EEEDFE]" : ""
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {videos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/20 bg-[#131028]/50 py-16 text-center text-[#AFA9EC]">
            No films match these filters.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {videos.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/watch/${v.id}`}
                  className="group block overflow-hidden rounded-xl border border-white/10 bg-[#1A1535]/90 transition hover:border-[#7F77DD]"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={v.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-2 text-sm font-semibold text-[#EEEDFE]">{v.title}</p>
                    <p className="text-[11px] text-[#AFA9EC]">{formatGenreDisplay(v.genre, v.subGenre)}</p>
                    <p className="text-[11px] text-[#AFA9EC]">
                      ♥ <span className="text-[#E8E4FF]">{v.likeCount ?? 0}</span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
