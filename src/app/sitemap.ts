import type { MetadataRoute } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://genovafilm.com";

const STATIC_ROUTES: {
  path: string;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
}[] = [
  { path: "/",            changeFrequency: "daily",   priority: 1.0 },
  { path: "/films",       changeFrequency: "daily",   priority: 0.9 },
  { path: "/competition", changeFrequency: "daily",   priority: 0.9 },
  { path: "/landing",     changeFrequency: "monthly", priority: 0.5 },
  { path: "/business",    changeFrequency: "monthly", priority: 0.5 },
  { path: "/terms",       changeFrequency: "yearly",  priority: 0.2 },
  { path: "/privacy",     changeFrequency: "yearly",  priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Dynamic entries are best-effort. Any failure falls back to static-only.
  const dynamicEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data: videos } = await supabase
        .from("videos")
        .select("id, created_at")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(1000);
      for (const v of videos ?? []) {
        dynamicEntries.push({
          url: `${SITE_URL}/watch/${v.id as string}`,
          lastModified: new Date((v.created_at as string) ?? now),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }

      const { data: competitions } = await supabase
        .from("competitions")
        .select("id, deadline")
        .order("deadline", { ascending: false })
        .limit(100);
      for (const c of competitions ?? []) {
        dynamicEntries.push({
          url: `${SITE_URL}/competition/${c.id as string}`,
          lastModified: new Date((c.deadline as string) ?? now),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  } catch {
    /* fall back to static-only on any error */
  }

  return [...staticEntries, ...dynamicEntries];
}
