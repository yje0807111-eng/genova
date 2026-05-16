"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendWinnerNotificationEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { requireAdminWithService } from "@/lib/auth/admin-actions";
import { logAdminAction } from "@/lib/audit";

/**
 * Phase 6-A: admin server actions for the entry-lottery system.
 *
 * Each wraps either a SECURITY DEFINER RPC (draw / redraw — Phase
 * 2A) or a direct service-role UPDATE on the lottery tables.  All
 * gated by `requireAdminWithService()` so the calls inherit the
 * existing ADMIN_EMAILS allow-list + service-role client.
 *
 * Error mapping: RPC errcode-decorated messages are surfaced as the
 * action's `message` field intact — the admin UI is the only
 * caller, so verbose technical text is fine (and useful for
 * diagnostics).
 */

export type AdminResult = { ok: true } | { ok: false; message: string };

/* -----------------------------------------------------------------
 * 1. Trigger initial draw.
 * ---------------------------------------------------------------*/

export async function triggerCompetitionDrawAction(
  competitionId: string,
): Promise<
  AdminResult & {
    drawingLogId?: string;
    winnersCount?: number;
    notifFailed?: number;
    emailFailed?: number;
  }
> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error };

  const { data, error } = await auth.service
    .rpc("draw_competition_winners", {
      p_competition_id: competitionId,
      p_admin_id: auth.user.id,
    })
    .single<{ drawing_log_id: string; winners_count: number }>();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Draw failed" };
  }

  // A1-2: dispatch winner notifications + emails for every freshly-
  // drawn row.  Best-effort — failures here log but don't roll back
  // the draw (winners are already in DB and the cron can re-send if
  // notified_at is still NULL).
  // H2-D.6: surface failure counts to the admin UI so silent partial
  // delivery is visible.
  const dispatch = await dispatchWinnerNotifications(auth.service, competitionId);

  revalidatePath(`/competition/${competitionId}`);
  revalidatePath(`/competition/${competitionId}/results`);
  revalidatePath("/admin");
  return {
    ok: true,
    drawingLogId: data.drawing_log_id,
    winnersCount: data.winners_count,
    notifFailed: dispatch.notifFailed,
    emailFailed: dispatch.emailFailed,
  };
}

/* -----------------------------------------------------------------
 * 2. Redraw a single prize slot.
 * ---------------------------------------------------------------*/

export async function redrawWinnerSlotAction(input: {
  competitionId: string;
  prizeTier: number;
  reason: string;
}): Promise<
  AdminResult & {
    drawingLogId?: string;
    newWinnerId?: string;
    notifFailed?: number;
    emailFailed?: number;
  }
> {
  if (!input.reason.trim())
    return { ok: false, message: "Reason is required for redraw" };

  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error };

  const { data, error } = await auth.service
    .rpc("redraw_winner_slot", {
      p_competition_id: input.competitionId,
      p_prize_tier: input.prizeTier,
      p_reason: input.reason.trim(),
      p_admin_id: auth.user.id,
    })
    .single<{ drawing_log_id: string; new_winner_id: string }>();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Redraw failed" };
  }

  // A1-2: dispatch notification + email for the replacement winner.
  // dispatchWinnerNotifications filters on notified_at IS NULL so it
  // only hits the new row, not the prior (already-invalidated) one.
  // H2-D.6: surface failure counts.
  const dispatch = await dispatchWinnerNotifications(auth.service, input.competitionId);

  await logAdminAction(auth.service, auth.user, "lottery.redrawWinnerSlot", {
    type: "competition",
    id: input.competitionId,
    detail: {
      prizeTier: input.prizeTier,
      reason: input.reason.trim(),
      drawingLogId: data.drawing_log_id,
      newWinnerId: data.new_winner_id,
    },
  });

  revalidatePath(`/competition/${input.competitionId}`);
  revalidatePath(`/competition/${input.competitionId}/results`);
  revalidatePath("/admin");
  return {
    ok: true,
    drawingLogId: data.drawing_log_id,
    newWinnerId: data.new_winner_id,
    notifFailed: dispatch.notifFailed,
    emailFailed: dispatch.emailFailed,
  };
}

/* -----------------------------------------------------------------
 * 3. Mark winner_info as admin-verified (claim_status pending /
 *    submitted → confirmed).
 * ---------------------------------------------------------------*/

