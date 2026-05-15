import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin-side aggregate reads for the lottery panel.  All these
 * functions assume the caller has already proven admin (via
 * `requireAdminWithService()` for actions, or the /admin route's
 * isAdminEmail check for the page loader) and is passing in the
 * service-role client.
 *
 * They live in `src/lib/queries/` for parity with the rest of the
 * codebase but the read patterns are admin-specific — we surface
 * per-status winner counts + recent drawing log rows that
 * non-admin views never need.
 */

export type LotteryCompetitionSummary = {
  id: string;
  title: string;
  status: string;
  deadline: string;
  entryCount: number;
  winnersDrawn: boolean;
  winners: {
    pending: number;
    submitted: number;
    confirmed: number;
    paid: number;
    expired: number;
    invalidated: number;
  };
};

/**
 * Lists every competition + its entry count + winner state breakdown.
 * Two reads: one for entry counts (aggregate view), one for winners
 * (raw rows grouped client-side because the public view filters
 * invalidated rows we still want to count).
 */
export async function fetchLotteryCompetitionSummaries(
  service: SupabaseClient,
): Promise<LotteryCompetitionSummary[]> {
  const [{ data: compRows }, { data: entryRows }, { data: winnerRows }] =
    await Promise.all([
      service
        .from("competitions")
        .select("id, title, status, deadline")
        .order("deadline", { ascending: false }),
      service
        .from("public_competition_entry_counts")
        .select("competition_id, eligible_count"),
      service
        .from("competition_winners")
        .select("competition_id, claim_status"),
    ]);

  const entryMap = new Map<string, number>();
  for (const r of entryRows ?? []) {
    entryMap.set(r.competition_id as string, (r.eligible_count as number) ?? 0);
  }

  // Group winners by competition_id + claim_status.
  const winnerBuckets = new Map<
    string,
    LotteryCompetitionSummary["winners"]
  >();
  for (const w of winnerRows ?? []) {
    const cid = w.competition_id as string;
    const status = w.claim_status as keyof LotteryCompetitionSummary["winners"];
    const bucket = winnerBuckets.get(cid) ?? {
      pending: 0,
      submitted: 0,
      confirmed: 0,
      paid: 0,
      expired: 0,
      invalidated: 0,
    };
    if (status in bucket) bucket[status] += 1;
    winnerBuckets.set(cid, bucket);
  }

  return (compRows ?? []).map((c) => {
    const bucket =
      winnerBuckets.get(c.id as string) ?? {
        pending: 0,
        submitted: 0,
        confirmed: 0,
        paid: 0,
        expired: 0,
        invalidated: 0,
      };
    const liveCount =
      bucket.pending +
      bucket.submitted +
      bucket.confirmed +
      bucket.paid +
      bucket.expired;
    return {
      id: c.id as string,
      title: c.title as string,
      status: c.status as string,
      deadline: c.deadline as string,
      entryCount: entryMap.get(c.id as string) ?? 0,
      winnersDrawn: liveCount > 0,
      winners: bucket,
    };
  });
}

// ===================================================================
// Winner workflow rows (Phase 6-C consumes these).
// ===================================================================

export type LotteryWinnerWorkRow = {
  winnerId: string;
  competitionId: string;
  competitionTitle: string;
  userId: string;
  userDisplayName: string | null;
  userEmail: string | null;
  prizeTier: number;
  prizeAmountUsd: number;
  claimStatus: string;
  drawnAt: string;
  infoDeadline: string;
  info: {
    legalName: string;
    country: string;
    contactExtra: string;
    paymentMethod: string;
    paymentEmail: string;
    paymentCurrency: string | null;
    submittedAt: string;
    submittedIp: string | null;
    adminVerified: boolean;
    adminVerifiedAt: string | null;
    adminNotes: string | null;
    paidAt: string | null;
    paymentReference: string | null;
  } | null;
};

/**
 * Pulls every winner + (optional) submitted info row in one bundle,
 * suitable for the admin workflow table.  Filters out invalidated
 * rows by default (those are visible in the audit log instead).
 *
 * Joins through public_profiles for the display name and auth.users
 * for the email — both are admin-relevant sanity checks ("does the
 * payment_email match the registered email?").
 */
