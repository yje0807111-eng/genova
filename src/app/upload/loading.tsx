export default function UploadLoading() {
  return (
    <div className="min-h-screen px-5 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="h-10 w-48 rounded-lg bg-[#1A1535]" />
        <div className="h-12 w-full rounded-lg bg-[#1A1535]" />
        <div className="h-12 w-full rounded-lg bg-[#1A1535]" />
        <div className="h-40 w-full rounded-lg bg-[#1A1535]" />
      </div>
    </div>
  );
}
