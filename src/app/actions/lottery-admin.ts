"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendWinnerNotificationEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { requireAdminWithService } from "@/lib/auth/admin-actions";

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
): Promise<AdminResult & { drawingLogId?: string; winnersCount?: number }> {
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
  await dispatchWinnerNotifications(auth.service, competitionId);

  revalidatePath(`/competition/${competitionId}`);
  revalidatePath(`/competition/${competitionId}/results`);
  revalidatePath("/admin");
  return {
    ok: true,
    drawingLogId: data.drawing_log_id,
    winnersCount: data.winners_count,
  };
}

/* -----------------------------------------------------------------
 * 2. Redraw a single prize slot.
 * ---------------------------------------------------------------*/

export async function redrawWinnerSlotAction(input: {
  competitionId: string;
  prizeTier: number;
  reason: string;
}): Promise<AdminResult & { drawingLogId?: string; newWinnerId?: string }> {
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
  await dispatchWinnerNotifications(auth.service, input.competitionId);

  revalidatePath(`/competition/${input.competitionId}`);
  revalidatePath(`/competition/${input.competitionId}/results`);
  revalidatePath("/admin");
  return {
    ok: true,
    drawingLogId: data.drawing_log_id,
    newWinnerId: data.new_winner_id,
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
async function dispatchWinnerNotifications(
  service: SupabaseClient,
  competitionId: string,
) {
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
    return;
  }
  if (!winners || winners.length === 0) return;

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

  // Dispatch.
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
    });
    if (notifResult.error) {
      console.error("[lottery-admin] notif insert failed", winnerId, notifResult.error);
    }

    // Email (skipped silently if RESEND_API_KEY isn't configured).
    const email = emailByUserId.get(userId);
    if (email) {
      await sendWinnerNotificationEmail({
        to: email,
        competitionTitle,
        prizeTier: w.prize_tier as number,
        prizeAmountUsd: w.prize_amount_usd as number,
        claimUrl,
        deadlineIso: w.info_deadline as string,
      });
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
}
