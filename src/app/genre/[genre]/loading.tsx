export default function GenreLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
      <div className="h-44 animate-pulse rounded-3xl bg-gradient-to-r from-[#534AB7]/30 to-[#1A1535]/50" />
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-20 animate-pulse rounded-full bg-white/10" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-video animate-pulse rounded-xl bg-white/10" />
            <div className="h-4 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
