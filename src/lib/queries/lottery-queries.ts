import { createServerSupabaseClient } from "@/lib/supabase/server";

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
