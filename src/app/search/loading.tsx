export default function SearchLoading() {
  return (
    <div className="min-h-screen text-[#EEEDFE]">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#1A1535]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="h-10 w-32 animate-pulse rounded bg-white/10" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-[#1A1535]/80 p-6">
          <div className="h-8 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-white/10" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-16 animate-pulse rounded-full bg-white/10" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-video animate-pulse rounded-xl bg-white/10" />
              <div className="h-4 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
