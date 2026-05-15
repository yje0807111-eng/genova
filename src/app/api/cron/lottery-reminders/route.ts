import { NextResponse } from "next/server";
import { sendWinnerReminderEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

/**
 * A1-3: claim-deadline reminder cron.
 *
 * Runs daily — surfaces winners whose info_deadline is approaching
 * (D-3 and D-1 windows) and dispatches an in-app notification +
 * email nudge so they don't forget to submit.
 *
 * Idempotency: each winner has two timestamp columns,
 * reminder_d3_at and reminder_d1_at.  This route only sends when
 * the matching column is NULL, then stamps it.  Re-running the
 * route same-day is a clean no-op.
 *
 * Window math:
 *   D-3 wave: 2 days <= (deadline - now) < 4 days  (rounded so the
 *             daily cron always catches one slot per winner)
 *   D-1 wave: 0 days <= (deadline - now) < 2 days
 * Both waves filter on claim_status='pending'.
 *
 * Auth: same Bearer-CRON_SECRET pattern as
 * /api/cron/cleanup-mux and /api/cron/lottery-expire.
 */

type RemindersResult = { d3: number; d1: number; errors: number };

type WinnerRow = {
  id: string;
  user_id: string;
  competition_id: string;
  prize_amount_usd: number;
  claim_token: string;
  info_deadline: string;
};

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "DB connection failed" }, { status: 500 });
  }

  const now = new Date();
  const twoDays = new Date(now.getTime() + 2 * 86_400_000).toISOString();
  const fourDays = new Date(now.getTime() + 4 * 86_400_000).toISOString();
  // D-1 lower bound is "right now" so winners whose deadline
  // already passed but cron hasn't yet flipped them to expired are
  // still nudged.  expire_unclaimed_winners() handles the final
  // state transition.

  // D-3 wave: deadline within (now+2d, now+4d), not yet sent.
  const d3 = await dispatchWave(
    supabase,
    {
      gteDeadline: twoDays,
      ltDeadline: fourDays,
      stampColumn: "reminder_d3_at",
      missingColumn: "reminder_d3_at",
      daysLeft: 3,
    },
  );

  // D-1 wave: deadline within (now, now+2d), not yet sent.
  const d1 = await dispatchWave(
    supabase,
    {
      gteDeadline: now.toISOString(),
      ltDeadline: twoDays,
      stampColumn: "reminder_d1_at",
      missingColumn: "reminder_d1_at",
      daysLeft: 1,
    },
  );

  const result: RemindersResult = {
    d3: d3.sent,
    d1: d1.sent,
    errors: d3.errors + d1.errors,
  };
  console.log("[cron/lottery-reminders]", result);
  return NextResponse.json(result);
}

async function dispatchWave(
  supabase: NonNullable<ReturnType<typeof createServiceSupabaseClient>>,
  cfg: {
    gteDeadline: string;
    ltDeadline: string;
    stampColumn: "reminder_d3_at" | "reminder_d1_at";
    missingColumn: "reminder_d3_at" | "reminder_d1_at";
    daysLeft: number;
  },
): Promise<{ sent: number; errors: number }> {
  const { data: rows, error } = await supabase
    .from("competition_winners")
    .select(
      "id, user_id, competition_id, prize_amount_usd, claim_token, info_deadline",
    )
    .eq("claim_status", "pending")
    .gte("info_deadline", cfg.gteDeadline)
    .lt("info_deadline", cfg.ltDeadline)
    .is(cfg.missingColumn, null);

  if (error) {
    console.error("[cron/lottery-reminders] select failed", cfg.stampColumn, error);
    return { sent: 0, errors: 1 };
  }
  if (!rows || rows.length === 0) return { sent: 0, errors: 0 };

  const winners = rows as WinnerRow[];

  // Competition titles in one batch.
  const compIds = [...new Set(winners.map((w) => w.competition_id))];
  const { data: comps } = await supabase
    .from("competitions")
    .select("id, title")
    .in("id", compIds);
  const titleByCompId = new Map(
    (comps ?? []).map((c) => [c.id as string, (c.title as string) ?? "competition"]),
  );

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://genova-silk.vercel.app";

  let sent = 0;
  let errors = 0;

  for (const w of winners) {
    const claimUrl = `${siteUrl}/winners/claim/${w.claim_token}`;
    const competitionTitle =
      titleByCompId.get(w.competition_id) ?? "competition";

    // In-app notification — same href shape as the initial winner
    // notification.  Different `type` so the UI can theme it.
    const notifResult = await createNotification({
      userId: w.user_id,
      actorId: null,
      type: "lottery_reminder",
      title: `⏰ ${cfg.daysLeft} day${cfg.daysLeft > 1 ? "s" : ""} left to claim`,
      body: `Your $${w.prize_amount_usd} win expires soon. Submit your info.`,
      href: `/winners/claim/${w.claim_token}`,
      entityType: "competition_winner",
      entityId: w.id,
    });
    if (notifResult.error) {
      errors += 1;
      console.error("[cron/lottery-reminders] notif insert failed", w.id, notifResult.error);
    }

    // Email — resolve recipient via auth admin API.
    try {
      const { data: u } = await supabase.auth.admin.getUserById(w.user_id);
      const email = u?.user?.email ?? null;
      if (email) {
        await sendWinnerReminderEmail({
          to: email,
          competitionTitle,
          prizeAmountUsd: w.prize_amount_usd,
          claimUrl,
          daysLeft: cfg.daysLeft,
          deadlineIso: w.info_deadline,
        });
      }
    } catch (e) {
      errors += 1;
      console.error("[cron/lottery-reminders] getUserById/email failed", w.id, e);
    }

    // Stamp.  Marking BEFORE the next wave runs prevents the same
    // winner from being picked up by another iteration if the
    // function is restarted mid-loop.
    const { error: stampErr } = await supabase
      .from("competition_winners")
      .update({ [cfg.stampColumn]: new Date().toISOString() })
      .eq("id", w.id);
    if (stampErr) {
      errors += 1;
      console.error("[cron/lottery-reminders] stamp failed", w.id, stampErr);
    } else {
      sent += 1;
    }
  }

  return { sent, errors };
}
