import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin-side aggregate reads for the GLOBAL MONTHLY lottery panel.
 * 응모권은 공모전별이 아니라 매월 전체 풀에서 추첨 — 모든 집계는
 * draw_month_key(KST YYYY-MM) 기준.
 *
 * Caller must already be admin (requireAdminWithService for actions,
 * /admin route gate for the page loader) and pass the service-role
 * client.
 */

/** Current KST month key (YYYY-MM) — matches entry_tickets.month_key. */
export function currentMonthKey(): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const y = p.find((x) => x.type === "year")?.value;
  const m = p.find((x) => x.type === "month")?.value;
  return `${y}-${m}`;
}

export type LotteryMonthlySummary = {
  monthKey: string;
  /** Total tickets issued this month (whole pool). */
  poolCount: number;
  /** Distinct users with at least one ticket this month. */
  poolUserCount: number;
  winnersDrawn: boolean;
  winners: {
    pending: number;
    submitted: number;
    confirmed: number;
    paid: number;
    expired: number;
    invalidated: number;
  };
  paidUsdTotal: number;
  liveUsdTotal: number;
};

/**
 * Current-month pool + winner-state breakdown for the admin draw
 * panel.  Single object (one global monthly draw).
 */
export async function fetchLotteryMonthlySummary(
  service: SupabaseClient,
): Promise<LotteryMonthlySummary> {
  const monthKey = currentMonthKey();

  const [
    { data: tickets, error: ticketsErr },
    { data: winnerRows, error: winnersErr },
  ] = await Promise.all([
    service
      .from("entry_tickets")
      .select("user_id")
      .eq("month_key", monthKey),
    service
      .from("competition_winners")
      .select("claim_status, prize_amount_usd")
      .eq("draw_month_key", monthKey),
  ]);

  if (ticketsErr)
    console.error(
      `[lottery-summary] entry_tickets query failed (month_key=${monthKey}):`,
      ticketsErr.message,
      ticketsErr.details ?? "",
    );
  if (winnersErr)
    console.error(
      `[lottery-summary] competition_winners query failed (draw_month_key=${monthKey}):`,
      winnersErr.message,
      winnersErr.details ?? "",
    );

  const poolCount = tickets?.length ?? 0;

  // Decisive diagnostic: if poolCount is 0, is it RLS (admin client
  // can't see ANY rows) or a month_key mismatch (rows exist under a
  // different key)?  One extra unfiltered probe answers it.
  if (poolCount === 0) {
    const { data: probe, error: probeErr } = await service
      .from("entry_tickets")
      .select("month_key")
      .limit(50);
    console.error(
      `[lottery-summary] poolCount=0 for jsMonthKey=${monthKey}. ` +
        `unfilteredVisibleRows=${probe?.length ?? 0} ` +
        `distinctMonthKeys=${JSON.stringify([
          ...new Set((probe ?? []).map((r) => r.month_key as string)),
        ])} ` +
        `probeErr=${probeErr?.message ?? "none"}`,
    );
  }

  const poolUserCount = new Set(
    (tickets ?? []).map((t) => t.user_id as string),
  ).size;

  const winners = {
    pending: 0,
    submitted: 0,
    confirmed: 0,
    paid: 0,
    expired: 0,
    invalidated: 0,
  };
  let paidUsdTotal = 0;
  let liveUsdTotal = 0;
  for (const w of winnerRows ?? []) {
    const status = w.claim_status as keyof typeof winners;
    if (status in winners) winners[status] += 1;
    const amount = Number(w.prize_amount_usd ?? 0) || 0;
    if (status === "paid") paidUsdTotal += amount;
    if (status !== "invalidated") liveUsdTotal += amount;
  }
  const winnersDrawn =
    winners.pending +
      winners.submitted +
      winners.confirmed +
      winners.paid +
      winners.expired >
    0;

  return {
    monthKey,
    poolCount,
    poolUserCount,
    winnersDrawn,
    winners,
    paidUsdTotal,
    liveUsdTotal,
  };
}

// ===================================================================
// Winner workflow rows.
// ===================================================================

export type LotteryWinnerWorkRow = {
  winnerId: string;
  drawMonthKey: string;
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
 * Every live winner + (optional) submitted info row for the admin
 * workflow table.  Filters invalidated (visible in audit instead).
 */
export async function fetchLotteryWinnersWorkQueue(
  service: SupabaseClient,
): Promise<LotteryWinnerWorkRow[]> {
  const { data: winners } = await service
    .from("competition_winners")
    .select(
      "id, draw_month_key, user_id, prize_tier, prize_amount_usd, claim_status, drawn_at, info_deadline",
    )
    .neq("claim_status", "invalidated")
    .order("drawn_at", { ascending: false });

  if (!winners || winners.length === 0) return [];

  const winnerIds = winners.map((w) => w.id as string);
  const userIds = [...new Set(winners.map((w) => w.user_id as string))];

  const [{ data: infos }, { data: profiles }] = await Promise.all([
    service.from("winner_info").select("*").in("winner_id", winnerIds),
    service
      .from("public_profiles")
      .select("id, display_name")
      .in("id", userIds),
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

  return winners.map((w) => {
    const info = infoMap.get(w.id as string) as
      | Record<string, unknown>
      | undefined;
    return {
      winnerId: w.id as string,
      drawMonthKey: w.draw_month_key as string,
      userId: w.user_id as string,
      userDisplayName: profileMap.get(w.user_id as string) ?? null,
      userEmail: null,
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
  drawMonthKey: string;
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
      "id, draw_month_key, drawn_at, drawn_by, seed_value, eligible_entry_count, eligible_user_count, is_redraw, redraw_prize_tier, redraw_reason",
    )
    .order("drawn_at", { ascending: false })
    .limit(limit);

  if (!rows || rows.length === 0) return [];

  return rows.map((r) => ({
    id: r.id as string,
    drawMonthKey: r.draw_month_key as string,
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
