import Link from "next/link";
import { Upload } from "lucide-react";

export function UploadCTA() {
  return (
    <section className="rounded-[var(--radius)] border border-border bg-gradient-to-r from-primary/15 via-secondary to-primary/10 p-6 sm:p-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Share your AI film</h3>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">Upload to the feed, join competitions, and reach viewers on Genova.</p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          <Upload className="h-4 w-4" />
          Start upload
        </Link>
      </div>
    </section>
  );
}
