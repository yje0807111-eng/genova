"use server";

import { revalidatePath } from "next/cache";
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
