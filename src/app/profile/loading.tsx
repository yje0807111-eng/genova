export default function ProfileLoading() {
  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl animate-pulse space-y-8">
        <div className="h-10 w-48 rounded-lg bg-[#1A1535]" />
        <div className="rounded-2xl bg-[#1A1535] p-8">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="h-32 w-32 shrink-0 rounded-full bg-[#26215C]" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-8 w-2/3 rounded bg-[#26215C]" />
              <div className="h-4 w-1/2 rounded bg-[#26215C]/80" />
              <div className="h-20 w-full rounded-lg bg-[#26215C]/60" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-full bg-[#1A1535]" />
          <div className="h-10 w-24 rounded-full bg-[#1A1535]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-40 rounded-xl bg-[#1A1535]" />
          <div className="h-40 rounded-xl bg-[#1A1535]" />
        </div>
      </div>
    </div>
  );
}
