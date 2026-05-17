import path from "node:path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const remotePatterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [
  { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
  { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
  { protocol: "https", hostname: "i.pravatar.cc", pathname: "/**" },
  // Mux thumbnail/animated-gif previews (image.mux.com/<playback_id>/...)
  // — used by home-genre-carousel and other video thumbnail surfaces.
  { protocol: "https", hostname: "image.mux.com", pathname: "/**" },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  try {
    const host = new URL(supabaseUrl).hostname;
    if (host && !remotePatterns.some((p) => "hostname" in p && p.hostname === host)) {
      remotePatterns.push({ protocol: "https", hostname: host, pathname: "/**" });
    }
  } catch {
    /* ignore invalid URL */
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    // Pin workspace root to this project dir so Turbopack does not select
    // an outer lockfile (e.g. C:\Users\Home\package-lock.json) when
    // multiple lockfiles are present on the machine.
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns,
  },
};

// Sentry build wrapper. Source-map upload only runs when
// SENTRY_AUTH_TOKEN is present; absent ⇒ silently skipped, build
// unaffected. Runtime SDK stays inert without NEXT_PUBLIC_SENTRY_DSN.
export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  widenClientFileUpload: false,
});
