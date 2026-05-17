"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { sendWinnerCodeEmail } from "@/lib/email";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

/**
 * Server actions for the winner claim flow (Phase 5-B).
 *
 * All three actions wrap the matching SECURITY DEFINER RPC from
 * Phase 5-A (request_winner_email_code / verify_winner_email_code
 * / submit_winner_info) plus side effects (email dispatch, IP
 * capture, path revalidation).  Each uses the SERVICE-ROLE Supabase
 * client because:
 *   - the RPCs are revoked-from-public and granted to service_role
 *     only — they expose claim tokens / codes / PII that must not
 *     ride through the user-session client where another middleware
 *     might log them.
 *   - the claim flow is gated by the cryptographic claim_token
 *     itself, not by `auth.uid()`, so a service-role call with the
 *     token is exactly the right authorization model.
 *
 * Errors raised by the RPCs are converted to short `reason` strings
 * for the UI (see `mapRpcError`).
 */

export type ClaimActionResult<T> =
  | ({ ok: true } & T)
  | { ok: false; reason: string };

/* -----------------------------------------------------------------
 * 1. Request a fresh 6-digit code (sends the email).
 * ---------------------------------------------------------------*/

export async function requestWinnerEmailCodeAction(
  token: string,
): Promise<ClaimActionResult<{ expiresAt: string }>> {
  const trimmed = token.trim();
  if (!trimmed) return { ok: false, reason: "missing_token" };

  const service = createServiceSupabaseClient();
  if (!service) return { ok: false, reason: "service_unavailable" };

  const { data, error } = await service
    .rpc("request_winner_email_code", { p_claim_token: trimmed })
    .single<{
      verification_id: string;
      code: string;
      expires_at: string;
      winner_id: string;
      user_email: string;
    }>();

  if (error || !data) return mapRpcError(error?.message);

  // Best-effort email send.  Returning ok:true even if the email
  // fails would mislead the user — but raising would expose
  // RESEND_API_KEY misconfiguration to the public.  Compromise: log
  // server-side, return a soft "email_dispatch_failed" reason that
  // the UI can show alongside an admin-contact prompt.
  const sent = await sendWinnerCodeEmail({
    to: data.user_email,
    code: data.code,
    expiresAt: data.expires_at,
  });
  if (!sent) return { ok: false, reason: "email_dispatch_failed" };

  return { ok: true, expiresAt: data.expires_at };
}

/* -----------------------------------------------------------------
 * 2. Verify the user-entered code.
 * ---------------------------------------------------------------*/

export async function verifyWinnerEmailCodeAction(
  token: string,
  code: string,
): Promise<ClaimActionResult<{ verified: boolean }>> {
  const trimmedToken = token.trim();
  const trimmedCode = code.trim();
  if (!trimmedToken) return { ok: false, reason: "missing_token" };
  if (!/^[0-9]{6}$/.test(trimmedCode))
    return { ok: false, reason: "invalid_code_format" };

  const service = createServiceSupabaseClient();
  if (!service) return { ok: false, reason: "service_unavailable" };

  const { data, error } = await service.rpc("verify_winner_email_code", {
    p_claim_token: trimmedToken,
    p_code: trimmedCode,
  });

  if (error) return mapRpcError(error.message);
  return { ok: true, verified: data === true };
}

/* -----------------------------------------------------------------
 * 3. Submit winner info (final step).
 * ---------------------------------------------------------------*/

export type WinnerInfoSubmission = {
  legalName: string;
  country: string;
  contactExtra: string;
  paymentMethod: "paypal" | "wise";
  paymentEmail: string;
  paymentCurrency: "USD" | "KRW" | "JPY" | null;
};

