export default function EditVideoLoading() {
  return (
    <div className="min-h-screen px-5 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="h-8 w-48 rounded-lg bg-[#1A1535]" />
        <div className="h-12 w-full rounded-lg bg-[#1A1535]" />
        <div className="h-12 w-full rounded-lg bg-[#1A1535]" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="aspect-video rounded-lg bg-[#1A1535]" />
          <div className="space-y-3">
            <div className="h-10 w-full rounded bg-[#1A1535]" />
            <div className="h-10 w-full rounded bg-[#1A1535]" />
          </div>
        </div>
      </div>
    </div>
  );
}