export async function fetchLotteryWinnersWorkQueue(
  service: SupabaseClient,
): Promise<LotteryWinnerWorkRow[]> {
  const { data: winners } = await service
    .from("competition_winners")
    .select(
      "id, competition_id, user_id, prize_tier, prize_amount_usd, claim_status, drawn_at, info_deadline",
    )
    .neq("claim_status", "invalidated")
    .order("drawn_at", { ascending: false });

  if (!winners || winners.length === 0) return [];

  const winnerIds = winners.map((w) => w.id as string);
  const userIds = [...new Set(winners.map((w) => w.user_id as string))];
  const compIds = [...new Set(winners.map((w) => w.competition_id as string))];

  const [{ data: infos }, { data: profiles }, { data: comps }, usersRes] =
    await Promise.all([
      service.from("winner_info").select("*").in("winner_id", winnerIds),
      service
        .from("public_profiles")
        .select("id, display_name")
        .in("id", userIds),
      service.from("competitions").select("id, title").in("id", compIds),
      // auth.users not exposed via Supabase REST.  Use the admin
      // helper instead — but that's per-user only.  Settle for null
      // emails when admin needs to manually look up via dashboard.
      // (We could add an admin RPC but the workload here is low.)
      Promise.resolve({ data: [] as { id: string; email: string | null }[] }),
    ]);

  const infoMap = new Map(
    (infos ?? []).map((r) => [r.winner_id as string, r]),
  );
  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      (p.display_name as string | null) ?? null,
    ]),
  );
  const compMap = new Map(
    (comps ?? []).map((c) => [c.id as string, c.title as string]),
  );
  const emailMap = new Map(
    (usersRes.data ?? []).map((u) => [u.id, u.email]),
  );

  return winners.map((w) => {
    const info = infoMap.get(w.id as string) as
      | Record<string, unknown>
      | undefined;
    return {
      winnerId: w.id as string,
      competitionId: w.competition_id as string,
      competitionTitle: compMap.get(w.competition_id as string) ?? "(unknown)",
      userId: w.user_id as string,
      userDisplayName: profileMap.get(w.user_id as string) ?? null,
      userEmail: emailMap.get(w.user_id as string) ?? null,
      prizeTier: w.prize_tier as number,
      prizeAmountUsd: w.prize_amount_usd as number,
      claimStatus: w.claim_status as string,
      drawnAt: w.drawn_at as string,
      infoDeadline: w.info_deadline as string,
      info: info
        ? {
            legalName: (info.legal_name as string) ?? "",
            country: (info.country as string) ?? "",
            contactExtra: (info.contact_extra as string) ?? "",
            paymentMethod: (info.payment_method as string) ?? "",
            paymentEmail: (info.payment_email as string) ?? "",
            paymentCurrency: (info.payment_currency as string | null) ?? null,
            submittedAt: (info.submitted_at as string) ?? "",
            submittedIp: (info.submitted_ip as string | null) ?? null,
            adminVerified: Boolean(info.admin_verified),
            adminVerifiedAt: (info.admin_verified_at as string | null) ?? null,
            adminNotes: (info.admin_notes as string | null) ?? null,
            paidAt: (info.paid_at as string | null) ?? null,
            paymentReference:
              (info.payment_reference as string | null) ?? null,
          }
        : null,
    };
  });
}

// ===================================================================
// Drawing log audit rows.
// ===================================================================

export type LotteryAuditRow = {
  id: string;
  competitionId: string;
  competitionTitle: string;
  drawnAt: string;
  drawnBy: string | null;
  seedValue: string;
  eligibleEntryCount: number;
  eligibleUserCount: number;
  isRedraw: boolean;
  redrawPrizeTier: number | null;
  redrawReason: string | null;
};

export async function fetchLotteryDrawingLogs(
  service: SupabaseClient,
  limit = 50,
): Promise<LotteryAuditRow[]> {
  const { data: rows } = await service
    .from("drawing_logs")
    .select(
      "id, competition_id, drawn_at, drawn_by, seed_value, eligible_entry_count, eligible_user_count, is_redraw, redraw_prize_tier, redraw_reason",
    )
    .order("drawn_at", { ascending: false })
    .limit(limit);

  if (!rows || rows.length === 0) return [];

  const compIds = [...new Set(rows.map((r) => r.competition_id as string))];
  const { data: comps } = await service
    .from("competitions")
    .select("id, title")
    .in("id", compIds);
  const titleMap = new Map(
    (comps ?? []).map((c) => [c.id as string, c.title as string]),
  );

  return rows.map((r) => ({
    id: r.id as string,
    competitionId: r.competition_id as string,
    competitionTitle:
      titleMap.get(r.competition_id as string) ?? "(unknown)",
    drawnAt: r.drawn_at as string,
    drawnBy: (r.drawn_by as string | null) ?? null,
    seedValue: r.seed_value as string,
    eligibleEntryCount: r.eligible_entry_count as number,
    eligibleUserCount: r.eligible_user_count as number,
    isRedraw: r.is_redraw as boolean,
    redrawPrizeTier: (r.redraw_prize_tier as number | null) ?? null,
    redrawReason: (r.redraw_reason as string | null) ?? null,
  }));
}
