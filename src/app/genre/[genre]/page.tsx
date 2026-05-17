import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MAIN_GENRE_LABELS,
  formatGenreDisplay,
  normalizeMainGenreKey,
  type MainGenreKey,
} from "@/lib/constants/genres";
import { fetchVideosByGenre, type GenrePageSort } from "@/lib/queries/search-queries";
import { getServerLocale, getServerT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

function buildGenreHref(genre: MainGenreKey, sort: GenrePageSort): string {
  const p = new URLSearchParams();
  if (sort !== "latest") p.set("sort", sort);
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
  if (!key) {
    return { title: "Genre | Genova" };
  }
  return { title: `${MAIN_GENRE_LABELS[key]} | Genova` };
}

export default async function GenreExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ genre: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { genre: raw } = await params;
  const sp = await searchParams;
  const key = normalizeMainGenreKey(decodeURIComponent(raw));
  if (!key) {
    notFound();
  }

  const sortRaw = (sp.sort ?? "latest").toLowerCase();
  const sort: GenrePageSort =
    sortRaw === "popular" ? "popular" : sortRaw === "award" ? "award" : "latest";

  const videos = await fetchVideosByGenre(key, sort);

  const locale = await getServerLocale();
  const t = getServerT(locale);

  return (
    <div className="min-h-screen text-white">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-white/[0.05]">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -left-20 top-0 h-[400px] w-[600px] rounded-full opacity-60"
            style={{
              background: "radial-gradient(ellipse, rgba(127,119,221,0.25) 0%, transparent 65%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute -right-20 top-10 h-[300px] w-[500px] rounded-full opacity-50"
            style={{
              background: "radial-gradient(circle, rgba(83,74,183,0.2) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
        </div>
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: "linear-gradient(to right, transparent, rgba(127,119,221,0.4) 30%, rgba(175,169,236,0.25) 60%, transparent)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative mx-auto max-w-[1600px] px-6 pt-12 pb-10 sm:px-10">
          <Link
            href="/"
            className="group mb-6 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-white/35 transition hover:text-white"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            {t("genrePage.backToDiscover", "Back to Discover")}
          </Link>

          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30">
            {t("genrePage.eyebrow", "Genre")}
          </p>
          <div className="mt-3 flex items-baseline gap-4 flex-wrap">
            <h1 className="bg-gradient-to-br from-white via-white to-[#AFA9EC] bg-clip-text pb-2 text-[64px] font-black tracking-[-0.04em] leading-[1.1] text-transparent sm:text-[80px]" style={{ animation: "search-pulse 4s ease-in-out infinite" }}>
              {MAIN_GENRE_LABELS[key]}
            </h1>
            <span className="text-[16px] font-medium text-white/35">
              {videos.length}{" "}
              {videos.length === 1
                ? t("genrePage.filmCountSingular", "film")
                : t("genrePage.filmCountPlural", "films")}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 sm:px-10">
        {/* Sort + Sub genre filters */}
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-end gap-4 border-b border-white/[0.05] bg-[#0a0a0a]/80 py-5 backdrop-blur-xl">
          <div className="flex items-center gap-1.5 text-[11px]">
            {(
              [
                ["latest", t("genrePage.sortLatest", "Latest")],
                ["popular", t("genrePage.sortPopular", "Popular")],
                ["award", t("genrePage.sortAward", "Awards First")],
              ] as const
            ).map(([k, label]) => (
              <Link
                key={k}
                href={buildGenreHref(key, k as GenrePageSort)}
                className={
                  sort === k
                    ? "rounded-full border border-[#7F77DD]/40 bg-[#534AB7]/20 px-3.5 py-1.5 font-bold text-[#AFA9EC]"
                    : "rounded-full border border-white/[0.08] px-3.5 py-1.5 font-semibold text-white/35 transition hover:border-white/25 hover:text-white/80"
                }
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-14 py-10">
          {videos.length === 0 ? (
            <div className="py-24 text-center">
              <div
                className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  background: "var(--tint-accent-15)",
                  border: "1px solid rgba(127,119,221,0.2)",
                }}
              >
                <span className="text-[20px] text-[#7F77DD]/70">✦</span>
              </div>
              <p className="text-[16px] font-bold text-white/70">
                {t("genrePage.emptyTitle", "No films match these filters")}
              </p>
              <p className="mt-1.5 text-[12px] text-white/35">
                {t("genrePage.emptyHint", "Try a different sort")}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {(["film", "animation", "music", "daily", "art"] as const)
                  .filter((g) => g !== key)
                  .map((g) => (
                    <Link
                      key={g}
                      href={`/genre/${g}`}
                      className="group inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-1.5 text-[12px] font-semibold text-white/55 transition hover:-translate-y-0.5 hover:border-[#7F77DD]/40 hover:text-white"
                    >
                      <span className="text-[#7F77DD]/60 group-hover:text-[#AFA9EC]">✦</span>
                      <span className="capitalize">{g}</span>
                    </Link>
                  ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {videos.map((v, i) => (
                <Link
                  key={v.id}
                  href={`/watch/${v.id}`}
                  className="group block"
                  style={{
                    animation: `fade-in-up 0.6s ease-out ${Math.min(i * 0.05, 0.6)}s both`,
                  }}
                >
                  <div
                    className="relative w-full overflow-hidden rounded-md bg-white/[0.03] transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_20px_60px_rgba(127,119,221,0.4)]"
                    style={{ aspectRatio: "16/9" }}
                  >
                    <img
                      src={v.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                    />
                    <div
                      className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{
                        background: "linear-gradient(180deg, transparent 50%, rgba(83,74,183,0.3) 100%)",
                      }}
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/[0.06] transition duration-500 group-hover:ring-[#7F77DD]/50 rounded-md" />
                  </div>
                  <div className="mt-3 px-0.5">
                    <h3 className="line-clamp-1 text-[13px] font-semibold text-white transition group-hover:text-[#AFA9EC]">
                      {v.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-white/35">
                      <span>{formatGenreDisplay(v.genre)}</span>
                      <span className="text-white/15">·</span>
                      <span>♥ {v.likeCount ?? 0}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