export async function markWinnerInfoVerifiedAction(input: {
  winnerId: string;
  notes?: string;
}): Promise<AdminResult> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error };

  const now = new Date().toISOString();

  // Update winner_info first; if it doesn't exist for this winner,
  // bail before flipping claim_status (consistency).
  const { error: infoErr } = await auth.service
    .from("winner_info")
    .update({
      admin_verified: true,
      admin_verified_at: now,
      admin_verified_by: auth.user.id,
      admin_notes: input.notes ?? null,
    })
    .eq("winner_id", input.winnerId);
  if (infoErr) return { ok: false, message: infoErr.message };

  const { error: winnerErr } = await auth.service
    .from("competition_winners")
    .update({ claim_status: "confirmed" })
    .eq("id", input.winnerId)
    .in("claim_status", ["submitted", "pending"]);
  if (winnerErr) return { ok: false, message: winnerErr.message };

  revalidatePath("/admin");
  return { ok: true };
}

/* -----------------------------------------------------------------
 * 4. Mark winner_info as paid (claim_status confirmed → paid).
 * ---------------------------------------------------------------*/

export async function markWinnerInfoPaidAction(input: {
  winnerId: string;
  paymentReference: string;
}): Promise<AdminResult> {
  if (!input.paymentReference.trim())
    return { ok: false, message: "Payment reference is required" };

  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error };

  const now = new Date().toISOString();

  const { error: infoErr } = await auth.service
    .from("winner_info")
    .update({
      paid_at: now,
      payment_reference: input.paymentReference.trim(),
    })
    .eq("winner_id", input.winnerId);
  if (infoErr) return { ok: false, message: infoErr.message };

  const { error: winnerErr } = await auth.service
    .from("competition_winners")
    .update({ claim_status: "paid" })
    .eq("id", input.winnerId)
    .in("claim_status", ["confirmed", "submitted"]);
  if (winnerErr) return { ok: false, message: winnerErr.message };

  await logAdminAction(auth.service, auth.user, "lottery.markWinnerPaid", {
    type: "winner",
    id: input.winnerId,
    detail: { paymentReference: input.paymentReference.trim() },
  });

  revalidatePath("/admin");
  return { ok: true };
}

/* -----------------------------------------------------------------
 * 5. Revoke an entry ticket.  Used when admin confirms a report-
 *    based violation OR for manual cleanup (account abuse, etc).
 *    Sets ticket to status='revoked' + competition_entries flipped
 *    to eligible=false so the ticket exits all future draws.
 * ---------------------------------------------------------------*/

export type RevokeReason =
  | "report_violation"
  | "admin_manual"
  | "account_inactive";

/**
 * Convenience wrapper used by the report-management UI: looks up
 * the ticket attached to a video (UNIQUE(video_id) → at most one
 * row) and revokes it.  Returns `ok:true` with a `ticketId` so the
 * caller can show a confirmation, or `ok:false` with
 * `reason='no_ticket'` when the uploader never earned one.
 */
export async function revokeEntryTicketByVideoAction(input: {
  videoId: string;
  reason: RevokeReason;
}): Promise<AdminResult & { ticketId?: string }> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error };

  // UNIQUE(video_id) on entry_tickets means at most one match.
  const { data, error } = await auth.service
    .from("entry_tickets")
    .select("id, status")
    .eq("video_id", input.videoId)
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: "no_ticket" };
  if (data.status === "revoked")
    return { ok: false, message: "already_revoked" };

  const result = await revokeEntryTicketAction({
    ticketId: data.id as string,
    reason: input.reason,
  });
  if (!result.ok) return result;
  return { ok: true, ticketId: data.id as string };
}

export async function revokeEntryTicketAction(input: {
  ticketId: string;
  reason: RevokeReason;
}): Promise<AdminResult> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error };

  const now = new Date().toISOString();

  // Flip the ticket itself.  status + revoked_reason CHECK constraints
  // enforce the valid set in Phase 1.
  const { error: ticketErr } = await auth.service
    .from("entry_tickets")
    .update({
      status: "revoked",
      revoked_reason: input.reason,
      revoked_at: now,
    })
    .eq("id", input.ticketId);
  if (ticketErr) return { ok: false, message: ticketErr.message };

  // Disqualify the ticket from any pending draws.  Entries that
  // already produced a winner row keep that row — the redraw flow
  // handles the post-payment cases manually.
  const { error: entriesErr } = await auth.service
    .from("competition_entries")
    .update({ eligible: false })
    .eq("ticket_id", input.ticketId);
  if (entriesErr) return { ok: false, message: entriesErr.message };

  await logAdminAction(auth.service, auth.user, "lottery.revokeEntryTicket", {
    type: "entry_ticket",
    id: input.ticketId,
    detail: { reason: input.reason },
  });

  revalidatePath("/admin");
  return { ok: true };
}

/* -----------------------------------------------------------------
 * Internal helper: winner notification dispatch.
 * ---------------------------------------------------------------*/