export async function submitWinnerInfoAction(
  token: string,
  payload: WinnerInfoSubmission,
): Promise<ClaimActionResult<{ winnerId: string }>> {
  const trimmedToken = token.trim();
  if (!trimmedToken) return { ok: false, reason: "missing_token" };

  // Surface-level validation.  The RPC re-checks the same constraints
  // (currency consistency, payment_method enum) but bailing here saves
  // a round-trip on obviously-bad input.
  if (!payload.legalName.trim()) return { ok: false, reason: "missing_legal_name" };
  if (!payload.country.trim()) return { ok: false, reason: "missing_country" };
  if (!payload.contactExtra.trim())
    return { ok: false, reason: "missing_contact_extra" };
  if (!payload.paymentEmail.trim())
    return { ok: false, reason: "missing_payment_email" };
  if (payload.paymentMethod === "wise" && !payload.paymentCurrency)
    return { ok: false, reason: "wise_currency_required" };
  if (payload.paymentMethod === "paypal" && payload.paymentCurrency)
    return { ok: false, reason: "paypal_currency_must_be_null" };

  const service = createServiceSupabaseClient();
  if (!service) return { ok: false, reason: "service_unavailable" };

  // Capture the submitter's IP for the audit trail (winner_info.submitted_ip).
  // Best-effort: fall through to null when the header chain doesn't
  // contain a usable IP (e.g. local dev).
  const ip = await resolveClientIp();

  const { data, error } = await service
    .rpc("submit_winner_info", {
      p_claim_token: trimmedToken,
      p_legal_name: payload.legalName.trim(),
      p_country: payload.country.trim(),
      p_contact_extra: payload.contactExtra.trim(),
      p_payment_method: payload.paymentMethod,
      p_payment_email: payload.paymentEmail.trim(),
      p_payment_currency: payload.paymentCurrency,
      p_submitted_ip: ip,
    })
    .single<{ winner_id: string; winner_info_id: string }>();

  if (error || !data) return mapRpcError(error?.message);

  // Revalidate paths that surface claim status (results pages, etc).
  // Winner-info contents are RLS-clipped anyway; we just trigger the
  // claim_status badge to flip from "pending" to "submitted".
  revalidatePath(`/winners/claim/${trimmedToken}`);

  return { ok: true, winnerId: data.winner_id };
}

/* -----------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------*/

/** Best-effort client IP resolution from the standard proxy headers. */
async function resolveClientIp(): Promise<string | null> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
    return h.get("x-real-ip") ?? null;
  } catch {
    return null;
  }
}

/** Maps Phase 5-A RPC errcodes / messages to short UI reason strings. */
function mapRpcError(message: string | undefined): {
  ok: false;
  reason: string;
} {
  const msg = message ?? "";
  const known = [
    "invalid_token",
    "token_already_used",
    "token_expired",
    "user_email_missing",
    "no_active_code",
    "email_not_verified",
    "wise_currency_required",
    "paypal_currency_must_be_null",
    "invalid_payment_method",
  ];
  for (const key of known) {
    if (msg.includes(key)) return { ok: false, reason: key };
  }
  return { ok: false, reason: msg || "unknown_error" };
}

/* -----------------------------------------------------------------
 * Winner lookup for the page loader.
 * ---------------------------------------------------------------*/

export type WinnerClaimSnapshot = {
  winnerId: string;
  drawMonthKey: string;
  prizeTier: number;
  prizeAmountUsd: number;
  drawnAt: string;
  infoDeadline: string;
  claimStatus:
    | "pending"
    | "submitted"
    | "confirmed"
    | "paid"
    | "expired"
    | "invalidated";
};

/**
 * Reads the minimal claim-page header data for a given token.  Does
 * NOT expose claim_token to the caller (it's already in the URL).
 * Returns null when the token has no matching live row (404 / fake
 * URL handling stays in the page).
 */
export async function fetchWinnerByToken(
  token: string,
): Promise<WinnerClaimSnapshot | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const service = createServiceSupabaseClient();
  if (!service) return null;

  const { data, error } = await service
    .from("competition_winners")
    .select(
      "id, draw_month_key, prize_tier, prize_amount_usd, drawn_at, info_deadline, claim_status",
    )
    .eq("claim_token", trimmed)
    .maybeSingle();

  if (error || !data) return null;
  return {
    winnerId: data.id as string,
    drawMonthKey: data.draw_month_key as string,
    prizeTier: data.prize_tier as number,
    prizeAmountUsd: data.prize_amount_usd as number,
    drawnAt: data.drawn_at as string,
    infoDeadline: data.info_deadline as string,
    claimStatus: data.claim_status as WinnerClaimSnapshot["claimStatus"],
  };
}
