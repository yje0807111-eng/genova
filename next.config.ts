import type { NextConfig } from "next";

const remotePatterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [
  { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
  { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
  { protocol: "https", hostname: "i.pravatar.cc", pathname: "/**" },
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
  images: {
    remotePatterns,
  },
};

export default nextConfig;