/**
 * Looks up freshly-drawn (or freshly-redrawn) winners for a
 * competition — identified by `notified_at IS NULL` — and dispatches
 * the in-app notification + email pair for each.  Marks
 * `notified_at = now()` after each successful row so re-running is
 * idempotent.
 *
 * Best-effort throughout: per-winner failures are logged but don't
 * abort the loop, and the function as a whole never throws to the
 * caller (a successful draw should not be "rolled back" because of
 * a transient Resend / notifications issue — the cron / admin can
 * recover by re-issuing manually).
 */
/** H2-D.6 result shape — surfaced to admin UI so failed notifications
 *  aren't silently swallowed. */
type NotificationDispatchResult = {
  attempted: number;
  notifFailed: number;
  emailFailed: number;
};

async function dispatchWinnerNotifications(
  service: SupabaseClient,
  competitionId: string,
): Promise<NotificationDispatchResult> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://genova-silk.vercel.app";

  // Pull undelivered winners + the joined competition title + the
  // recipient's email (auth.users via the public_profiles view doesn't
  // expose email — go through the auth admin API helper indirectly
  // by reading the JSON column on auth.users via service-role).
  const { data: winners, error } = await service
    .from("competition_winners")
    .select(
      "id, user_id, prize_tier, prize_amount_usd, claim_token, info_deadline, claim_status",
    )
    .eq("competition_id", competitionId)
    .is("notified_at", null)
    .neq("claim_status", "invalidated");

  if (error) {
    console.error("[lottery-admin] notify lookup failed", error);
    return { attempted: 0, notifFailed: 0, emailFailed: 0 };
  }
  if (!winners || winners.length === 0) {
    return { attempted: 0, notifFailed: 0, emailFailed: 0 };
  }

  // Resolve title (locale-neutral fallback — Resend body doesn't
  // need full i18n; the in-app notification href surfaces the
  // localized version naturally).
  const { data: comp } = await service
    .from("competitions")
    .select("title")
    .eq("id", competitionId)
    .single();
  const competitionTitle = (comp?.title as string | undefined) ?? "competition";

  // Resolve emails for all winner user_ids in one shot via the
  // auth admin API (service-role only).
  const emailByUserId = new Map<string, string>();
  for (const w of winners) {
    try {
      const { data: u } = await service.auth.admin.getUserById(
        w.user_id as string,
      );
      const email = u?.user?.email ?? null;
      if (email) emailByUserId.set(w.user_id as string, email);
    } catch (e) {
      console.error("[lottery-admin] getUserById failed", w.user_id, e);
    }
  }

  // Dispatch.  H2-D.6: count failures per channel.
  let notifFailed = 0;
  let emailFailed = 0;
  for (const w of winners) {
    const winnerId = w.id as string;
    const userId = w.user_id as string;
    const token = w.claim_token as string;
    const claimUrl = `${siteUrl}/winners/claim/${token}`;

    // In-app notification.  href carries the claim URL — same
    // security model as the email (RLS clips notifications to own
    // user, transit is HTTPS, the token IS the auth).
    const notifResult = await createNotification({
      userId,
      actorId: null,
      type: "lottery_winner",
      title: "🎉 You won the Genova lottery",
      body: `Tier ${w.prize_tier} · $${w.prize_amount_usd} USD — claim within 1 month.`,
      href: `/winners/claim/${token}`,
      entityType: "competition_winner",
      entityId: winnerId,
      // F1: structured fields for the locale-aware body in
      // notifications-i18n.ts.  claim_token intentionally OMITTED —
      // CLAUDE.md security policy (#7): the token is URL-only and
      // must not appear in logs or row metadata.  The href already
      // carries it.
      metadata: { prize_tier: w.prize_tier, prize_amount_usd: w.prize_amount_usd },
    });
    if (notifResult.error) {
      notifFailed += 1;
      console.error("[lottery-admin] notif insert failed", winnerId, notifResult.error);
    }

    // Email (skipped silently if RESEND_API_KEY isn't configured).
    const email = emailByUserId.get(userId);
    if (email) {
      try {
        const sent = await sendWinnerNotificationEmail({
          to: email,
          competitionTitle,
          prizeTier: w.prize_tier as number,
          prizeAmountUsd: w.prize_amount_usd as number,
          claimUrl,
          deadlineIso: w.info_deadline as string,
        });
        if (sent === false) emailFailed += 1;
      } catch (e) {
        emailFailed += 1;
        console.error("[lottery-admin] email send failed", winnerId, e);
      }
    }

    // Mark dispatched so a follow-up trigger (or this fn re-running)
    // doesn't double-send.
    const { error: stampErr } = await service
      .from("competition_winners")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", winnerId);
    if (stampErr) {
      console.error("[lottery-admin] notified_at update failed", winnerId, stampErr);
    }
  }

  return { attempted: winners.length, notifFailed, emailFailed };
}

