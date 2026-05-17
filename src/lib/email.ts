import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Sends the 6-digit verification code to a lottery winner who
 * opened their claim link.  Called from `requestWinnerEmailCodeAction`
 * after `request_winner_email_code()` returns the code + the
 * winner's auth.users.email.
 *
 * Returns true on dispatch, false on missing config / send failure
 * — caller decides whether to surface a user-visible error.  The
 * code itself is NOT logged.
 */
export async function sendWinnerCodeEmail(input: {
  to: string;
  code: string;
  expiresAt: string; // ISO timestamp
}): Promise<boolean> {
  if (!resend) {
    // Dev convenience: with no Resend key, print the code to the
    // server console so the claim flow is testable locally.  Never
    // active in production (would leak the verification code).
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `\n[DEV] RESEND_API_KEY not set — winner verification code for ${input.to}: ${input.code}\n(expires ${input.expiresAt})\n`,
      );
      return true;
    }
    console.warn("RESEND_API_KEY not set, skipping winner code email");
    return false;
  }

  const from = process.env.NOTIFY_FROM_EMAIL ?? "onboarding@resend.dev";
  const expiresLabel = (() => {
    try {
      return new Date(input.expiresAt).toUTCString();
    } catch {
      return input.expiresAt;
    }
  })();

  const subject = `[Genova] Your lottery claim verification code`;
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff;">
      <div style="border-left: 3px solid #7F77DD; padding-left: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 11px; color: #AFA9EC; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 700;">Genova Lottery</p>
        <h1 style="margin: 6px 0 0; font-size: 22px; line-height: 1.3;">Verification code</h1>
      </div>
      <p style="margin: 0 0 12px; color: #ccc; line-height: 1.6; font-size: 14px;">
        Enter this 6-digit code in your claim form to verify your email and continue:
      </p>
      <div style="margin: 24px 0; padding: 18px; background: linear-gradient(135deg, #16142a 0%, #0a0a0a 100%); border: 1px solid #7F77DD33; border-radius: 12px; text-align: center;">
        <p style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 0.4em; color: #fff; font-family: 'SFMono-Regular', Menlo, Consolas, monospace;">${input.code}</p>
      </div>
      <p style="margin: 0; color: #888; line-height: 1.6; font-size: 12px;">
        Code expires at ${expiresLabel} (5 minutes from issue).
      </p>
      <p style="margin: 16px 0 0; color: #888; line-height: 1.6; font-size: 12px;">
        Didn't request this? You can ignore this email — no action will be taken.
      </p>
    </div>
  `;

  try {
    await resend.emails.send({ from, to: input.to, subject, html });
    return true;
  } catch (error) {
    console.error("Winner code email send failed:", error);
    return false;
  }
}

export async function sendBusinessInquiryNotification(input: {
  type: "individual" | "business";
  contactName: string;
  companyName?: string | null;
  email: string;
  phone?: string | null;
  productDescription?: string | null;
  competitionConcept?: string | null;
  budgetRange?: string | null;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping email notification");
    return;
  }

  const from = process.env.NOTIFY_FROM_EMAIL ?? "onboarding@resend.dev";
  const to = process.env.NOTIFY_TO_EMAIL;
  if (!to) {
    console.warn("NOTIFY_TO_EMAIL not set, skipping email notification");
    return;
  }

  const typeLabel = input.type === "business" ? "기업" : "개인";
  const subject = `[Genova] 새 비즈니스 문의 - ${input.contactName}${input.companyName ? ` (${input.companyName})` : ""}`;

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #fff;">
      <div style="border-left: 3px solid #7F77DD; padding-left: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 11px; color: #AFA9EC; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 700;">New Inquiry</p>
        <h1 style="margin: 4px 0 0; font-size: 24px;">새 비즈니스 문의</h1>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #888; width: 120px;">유형</td><td style="padding: 8px 0;">${typeLabel}</td></tr>
        <tr><td style="padding: 8px 0; color: #888;">이름</td><td style="padding: 8px 0;">${input.contactName}</td></tr>
        ${input.companyName ? `<tr><td style="padding: 8px 0; color: #888;">회사</td><td style="padding: 8px 0;">${input.companyName}</td></tr>` : ""}
        <tr><td style="padding: 8px 0; color: #888;">이메일</td><td style="padding: 8px 0;"><a href="mailto:${input.email}" style="color: #AFA9EC;">${input.email}</a></td></tr>
        ${input.phone ? `<tr><td style="padding: 8px 0; color: #888;">연락처</td><td style="padding: 8px 0;">${input.phone}</td></tr>` : ""}
        ${input.budgetRange ? `<tr><td style="padding: 8px 0; color: #888;">예산</td><td style="padding: 8px 0;">${input.budgetRange}</td></tr>` : ""}
      </table>
      ${input.productDescription ? `<div style="margin-top: 24px;"><p style="color: #888; font-size: 12px; margin: 0 0 8px;">제품/서비스</p><p style="margin: 0; line-height: 1.6;">${input.productDescription.replace(/\n/g, "<br>")}</p></div>` : ""}
      ${input.competitionConcept ? `<div style="margin-top: 16px;"><p style="color: #888; font-size: 12px; margin: 0 0 8px;">공모전 컨셉</p><p style="margin: 0; line-height: 1.6;">${input.competitionConcept.replace(/\n/g, "<br>")}</p></div>` : ""}
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #222;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin?tab=business" style="display: inline-block; background: linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%); color: #fff; padding: 10px 20px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 13px;">어드민에서 보기 →</a>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({ from, to, subject, html });
  } catch (error) {
    console.error("Email send failed:", error);
  }
}

/**
 * A1-2: lottery winner announcement email.
 *
 * Fires from `triggerCompetitionDrawAction` (and
 * `redrawWinnerSlotAction`) right after the RPC reports success,
 * one send per winner.  Carries the claim URL so the recipient can
 * jump straight into the 3-step submission flow (Phase 5).
 *
 * The claim token IS in the URL — same security model as the
 * in-app notification's `href` field: the URL itself is the
 * authenticator, transit is HTTPS, and there's no plaintext
 * logging of the token in this function.
 */
export async function sendWinnerNotificationEmail(input: {
  to: string;
  competitionTitle: string;
  prizeTier: number;
  prizeAmountUsd: number;
  claimUrl: string;
  /** ISO timestamp for the info_deadline */
  deadlineIso: string;
}): Promise<boolean> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping winner email");
    return false;
  }

  const from = process.env.NOTIFY_FROM_EMAIL ?? "onboarding@resend.dev";
  const deadlineLabel = (() => {
    try {
      return new Date(input.deadlineIso).toUTCString();
    } catch {
      return input.deadlineIso;
    }
  })();

  const subject = `[Genova] 🎉 You won the lottery — ${input.competitionTitle}`;
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff;">
      <div style="border-left: 3px solid #F5D182; padding-left: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 11px; color: #F5D182; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 700;">Genova Lottery</p>
        <h1 style="margin: 6px 0 0; font-size: 24px; line-height: 1.3;">Congratulations — you're a winner!</h1>
      </div>
      <p style="margin: 0 0 12px; color: #ccc; line-height: 1.6; font-size: 14px;">
        Your entry was drawn in <strong style="color: #fff;">${input.competitionTitle}</strong>.
      </p>
      <div style="margin: 20px 0; padding: 16px; background: linear-gradient(135deg, #16142a 0%, #0a0a0a 100%); border: 1px solid #F5D18255; border-radius: 12px;">
        <p style="margin: 0 0 4px; font-size: 11px; color: #F5D182AA; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 700;">Tier ${input.prizeTier}</p>
        <p style="margin: 0; font-size: 26px; font-weight: 800; color: #F5D182;">$${input.prizeAmountUsd} USD</p>
      </div>
      <p style="margin: 0 0 16px; color: #ccc; line-height: 1.6; font-size: 14px;">
        Submit your payment info within <strong style="color: #fff;">1 month</strong> to claim your prize.
        After that, the slot is forfeited.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${input.claimUrl}" style="display: inline-block; background: linear-gradient(135deg, #6B5FD4 0%, #534AB7 50%, #3F36A3 100%); color: #fff; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 14px;">Submit info →</a>
      </div>
      <p style="margin: 16px 0 0; color: #888; line-height: 1.6; font-size: 12px;">
        Deadline: ${deadlineLabel}
      </p>
      <p style="margin: 8px 0 0; color: #666; line-height: 1.6; font-size: 11px;">
        The link above is unique to you. Don't share it.
      </p>
    </div>
  `;

  try {
    await resend.emails.send({ from, to: input.to, subject, html });
    return true;
  } catch (error) {
    console.error("Winner notification email send failed:", error);
    return false;
  }
}

