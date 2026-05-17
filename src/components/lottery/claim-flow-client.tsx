"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import {
  requestWinnerEmailCodeAction,
  submitWinnerInfoAction,
  verifyWinnerEmailCodeAction,
  type WinnerInfoSubmission,
} from "@/app/actions/lottery-claim";
import { useI18n } from "@/components/genova/language-provider";
import { cn } from "@/lib/utils/cn";

type Step = "request" | "verify" | "form" | "done";

const SELECT_CLS =
  "w-full appearance-none rounded-lg border border-white/[0.12] bg-white/[0.03] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat px-3 py-2.5 pr-9 text-[13px] text-white outline-none transition focus:border-[#7F77DD]/40 [&>option]:bg-[#14112e] [&>option]:text-white " +
  "bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23AFA9EC%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')]";

// ISO 3166-1 alpha-2.  KR/JP/US 우선 노출, 이후 알파벳.  필요 시 확장.
const COUNTRIES: { code: string; name: string }[] = [
  { code: "KR", name: "대한민국 (South Korea)" },
  { code: "JP", name: "日本 (Japan)" },
  { code: "US", name: "United States" },
  { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China (中国)" },
  { code: "CO", name: "Colombia" },
  { code: "CZ", name: "Czechia" },
  { code: "DK", name: "Denmark" },
  { code: "EG", name: "Egypt" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NO", name: "Norway" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TW", name: "Taiwan (台灣)" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Türkiye" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "VN", name: "Vietnam" },
  { code: "OT", name: "Other / 그 외" },
];

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
  const [paymentMethod, setPaymentMethod] = useState<
    "paypal" | "wise" | "payoneer"
  >("paypal");
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
      contactExtra: "",
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
    <div className="space-y-3">
      <StepIndicator step={step} />
      {/* Step 1 — request (this step only) */}
      {step === "request" ? (
        <StepCard
          n={1}
          active
          done={false}
          title={t("claim.step1.title", "Step 1 — Verify your email")}
        >
          <p className="text-[13px] text-white/65">
            {t(
              "claim.step1.desc",
              "We'll send a 6-digit code to the email on your Genova account.",
            )}
          </p>
          <button
            type="button"
            onClick={onRequestCode}
            disabled={requestPending}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#6B5FD4] via-[#534AB7] to-[#3F36A3] shadow-[0_2px_12px_rgba(83,74,183,0.35)] px-5 py-2.5 text-[13px] font-bold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {requestPending
              ? t("claim.step1.sending", "Sending…")
              : t("claim.step1.cta", "Send verification code")}
          </button>
          {reason ? <ReasonHint reason={reason} t={t} /> : null}
        </StepCard>
      ) : null}

      {/* Step 2 — verify (this step only) */}
      {step === "verify" ? (
        <StepCard
          n={2}
          active
          done={false}
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
                className="rounded-lg bg-gradient-to-br from-[#6B5FD4] via-[#534AB7] to-[#3F36A3] shadow-[0_2px_12px_rgba(83,74,183,0.35)] px-5 py-2 text-[13px] font-bold text-white transition hover:brightness-110 disabled:opacity-60"
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
          n={3}
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
              <Field label={t("claim.step3.country", "Country")}>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className={SELECT_CLS}
                >
                  <option value="" disabled>
                    {t("claim.step3.countryPlaceholder", "Select your country")}
                  </option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("claim.step3.paymentMethod", "Payment method")}>
                <div className="flex flex-wrap gap-2">
                  {(["paypal", "wise", "payoneer"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={cn(
                        "rounded-lg border px-4 py-2 text-[12px] font-semibold transition",
                        paymentMethod === m
                          ? "border-[#7F77DD]/40 bg-[#7F77DD]/15 text-white"
                          : "border-white/[0.08] bg-white/[0.02] text-white/55 hover:text-white",
                      )}
                    >
                      {t(`claim.step3.paymentMethod.${m}`, m)}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-white/35">
                  {t(
                    "claim.step3.paymentMethodHelp",
                    "All three support overseas payouts to Korea/Japan. PayPal/Payoneer pay in USD; Wise lets you choose the payout currency.",
                  )}
                </p>
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
                    className={SELECT_CLS}
                  >
                    <option value="USD">USD — US Dollar</option>
                    <option value="KRW">KRW — 대한민국 원</option>
                    <option value="JPY">JPY — 日本円</option>
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
                className="mt-2 rounded-xl bg-gradient-to-br from-[#6B5FD4] via-[#534AB7] to-[#3F36A3] shadow-[0_2px_12px_rgba(83,74,183,0.35)] px-5 py-2.5 text-[13px] font-bold text-white transition hover:brightness-110 disabled:opacity-60"
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

const STEP_ORDER: Step[] = ["request", "verify", "form", "done"];

function StepIndicator({ step }: { step: Step }) {
  const idx = STEP_ORDER.indexOf(step); // 0..3
  return (
    <div className="flex items-center gap-2 px-1 pb-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-all duration-500",
            i < idx
              ? "bg-emerald-400/70"
              : i === idx
                ? "bg-gradient-to-r from-[#7F77DD] to-[#534AB7]"
                : "bg-white/[0.08]",
          )}
        />
      ))}
    </div>
  );
}

function StepCard({
  n,
  active,
  done,
  title,
  children,
}: {
  n: number;
  active: boolean;
  done: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border px-5 py-4 backdrop-blur-sm transition-all duration-300",
        active
          ? "border-[#7F77DD]/30"
          : done
            ? "border-white/[0.07] opacity-70"
            : "border-white/[0.05] opacity-45",
      )}
      style={
        active
          ? {
              background:
                "linear-gradient(160deg, rgba(127,119,221,0.08) 0%, rgba(10,10,10,0.4) 100%)",
              boxShadow:
                "0 8px 28px rgba(0,0,0,0.3), inset 0 1px 0 rgba(127,119,221,0.14)",
            }
          : { background: "rgba(255,255,255,0.015)" }
      }
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-black transition",
            done
              ? "bg-emerald-500/20 text-emerald-300"
              : active
                ? "text-white"
                : "bg-white/[0.05] text-white/40",
          )}
          style={
            active && !done
              ? {
                  background:
                    "linear-gradient(135deg, #6B5FD4 0%, #534AB7 100%)",
                  boxShadow: "0 2px 10px rgba(83,74,183,0.4)",
                }
              : undefined
          }
        >
          {done ? <Check className="h-3.5 w-3.5" /> : n}
        </span>
        <h2 className="text-[14px] font-bold tracking-tight text-white">
          {title}
        </h2>
      </div>
      <div className="pl-[38px]">{children}</div>
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
    email_dispatch_failed: "claim.error.emailFailed",
    rate_limited: "claim.error.rateLimited",
    user_email_missing: "claim.error.emailMissing",
    service_unavailable: "claim.error.service",
    no_active_code: "claim.error.noActiveCode",
    email_not_verified: "claim.error.notVerified",
  };
  const key = map[reason];
  const copy = key
    ? t(
        key,
        reason === "email_dispatch_failed"
          ? "Couldn't send the verification email. Please try again shortly, or contact the operator."
          : "",
      )
    : t("claim.error.unknown", "Something went wrong. Please try again.");
  return (
    <p className="mt-2 text-[12px] text-amber-300/85">{copy}</p>
  );
}
