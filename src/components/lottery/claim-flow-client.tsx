"use client";

import { useState, useTransition } from "react";
import {
  requestWinnerEmailCodeAction,
  submitWinnerInfoAction,
  verifyWinnerEmailCodeAction,
  type WinnerInfoSubmission,
} from "@/app/actions/lottery-claim";
import { useI18n } from "@/components/genova/language-provider";
import { cn } from "@/lib/utils/cn";

type Step = "request" | "verify" | "form" | "done";

/**
 * Phase 5-C: the only client-state piece of the claim flow.  Owns:
 *   - which step the user is on
 *   - the 6-digit code buffer
 *   - the final form fields
 *   - in-flight booleans (useTransition for each action)
 *   - the last `reason` string returned by an action, surfaced as
 *     a translated message under the relevant step header
 *
 * Calls into the three Phase 5-B Server Actions; never touches the
 * Supabase client directly.  The token stays a prop — never enters
 * component state — so a React DevTools peek doesn't reveal it.
 */
export function ClaimFlowClient({ token }: { token: string }) {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>("request");
  const [reason, setReason] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [requestPending, startRequest] = useTransition();
  const [verifyPending, startVerify] = useTransition();
  const [submitPending, startSubmit] = useTransition();

  const [legalName, setLegalName] = useState("");
  const [country, setCountry] = useState("");
  const [contactExtra, setContactExtra] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "wise">("paypal");
  const [paymentEmail, setPaymentEmail] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState<
    "USD" | "KRW" | "JPY"
  >("USD");
  const [consented, setConsented] = useState(false);

  function onRequestCode() {
    setReason(null);
    startRequest(async () => {
      const res = await requestWinnerEmailCodeAction(token);
      if (res.ok) {
        setStep("verify");
      } else {
        setReason(res.reason);
      }
    });
  }

  function onVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setReason(null);
    startVerify(async () => {
      const res = await verifyWinnerEmailCodeAction(token, codeInput);
      if (!res.ok) {
        setReason(res.reason);
        return;
      }
      if (res.verified) {
        setStep("form");
      } else {
        setReason("step2.wrong");
      }
    });
  }

  function onSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setReason(null);
    if (!consented) {
      setReason("missing_consent");
      return;
    }
    const payload: WinnerInfoSubmission = {
      legalName,
      country,
      contactExtra,
      paymentMethod,
      paymentEmail,
      paymentCurrency: paymentMethod === "wise" ? paymentCurrency : null,
    };
    startSubmit(async () => {
      const res = await submitWinnerInfoAction(token, payload);
      if (res.ok) {
        setStep("done");
      } else {
        setReason(res.reason);
      }
    });
  }

  // Each step's UI in turn.  Active step is rendered with full color;
  // completed steps are dimmed; future steps are collapsed.
  return (
    <div className="space-y-4">
      {/* Step 1 — request */}
      <StepCard
        active={step === "request"}
        done={step !== "request"}
        title={t("claim.step1.title", "Step 1 — Verify your email")}
      >
        <p className="text-[13px] text-white/65">
          {t(
            "claim.step1.desc",
            "We'll send a 6-digit code to the email on your Genova account.",
          )}
        </p>
        {step === "request" ? (
          <button
            type="button"
            onClick={onRequestCode}
            disabled={requestPending}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#534AB7] px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#6B5FD4] disabled:opacity-60"
          >
            {requestPending
              ? t("claim.step1.sending", "Sending…")
              : t("claim.step1.cta", "Send verification code")}
          </button>
        ) : (
          <p className="mt-2 text-[12px] text-emerald-300/85">
            {t("claim.step1.sent", "Code sent. Check your inbox.")}
          </p>
        )}
        {step === "request" && reason ? (
          <ReasonHint reason={reason} t={t} />
        ) : null}
      </StepCard>

      {/* Step 2 — verify */}
      {step === "verify" || step === "form" || step === "done" ? (
        <StepCard
          active={step === "verify"}
          done={step === "form" || step === "done"}
          title={t("claim.step2.title", "Step 2 — Enter the code")}
        >
          <form onSubmit={onVerifyCode}>
            <label className="mb-2 block text-[12px] font-semibold text-white/55">
              {t("claim.step2.label", "6-digit code")}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={codeInput}
                onChange={(e) =>
                  setCodeInput(e.target.value.replace(/[^0-9]/g, ""))
                }
                disabled={step !== "verify" || verifyPending}
                className="w-40 rounded-lg border border-white/[0.12] bg-white/[0.03] px-3 py-2 text-center text-[18px] font-bold tabular-nums tracking-[0.3em] text-white outline-none focus:border-[#7F77DD]/40"
                placeholder="123456"
              />
              <button
                type="submit"
                disabled={
                  step !== "verify" || verifyPending || codeInput.length !== 6
                }
                className="rounded-lg bg-[#534AB7] px-5 py-2 text-[13px] font-bold text-white transition hover:bg-[#6B5FD4] disabled:opacity-60"
              >
                {verifyPending
                  ? t("claim.step2.verifying", "Verifying…")
                  : t("claim.step2.cta", "Verify")}
              </button>
            </div>
            {step === "verify" ? (
              <button
                type="button"
                onClick={onRequestCode}
                disabled={requestPending}
                className="mt-3 text-[12px] text-white/45 underline-offset-2 transition hover:text-white/80 hover:underline disabled:opacity-50"
              >
                {t("claim.step2.resend", "Send a new code")}
              </button>
            ) : null}
            {step === "verify" && reason ? (
              <ReasonHint reason={reason} t={t} />
            ) : null}
          </form>
        </StepCard>
      ) : null}

      {/* Step 3 — form */}
      {step === "form" || step === "done" ? (
        <StepCard
          active={step === "form"}
          done={step === "done"}
          title={t("claim.step3.title", "Step 3 — Submit your info")}
        >
          {step === "done" ? (
            <p className="text-[14px] font-semibold text-emerald-300">
              {t(
                "claim.step3.success",
                "Submitted! We'll review and reach out soon.",
              )}
            </p>
          ) : (
            <form onSubmit={onSubmitForm} className="space-y-3">
              <Field label={t("claim.step3.legalName", "Legal name (matches your payment account)")}>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/[0.12] bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-[#7F77DD]/40"
                />
              </Field>
              <Field label={t("claim.step3.country", "Country (ISO code, e.g. KR / US / JP)")}>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  maxLength={2}
                  required
                  className="w-24 rounded-lg border border-white/[0.12] bg-white/[0.03] px-3 py-2 text-center text-[13px] uppercase tracking-[0.2em] text-white outline-none focus:border-[#7F77DD]/40"
                />
              </Field>
              <Field label={t("claim.step3.contactExtra", "Backup contact (email, SNS handle, etc.)")}>
                <input
                  type="text"
                  value={contactExtra}
                  onChange={(e) => setContactExtra(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/[0.12] bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-[#7F77DD]/40"
                />
              </Field>
              <Field label={t("claim.step3.paymentMethod", "Payment method")}>
                <div className="flex gap-2">
                  {(["paypal", "wise"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={cn(
                        "rounded-lg border px-4 py-1.5 text-[12px] font-semibold transition",
                        paymentMethod === m
                          ? "border-[#7F77DD]/40 bg-[#7F77DD]/15 text-white"
                          : "border-white/[0.08] bg-white/[0.02] text-white/55 hover:text-white",
                      )}
                    >
                      {t(`claim.step3.paymentMethod.${m}`, m)}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={t("claim.step3.paymentEmail", "Payment account email")}>
                <input
                  type="email"
                  value={paymentEmail}
                  onChange={(e) => setPaymentEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/[0.12] bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-[#7F77DD]/40"
                />
              </Field>
              {paymentMethod === "wise" ? (
                <Field label={t("claim.step3.paymentCurrency", "Payout currency")}>
                  <select
                    value={paymentCurrency}
                    onChange={(e) =>
                      setPaymentCurrency(
                        e.target.value as "USD" | "KRW" | "JPY",
                      )
                    }
                    className="rounded-lg border border-white/[0.12] bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-[#7F77DD]/40"
                  >
                    <option value="USD">USD</option>
                    <option value="KRW">KRW</option>
                    <option value="JPY">JPY</option>
                  </select>
                </Field>
              ) : null}
              <label className="flex cursor-pointer items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  checked={consented}
                  onChange={(e) => setConsented(e.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-white/20 bg-transparent text-[#7F77DD] focus:ring-[#7F77DD]/40"
                />
                <span className="text-[12px] text-white/65">
                  {t(
                    "claim.step3.consent",
                    "I confirm the above info is accurate and consent to the identity verification process.",
                  )}
                </span>
              </label>
              <button
                type="submit"
                disabled={submitPending || !consented}
                className="mt-2 rounded-xl bg-[#534AB7] px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#6B5FD4] disabled:opacity-60"
              >
                {submitPending
                  ? t("claim.step3.submitting", "Submitting…")
                  : t("claim.step3.cta", "Submit")}
              </button>
              {reason ? <ReasonHint reason={reason} t={t} /> : null}
            </form>
          )}
        </StepCard>
      ) : null}
    </div>
  );
}

function StepCard({
  active,
  done,
  title,
  children,
}: {
  active: boolean;
  done: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border px-5 py-4 transition",
        active
          ? "border-[#7F77DD]/40 bg-white/[0.03]"
          : done
          ? "border-white/[0.08] bg-white/[0.01] opacity-60"
          : "border-white/[0.05] bg-white/[0.005] opacity-40",
      )}
    >
      <h2 className="mb-2 text-[14px] font-bold tracking-tight text-white">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
        {label}
      </label>
      {children}
    </div>
  );
}

function ReasonHint({
  reason,
  t,
}: {
  reason: string;
  t: (key: string, fallback?: string) => string;
}) {
  // Translation key map for known reasons; everything else falls
  // through to the unknown-error copy.
  const map: Record<string, string> = {
    "step2.wrong": "claim.step2.wrong",
    token_expired: "claim.expired",
    token_already_used: "claim.alreadySubmitted",
    invalid_token: "claim.invalidToken",
    missing_consent: "claim.step3.consent",
  };
  const key = map[reason];
  const copy = key ? t(key) : t("claim.error.unknown", "Something went wrong. Please try again.");
  return (
    <p className="mt-2 text-[12px] text-amber-300/85">{copy}</p>
  );
}