/**
 * A1-2: lottery claim-deadline reminder email.
 *
 * Sent by the `/api/cron/lottery-reminders` daily sweep when the
 * winner is in claim_status='pending' and the deadline is within
 * the D-3 or D-1 window.  Idempotency tracked by
 * competition_winners.reminder_dN_at; cron only dispatches when
 * the matching column is NULL.
 */
export async function sendWinnerReminderEmail(input: {
  to: string;
  competitionTitle: string;
  prizeAmountUsd: number;
  claimUrl: string;
  daysLeft: number; // 3 or 1
  deadlineIso: string;
}): Promise<boolean> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping reminder email");
    return false;
  }

  const from = process.env.NOTIFY_FROM_EMAIL ?? "onboarding@resend.dev";
  const deadlineLabel = (() => {
    try {
      return new Date(input.deadlineIso).toUTCString();
    } catch {
      return input.deadlineIso;
    }
  })();

  const subject = `[Genova] ⏰ ${input.daysLeft} day${input.daysLeft > 1 ? "s" : ""} left to claim your prize`;
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff;">
      <div style="border-left: 3px solid #ef4444; padding-left: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 11px; color: #fca5a5; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 700;">Reminder · Genova Lottery</p>
        <h1 style="margin: 6px 0 0; font-size: 22px; line-height: 1.3;">${input.daysLeft} day${input.daysLeft > 1 ? "s" : ""} left</h1>
      </div>
      <p style="margin: 0 0 12px; color: #ccc; line-height: 1.6; font-size: 14px;">
        You still need to submit payment info for your <strong style="color: #fff;">$${input.prizeAmountUsd}</strong> win
        in <strong style="color: #fff;">${input.competitionTitle}</strong>.
      </p>
      <p style="margin: 0 0 16px; color: #ccc; line-height: 1.6; font-size: 14px;">
        After the deadline, the prize is forfeited.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${input.claimUrl}" style="display: inline-block; background: linear-gradient(135deg, #6B5FD4 0%, #534AB7 50%, #3F36A3 100%); color: #fff; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 14px;">Submit info now →</a>
      </div>
      <p style="margin: 16px 0 0; color: #888; line-height: 1.6; font-size: 12px;">
        Deadline: ${deadlineLabel}
      </p>
    </div>
  `;

  try {
    await resend.emails.send({ from, to: input.to, subject, html });
    return true;
  } catch (error) {
    console.error("Winner reminder email send failed:", error);
    return false;
  }
}
