import { createServerSupabaseClient } from "@/lib/supabase/server";

// ===================================================================
// Competition-side reads (Phase 4).  All hit `security_invoker=false`
// owner-runs views, so RLS on the underlying tables is bypassed and
// anonymous / authenticated callers see the same data.
// ===================================================================

/** Aggregate counts for the "총 응모 수: N" badge on competition pages. */
export type CompetitionEntryCounts = {
  /** Number of `competition_entries` rows still flagged eligible. */
  eligibleCount: number;
  /** Number of distinct tickets entered.  Same as eligibleCount under
   *  current logic (UNIQUE constraint), kept for forward compat. */
  ticketCount: number;
};

/**
 * Reads the public_competition_entry_counts aggregate view.
 * Returns zero-counts when the view has no row (no entries yet).
 */
export async function fetchCompetitionEntryCounts(
  competitionId: string,
): Promise<CompetitionEntryCounts> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { eligibleCount: 0, ticketCount: 0 };

  const { data } = await supabase
    .from("public_competition_entry_counts")
    .select("eligible_count, ticket_count")
    .eq("competition_id", competitionId)
    .maybeSingle();

  return {
    eligibleCount: (data?.eligible_count as number | undefined) ?? 0,
    ticketCount: (data?.ticket_count as number | undefined) ?? 0,
  };
}

/**
 * Global count of entry tickets issued in the current KST month.
 * Reads the owner-runs `public_monthly_pool_count` view (single row).
 * 응모권은 공모전별이 아니라 전체 풀 추첨이므로 공모전 페이지의
 * 통계는 이 값을 사용한다.
 */
export async function fetchMonthlyPoolCount(): Promise<number> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return 0;
  const { data } = await supabase
    .from("public_monthly_pool_count")
    .select("ticket_count")
    .maybeSingle();
  return (data?.ticket_count as number | undefined) ?? 0;
}

/** Single drawn winner row as returned by the public_competition_winners view. */
export type LotteryWinner = {
  id: string;
  competitionId: string;
  userId: string;
  entryId: string;
  prizeTier: number;
  prizeAmountUsd: number;
  drawnAt: string;
  claimStatus: string;
  ticketId: string | null;
  videoId: string | null;
};

/**
 * Reads all live (non-invalidated) winners for a competition, ordered
 * by prize_tier ascending so the results page renders 1→5 naturally.
 */
export async function fetchCompetitionWinners(
  competitionId: string,
): Promise<LotteryWinner[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("public_competition_winners")
    .select("*")
    .eq("competition_id", competitionId)
    .order("prize_tier", { ascending: true });

  if (error || !data) return [];

  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    competitionId: row.competition_id as string,
    userId: row.user_id as string,
    entryId: row.entry_id as string,
    prizeTier: row.prize_tier as number,
    prizeAmountUsd: row.prize_amount_usd as number,
    drawnAt: row.drawn_at as string,
    claimStatus: row.claim_status as string,
    ticketId: (row.ticket_id as string | null) ?? null,
    videoId: (row.video_id as string | null) ?? null,
  }));
}

/** Single drawing event from the audit log. */
export type DrawingLog = {
  id: string;
  competitionId: string;
  drawnAt: string;
  seedValue: string;
  eligibleEntryCount: number;
  eligibleUserCount: number;
  isRedraw: boolean;
  redrawOf: string | null;
  redrawPrizeTier: number | null;
};

/**
 * Latest non-redraw drawing event for a competition.  Used as the
 * "추첨 일시" line on the results page.  Returns null when no draw
 * has happened yet.
 */
export async function fetchLatestDrawingLog(
  competitionId: string,
): Promise<DrawingLog | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("drawing_logs")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("is_redraw", false)
    .order("drawn_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id as string,
    competitionId: data.competition_id as string,
    drawnAt: data.drawn_at as string,
    seedValue: data.seed_value as string,
    eligibleEntryCount: data.eligible_entry_count as number,
    eligibleUserCount: data.eligible_user_count as number,
    isRedraw: data.is_redraw as boolean,
    redrawOf: (data.redraw_of as string | null) ?? null,
    redrawPrizeTier: (data.redraw_prize_tier as number | null) ?? null,
  };
}

/**
 * Snapshot of a user's lottery tickets for the current KST month +
 * the reset countdown (days until the next month begins in KST).
 *
 * Total count = active + winner + revoked.  All three count toward
 * the 5-cap (revoked still occupies a slot per the spec penalty
 * rule).  `remaining` = max(0, 5 - total).
 */
export type MonthlyTicketCount = {
  total: number;
  active: number;
  winner: number;
  revoked: number;
  remaining: number;
  resetInDays: number;
  resetAt: string;
};

/**
 * Returns the calling user's `current_month_ticket_counts` row +
 * reset countdown, or null when:
 *   - Supabase isn't configured
 *   - The view returns no row for this user (they have 0 tickets
 *     this month) → we synthesize a zero-count snapshot so the UI
 *     can still render "0/5".
 *
 * The view is `security_invoker = true`, so RLS clips the read to
 * the caller's own row regardless of which `userId` is passed.
 * `userId` is kept as an argument so the caller can short-circuit
 * the round-trip when they know they're not signed in.
 */
export async function fetchMyMonthlyTicketCount(
  userId: string,
): Promise<MonthlyTicketCount | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("current_month_ticket_counts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const total = (data?.total_count as number | undefined) ?? 0;
  const active = (data?.active_count as number | undefined) ?? 0;
  const winner = (data?.winner_count as number | undefined) ?? 0;
  const revoked = (data?.revoked_count as number | undefined) ?? 0;
  const remaining = Math.max(0, 5 - total);

  // KST reset countdown: next month's 1st 00:00 KST converted to UTC.
  // KST = UTC + 9h, so 2026-06-01T00:00 KST = 2026-05-31T15:00 UTC.
  const now = new Date();
  const kstParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const yearKst = Number(kstParts.find((p) => p.type === "year")?.value);
  const monthKst1Based = Number(kstParts.find((p) => p.type === "month")?.value);
  // JS Date.UTC takes 0-indexed months. Intl returns 1-indexed.
  // We want NEXT month's 1st KST → Date.UTC(yearKst, monthKst1Based, 1, 0, 0, 0)
  // already lands on the JS 0-indexed "monthKst1Based" which is "next month"
  // from the KST perspective. Then shift -9h for KST→UTC.
  const resetUtcMs =
    Date.UTC(yearKst, monthKst1Based, 1, 0, 0, 0, 0) - 9 * 3600 * 1000;
  const resetUtc = new Date(resetUtcMs);
  const diffMs = resetUtc.getTime() - now.getTime();
  const resetInDays = Math.max(0, Math.ceil(diffMs / 86_400_000));

  return {
    total,
    active,
    winner,
    revoked,
    remaining,
    resetInDays,
    resetAt: resetUtc.toISOString(),
  };
}