/* -----------------------------------------------------------------
 * G6: CSV export of the winner work queue.
 *
 * Operators need to hand winner + payout info to accounting / tax
 * teams, and the admin table doesn't expose every field in a
 * spreadsheet-friendly form.  This action joins competition_winners
 * + winner_info + competitions + public_profiles and returns the
 * data as a CSV string the browser downloads as a Blob.
 *
 * Security:
 *   - admin-gated via requireAdminWithService()
 *   - claim_token deliberately EXCLUDED per CLAUDE.md security
 *     policy (#7) — the token is URL-only.
 *   - includes paymentEmail / legalName / paymentReference which
 *     ARE the operational point of the export (accounting needs
 *     them).  Treat the resulting file as PII.
 * ---------------------------------------------------------------*/

export async function exportLotteryWinnersCsvAction(): Promise<
  | { ok: true; csv: string; filename: string }
  | { ok: false; message: string }
> {
  const auth = await requireAdminWithService();
  if ("error" in auth) return { ok: false, message: auth.error };
  const { service } = auth;

  const { data: winners, error } = await service
    .from("competition_winners")
    .select(
      "id, competition_id, user_id, prize_tier, prize_amount_usd, claim_status, drawn_at, info_deadline, notified_at",
    )
    .neq("claim_status", "invalidated")
    .order("drawn_at", { ascending: false });
  if (error) return { ok: false, message: error.message };
  if (!winners || winners.length === 0) {
    return { ok: false, message: "No winners to export." };
  }

  const winnerIds = winners.map((w) => w.id as string);
  const userIds = [...new Set(winners.map((w) => w.user_id as string))];
  const compIds = [...new Set(winners.map((w) => w.competition_id as string))];

  const [infoRes, profileRes, compRes] = await Promise.all([
    service.from("winner_info").select("*").in("winner_id", winnerIds),
    service.from("public_profiles").select("id, display_name").in("id", userIds),
    service.from("competitions").select("id, title").in("id", compIds),
  ]);

  const infoMap = new Map(
    (infoRes.data ?? []).map((r) => [r.winner_id as string, r as Record<string, unknown>]),
  );
  const profileMap = new Map(
    (profileRes.data ?? []).map((p) => [p.id as string, (p.display_name as string | null) ?? ""]),
  );
  const compMap = new Map(
    (compRes.data ?? []).map((c) => [c.id as string, (c.title as string) ?? ""]),
  );

  // CSV-safe escape: wrap in quotes + double internal quotes.
  // Conservative — we wrap every field, never depend on the value
  // being "safe".
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    return `"${String(v).replace(/"/g, '""')}"`;
  };

  const headers = [
    "winner_id",
    "competition_title",
    "competition_id",
    "user_id",
    "display_name",
    "prize_tier",
    "prize_amount_usd",
    "claim_status",
    "drawn_at",
    "info_deadline",
    "notified_at",
    "legal_name",
    "country",
    "contact_extra",
    "payment_method",
    "payment_email",
    "payment_currency",
    "submitted_at",
    "admin_verified",
    "admin_verified_at",
    "admin_notes",
    "paid_at",
    "payment_reference",
  ];

  const rows = winners.map((w) => {
    const winnerId = w.id as string;
    const info = infoMap.get(winnerId) ?? {};
    return [
      winnerId,
      compMap.get(w.competition_id as string) ?? "",
      w.competition_id,
      w.user_id,
      profileMap.get(w.user_id as string) ?? "",
      w.prize_tier,
      w.prize_amount_usd,
      w.claim_status,
      w.drawn_at,
      w.info_deadline,
      (w as Record<string, unknown>).notified_at ?? "",
      info.legal_name ?? "",
      info.country ?? "",
      info.contact_extra ?? "",
      info.payment_method ?? "",
      info.payment_email ?? "",
      info.payment_currency ?? "",
      info.submitted_at ?? "",
      info.admin_verified ?? "",
      info.admin_verified_at ?? "",
      info.admin_notes ?? "",
      info.paid_at ?? "",
      info.payment_reference ?? "",
    ];
  });

  const csv = [
    headers.map(esc).join(","),
    ...rows.map((r) => r.map(esc).join(",")),
  ].join("\n");

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return { ok: true, csv, filename: `lottery-winners-${stamp}.csv` };
}
