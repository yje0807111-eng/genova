export default function ProfileByIdLoading() {
  return (
    <div className="min-h-screen w-full animate-pulse bg-background text-foreground">
      <div className="relative h-[240px] w-full overflow-hidden bg-secondary">
        <div className="absolute -bottom-14 left-12 z-20 h-32 w-32 rounded-full border-4 border-background bg-secondary" />
      </div>

      <div className="px-12 pb-4 pt-20">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded-md bg-secondary" />
            <div className="h-4 w-32 rounded-md bg-secondary" />
            <div className="h-4 w-full max-w-md rounded-md bg-secondary" />
            <div className="mt-4 flex gap-8">
              <div className="space-y-1">
                <div className="h-6 w-8 rounded bg-secondary" />
                <div className="h-3 w-12 rounded bg-secondary" />
              </div>
              <div className="space-y-1">
                <div className="h-6 w-8 rounded bg-secondary" />
                <div className="h-3 w-16 rounded bg-secondary" />
              </div>
              <div className="space-y-1">
                <div className="h-6 w-8 rounded bg-secondary" />
                <div className="h-3 w-16 rounded bg-secondary" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-28 rounded-lg bg-secondary" />
            <div className="h-10 w-24 rounded-lg bg-secondary" />
            <div className="h-10 w-10 rounded-lg bg-secondary" />
          </div>
        </div>
      </div>

      <div className="border-t border-border px-12 pb-12 pt-4">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1">
            <div className="flex gap-6 border-b border-border pb-3">
              <div className="h-5 w-20 rounded bg-secondary" />
              <div className="h-5 w-28 rounded bg-secondary" />
            </div>
            <div className="mt-4 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 border-b border-border/50 py-4">
                  <div className="aspect-video w-[240px] max-w-[38vw] shrink-0 rounded-xl bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 max-w-xs rounded bg-secondary w-[55%]" />
                    <div className="h-3 w-full rounded bg-secondary" />
                    <div className="h-3 w-[80%] rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full shrink-0 space-y-3 lg:w-[260px]">
            <div className="rounded-xl border border-border/50 bg-card/50 p-4">
              <div className="mb-3 h-4 w-16 rounded bg-secondary" />
              <div className="h-3 w-full rounded bg-secondary" />
              <div className="mt-2 h-3 w-[80%] rounded bg-secondary" />
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 p-4">
              <div className="mb-3 h-4 w-20 rounded bg-secondary" />
              <div className="flex gap-3 py-2">
                <div className="h-10 w-10 rounded-lg bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-secondary" />
                  <div className="h-3 w-24 rounded bg-secondary" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 p-4">
              <div className="mb-2 h-4 w-28 rounded bg-secondary" />
              <div className="h-3 w-28 rounded bg-secondary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
