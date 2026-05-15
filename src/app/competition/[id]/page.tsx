import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mapVideo } from "@/lib/mappers";
import { mergeVideoRows } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CompetitionDetailClient } from "@/components/competition/competition-detail-client";
import { getServerLocale } from "@/lib/i18n/server";
import {
  fetchCompetitionEntryCounts,
  fetchCompetitionWinners,
} from "@/lib/queries/lottery-queries";

export const dynamic = "force-dynamic";

function ogLocaleFor(loc: "en" | "ko" | "ja"): "en_US" | "ko_KR" | "ja_JP" {
  return loc === "ko" ? "ko_KR" : loc === "ja" ? "ja_JP" : "en_US";
}

// Competitions table carries `title_ko/title_en/title_ja` + `prize_info_*`
// localized columns (see CLAUDE.md DB schema).  Pick the column matching
// the caller's locale, fall through to base `title` / `prize_info` if the
// localized variant is empty.
function pickLocalized<T extends Record<string, unknown>>(
  row: T,
  base: string,
  loc: "en" | "ko" | "ja",
): string | null {
  const localizedKey = `${base}_${loc}` as keyof T;
  const localized = (row[localizedKey] as string | null | undefined)?.trim();
  if (localized) return localized;
  const fallback = (row[base as keyof T] as string | null | undefined)?.trim();
  return fallback || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [competition, locale] = await Promise.all([fetchCompetitionById(id), getServerLocale()]);
  if (!competition) return { title: "Competition not found" };
  const title = pickLocalized(competition, "title", locale) || "Competition";
  const sponsor = (competition.sponsor as string | null)?.trim();
  const prize = pickLocalized(competition, "prize_info", locale);
  const description =
    (competition.description as string | null)?.trim() ||
    [sponsor ? `Hosted by ${sponsor}.` : null, prize ? `Prize pool: ${prize}.` : null, "Submit your AI film and compete on Genova."]
      .filter(Boolean)
      .join(" ");
  const ogImage =
    (competition.banner_url as string | null)?.trim() ||
    (competition.thumbnail_url as string | null)?.trim() ||
    undefined;
  return {
    title,
    description,
    openGraph: {
      title: `${title} | Genova Competition`,
      description,
      locale: ogLocaleFor(locale),
      images: ogImage ? [{ url: ogImage, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Genova Competition`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

async function fetchCompetitionById(id: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.from("competitions").select("*").eq("id", id).single();
  return data ?? null;
}

async function fetchCompetitionVideos(competitionId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("purpose", "competition")
    .eq("submitted_competition_id", competitionId)
    .eq("visibility", "public")
    .order("view_count", { ascending: false });
  if (error) console.error("[fetchCompetitionVideos]", error);
  // Attach uploader display_name / avatar_url via public_profiles.
  // Returns raw rows (snake_case) — CompetitionDetailClient owns its own
  // row→AppVideo mapping via competitionRowToAppVideo().
  return await mergeVideoRows((data ?? []) as Parameters<typeof mapVideo>[0][]);
}

async function fetchFeaturedVideos(competitionId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("purpose", "competition")
    .eq("submitted_competition_id", competitionId)
    .eq("visibility", "public")
    .eq("is_competition_featured", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchFeaturedVideos]", error);
    return [];
  }

  return await mergeVideoRows((data ?? []) as Parameters<typeof mapVideo>[0][]);
}

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [competition, videos, featuredVideos, entryCounts, winners] =
    await Promise.all([
      fetchCompetitionById(id),
      fetchCompetitionVideos(id),
      fetchFeaturedVideos(id),
      fetchCompetitionEntryCounts(id),
      fetchCompetitionWinners(id),
    ]);
  if (!competition) notFound();

  return (
    <CompetitionDetailClient
      competition={competition}
      videos={videos}
      featuredVideos={featuredVideos}
      entryCount={entryCounts.eligibleCount}
      winnersAnnounced={winners.length > 0}
    />
  );
}
