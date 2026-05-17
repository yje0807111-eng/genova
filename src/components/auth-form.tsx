"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/genova/language-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils/cn";

type Mode = "login" | "signup";
type SignupStep = "credentials" | "otp";

const emptyDigits = () => ["", "", "", "", "", ""];

/** Map Supabase messages to i18n keys; return null to show the raw message. */
function mapAuthErrorKey(message: string): string | null {
  const m = message.trim();
  const rules: [RegExp, string][] = [
    [/invalid login credentials/i, "auth.error.invalidCredentials"],
    [/invalid email|email address is invalid|valid email/i, "auth.error.invalidEmailFormat"],
    [/email.*not.*confirm/i, "auth.error.emailNotConfirmed"],
    [/user already registered/i, "auth.error.userAlreadyRegistered"],
    [/already been registered/i, "auth.error.userAlreadyRegistered"],
    [/signup.*not allowed/i, "auth.error.signupDisabled"],
    [/rate limit|too many requests|once every \d+/i, "auth.error.rateLimited"],
    [/network|fetch failed|failed to fetch/i, "auth.error.network"],
    [/otp.*expired|token.*expired|expired/i, "auth.error.otpExpired"],
    [/invalid otp|invalid token|token has expired/i, "auth.error.invalidOtp"],
    [/email link is invalid/i, "auth.error.invalidEmailLink"],
  ];
  for (const [re, key] of rules) {
    if (re.test(m)) return key;
  }
  if (/Supabase environment variables are not configured/i.test(m)) {
    return "auth.error.serverConfig";
  }
  return null;
}

/**
 * Sign-up flow: verify email ownership via OTP, then attach password after verification.
 */
