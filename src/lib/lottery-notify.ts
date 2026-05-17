import type { SupabaseClient } from "@supabase/supabase-js";
import { sendWinnerNotificationEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

/** Result shape — surfaced to admin UI so failed notifications
 *  aren't silently swallowed. */
export type NotificationDispatchResult = {
  attempted: number;
  notifFailed: number;
  emailFailed: number;
};

/**
 * Sends in-app + email notifications for all undelivered winners of a
 * draw month.  Shared by the admin draw/redraw actions and the
 * monthly auto-draw cron.  Idempotent: filters notified_at IS NULL
 * and stamps notified_at after each send.
 */
export async function dispatchWinnerNotifications(
  service: SupabaseClient,
  monthKey: string,
): Promise<NotificationDispatchResult> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://genova-silk.vercel.app";

  const { data: winners, error } = await service
    .from("competition_winners")
    .select(
      "id, user_id, prize_tier, prize_amount_usd, claim_token, info_deadline, claim_status",
    )
    .eq("draw_month_key", monthKey)
    .is("notified_at", null)
    .neq("claim_status", "invalidated");

  if (error) {
    console.error("[lottery-notify] lookup failed", error);
    return { attempted: 0, notifFailed: 0, emailFailed: 0 };
  }
  if (!winners || winners.length === 0) {
    return { attempted: 0, notifFailed: 0, emailFailed: 0 };
  }

  const competitionTitle = `Genova ${monthKey}`;

  const emailByUserId = new Map<string, string>();
  for (const w of winners) {
    try {
      const { data: u } = await service.auth.admin.getUserById(
        w.user_id as string,
      );
      const email = u?.user?.email ?? null;
      if (email) emailByUserId.set(w.user_id as string, email);
    } catch (e) {
      console.error("[lottery-notify] getUserById failed", w.user_id, e);
    }
  }

  let notifFailed = 0;
  let emailFailed = 0;
  for (const w of winners) {
    const winnerId = w.id as string;
    const userId = w.user_id as string;
    const token = w.claim_token as string;
    const claimUrl = `${siteUrl}/winners/claim/${token}`;

    const notifResult = await createNotification({
      userId,
      actorId: null,
      type: "lottery_winner",
      title: "🎉 You won the Genova lottery",
      body: `Tier ${w.prize_tier} · $${w.prize_amount_usd} USD — claim within 1 month.`,
      href: `/winners/claim/${token}`,
      entityType: "competition_winner",
      entityId: winnerId,
      // claim_token intentionally OMITTED per CLAUDE.md #7 — href only.
      metadata: { prize_tier: w.prize_tier, prize_amount_usd: w.prize_amount_usd },
    });
    if (notifResult.error) {
      notifFailed += 1;
      console.error("[lottery-notify] notif insert failed", winnerId, notifResult.error);
    }

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
        console.error("[lottery-notify] email send failed", winnerId, e);
      }
    }

    const { error: stampErr } = await service
      .from("competition_winners")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", winnerId);
    if (stampErr) {
      console.error("[lottery-notify] notified_at update failed", winnerId, stampErr);
    }
  }

  return { attempted: winners.length, notifFailed, emailFailed };
}