export function AuthForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("login");
  const [signupStep, setSignupStep] = useState<SignupStep>("credentials");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  /** Sign-up password (separate from login form password state) */
  const [signupPassword, setSignupPassword] = useState("");

  const [digits, setDigits] = useState<string[]>(emptyDigits);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otpCode = digits.join("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const resetSignupFlow = useCallback(() => {
    setSignupStep("credentials");
    setSignupPassword("");
    setDigits(emptyDigits());
    setError(null);
    setMessage(null);
  }, []);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setMessage(null);
    if (next === "signup") {
      resetSignupFlow();
    }
  };

  const sendOtp = async () => {
    setError(null);
    setMessage(null);

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setError(t("auth.error.serverConfig"));
      return;
    }
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t("auth.error.enterEmail"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(t("auth.error.invalidEmailFormat"));
      return;
    }
    if (signupPassword.length < 6) {
      setError(t("auth.error.passwordMinLength"));
      return;
    }

    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          shouldCreateUser: true,
        },
      });
      if (otpError) {
        const key = mapAuthErrorKey(otpError.message);
        setError(key ? t(key) : otpError.message);
        return;
      }
      setEmail(trimmed);
      setMessage(t("auth.message.otpSent").replace("{email}", trimmed));
      setSignupStep("otp");
      setDigits(emptyDigits());
      setResendCooldown(60);
      requestAnimationFrame(() => otpInputRefs.current[0]?.focus());
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const code = otpCode.replace(/\D/g, "");
    if (code.length !== 6) {
      setError(t("auth.error.enterSixDigitCode"));
      return;
    }

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setError(t("auth.error.serverConfig"));
      return;
    }

    setLoading(true);
    try {
      // OTP 확인 후 유저 생성
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "email",
      });
      if (verifyError) {
        const key = mapAuthErrorKey(verifyError.message);
        setError(key ? t(key) : verifyError.message);
        return;
      }
      // OTP 확인 후 비밀번호 설정
      const { error: passwordError } = await supabase.auth.updateUser({
        password: signupPassword,
      });
      if (
        passwordError &&
        !passwordError.message.includes("different from the old password") &&
        !passwordError.message.includes("이전 비밀번호")
      ) {
        const key = mapAuthErrorKey(passwordError.message);
        setError(key ? t(key) : passwordError.message);
        return;
      }
      router.refresh();
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setError(t("auth.error.serverConfig"));
      return;
    }

    const loginEmail = email.trim();
    if (loginEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) {
      setError(t("auth.error.invalidEmailFormat"));
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });
      if (signInError) {
        const key = mapAuthErrorKey(signInError.message);
        setError(key ? t(key) : signInError.message);
        return;
      }
      router.refresh();
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "twitter" | "facebook") => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        const key = mapAuthErrorKey(error.message);
        setError(key ? t(key) : error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const setDigitAt = (index: number, raw: string) => {
    const d = raw.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = d;
      return next;
    });
    if (d && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = emptyDigits();
    for (let i = 0; i < text.length; i++) next[i] = text[i] ?? "";
    setDigits(next);
    const focus = Math.min(text.length, 5);
    otpInputRefs.current[focus]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const fieldLabel = "mb-1.5 block text-[11px] font-medium text-white/55";
  const fieldInput =
    "h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 text-[14px] text-white placeholder:text-white/30 transition focus:border-[#7F77DD]/50 focus:outline-none";
  const primaryBtn =
    "flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#534AB7] via-[#6B5FD4] to-[#7B4FCC] text-[14px] font-bold text-white transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(127,119,221,0.4)] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none";
  const socialBtn =
    "flex h-11 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] text-[13px] font-medium text-white/80 transition hover:bg-white/[0.06] disabled:opacity-50";

  const divider = (
    <div className="my-6 flex items-center gap-4">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <span className="text-[11px] uppercase tracking-wider text-white/30">{t("auth.orContinueWith", "or continue with")}</span>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex border-b border-white/[0.08]">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={cn(
            "-mb-px flex-1 border-b-2 pb-3 text-[13px] font-semibold transition",
            mode === "login" ? "border-white text-white" : "border-transparent text-white/35 hover:text-white/70",
          )}
        >
          {t("auth.signIn", "Sign In")}
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={cn(
            "-mb-px flex-1 border-b-2 pb-3 text-[13px] font-semibold transition",
            mode === "signup" ? "border-white text-white" : "border-transparent text-white/35 hover:text-white/70",
          )}
        >
          {t("auth.signUp", "Sign Up")}
        </button>
      </div>

      {mode === "login" && (
        <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className={fieldLabel}>
              {t("auth.email", "Email")}
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldInput}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className={fieldLabel}>
              {t("auth.password", "Password")}
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldInput}
              placeholder={t("auth.passwordPlaceholder", "6+ characters")}
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}
          <button type="submit" disabled={loading} className={primaryBtn}>
            {loading ? t("auth.processing", "Processing...") : t("auth.signIn", "Sign In")}
          </button>
          {divider}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => void handleSocialLogin("google")} disabled={loading} className={socialBtn}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button type="button" onClick={() => void handleSocialLogin("twitter")} disabled={loading} className={socialBtn}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X
            </button>
            {/* Facebook - 추후 활성화
            <button
              type="button"
              onClick={() => void handleSocialLogin("facebook")}
              disabled={loading}
              className={socialBtn}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
            */}
          </div>
        </form>
      )}

      {mode === "signup" && signupStep === "credentials" && (
        <div className="space-y-4">
          <div>
            <label htmlFor="signup-email" className={fieldLabel}>
              {t("auth.email", "Email")}
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldInput}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className={fieldLabel}>
              {t("auth.passwordForSignIn", "Password (used for sign in)")}
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              className={fieldInput}
              placeholder={t("auth.passwordPlaceholder", "6+ characters")}
            />
          </div>
          <p className="text-[11px] text-white/35">{t("auth.otpHint", "A 6-digit code will be sent to your email.")}</p>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}
          <button type="button" disabled={loading} onClick={() => void sendOtp()} className={primaryBtn}>
            {loading ? t("auth.sending", "Sending...") : t("auth.sendCode", "Send Verification Code")}
          </button>
          {divider}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => void handleSocialLogin("google")} disabled={loading} className={socialBtn}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button type="button" onClick={() => void handleSocialLogin("twitter")} disabled={loading} className={socialBtn}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X
            </button>
            {/* Facebook - 추후 활성화
            <button
              type="button"
              onClick={() => void handleSocialLogin("facebook")}
              disabled={loading}
              className={socialBtn}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
            */}
          </div>
        </div>
      )}

      {mode === "signup" && signupStep === "otp" && (
        <form onSubmit={(e) => void verifyOtpAndCompleteSignup(e)} className="space-y-4">
          <p className="text-sm text-white/50">
            {t("auth.codeSentTo", "Verification code sent to")}{" "}
            <span className="font-medium text-white">{email}</span>.
          </p>
          <div>
            <label className={cn(fieldLabel, "mb-2")}>{t("auth.sixDigitCode", "6-digit verification code")}</label>
            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {digits.map((ch, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpInputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={ch}
                  onChange={(e) => setDigitAt(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="h-12 w-10 rounded-lg border border-white/[0.08] bg-white/[0.02] text-center text-lg font-semibold text-white outline-none transition focus:border-[#7F77DD]/50"
                />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}
          <button type="submit" disabled={loading || otpCode.length !== 6} className={primaryBtn}>
            {loading ? t("auth.verifying", "Verifying...") : t("auth.verifyComplete", "Verify & Complete")}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                resetSignupFlow();
              }}
              className="text-sm text-white/50 underline transition hover:text-white/80"
            >
              {t("auth.editEmailPassword", "Edit email/password")}
            </button>
            <button
              type="button"
              disabled={loading || resendCooldown > 0}
              onClick={() => void sendOtp()}
              className="text-sm font-medium text-[#7F77DD] underline decoration-[#7F77DD]/50 transition hover:decoration-[#7F77DD] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendCooldown > 0 ? t("auth.otpResendSeconds").replace("{n}", String(resendCooldown)) : t("auth.resendCode", "Resend Code")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
