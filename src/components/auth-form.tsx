"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/genova/language-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type Mode = "login" | "signup";
type SignupStep = "credentials" | "otp";

const emptyDigits = () => ["", "", "", "", "", ""];

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
      setError("Supabase environment variables are not configured.");
      return;
    }
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email.");
      return;
    }
    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters.");
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
        setError(otpError.message);
        return;
      }
      setEmail(trimmed);
      setMessage("Verification code sent to your email.");
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
      setError("Please enter the 6-digit verification code.");
      return;
    }

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setError("Supabase environment variables are not configured.");
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
        setError(verifyError.message);
        return;
      }
      // OTP 확인 후 비밀번호 설정
      const { error: passwordError } = await supabase.auth.updateUser({
        password: signupPassword,
      });
      if (passwordError && !passwordError.message.includes("different from the old password")) {
        setError(passwordError.message);
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
      setError("Supabase environment variables are not configured.");
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
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
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setError(error.message);
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

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-lg bg-[#26215C] p-1">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
            mode === "login" ? "bg-[#534AB7] text-[#EEEDFE]" : "text-[#AFA9EC] hover:text-[#EEEDFE]"
          }`}
        >
          {t("auth.signIn", "Sign In")}
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
            mode === "signup" ? "bg-[#534AB7] text-[#EEEDFE]" : "text-[#AFA9EC] hover:text-[#EEEDFE]"
          }`}
        >
          {t("auth.signUp", "Sign Up")}
        </button>
      </div>

      {mode === "login" && (
        <form onSubmit={(e) => void handleLogin(e)} className="space-y-3">
          <div>
            <label htmlFor="auth-email" className="mb-1 block text-xs text-[#AFA9EC]">
              {t("auth.email", "Email")}
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-[#26215C] p-3 text-[#EEEDFE] outline-none ring-1 ring-white/10 focus:ring-[#7F77DD]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="mb-1 block text-xs text-[#AFA9EC]">
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
              className="w-full rounded-lg bg-[#26215C] p-3 text-[#EEEDFE] outline-none ring-1 ring-white/10 focus:ring-[#7F77DD]"
              placeholder={t("auth.passwordPlaceholder", "6+ characters")}
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#534AB7] p-3 font-semibold text-[#EEEDFE] transition hover:bg-[#7F77DD] disabled:opacity-60"
          >
            {loading ? t("auth.processing", "Processing...") : t("auth.signIn", "Sign In")}
          </button>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#080618] px-3 text-[11px] text-white/30">
                {t("auth.orContinueWith", "or continue with")}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void handleSocialLogin("google")}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => void handleSocialLogin("twitter" as any)}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
            >
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
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
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
        <div className="space-y-3">
          <div>
            <label htmlFor="signup-email" className="mb-1 block text-xs text-[#AFA9EC]">
              {t("auth.email", "Email")}
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-[#26215C] p-3 text-[#EEEDFE] outline-none ring-1 ring-white/10 focus:ring-[#7F77DD]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="mb-1 block text-xs text-[#AFA9EC]">
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
              className="w-full rounded-lg bg-[#26215C] p-3 text-[#EEEDFE] outline-none ring-1 ring-white/10 focus:ring-[#7F77DD]"
              placeholder={t("auth.passwordPlaceholder", "6+ characters")}
            />
          </div>
          <p className="text-xs text-[#AFA9EC]">
            {t("auth.otpHint", "A 6-digit code will be sent to your email.")}
          </p>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}
          <button
            type="button"
            disabled={loading}
            onClick={() => void sendOtp()}
            className="w-full rounded-lg bg-[#534AB7] p-3 font-semibold text-[#EEEDFE] transition hover:bg-[#7F77DD] disabled:opacity-60"
          >
            {loading ? t("auth.sending", "Sending...") : t("auth.sendCode", "Send Verification Code")}
          </button>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#080618] px-3 text-[11px] text-white/30">
                {t("auth.orContinueWith", "or continue with")}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void handleSocialLogin("google")}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => void handleSocialLogin("twitter" as any)}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
            >
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
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
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
          <p className="text-sm text-[#AFA9EC]">
            {t("auth.codeSentTo", "Verification code sent to")}{" "}
            <span className="font-medium text-[#EEEDFE]">{email}</span>.
          </p>
          <div>
            <label className="mb-2 block text-xs text-[#AFA9EC]">
              {t("auth.sixDigitCode", "6-digit verification code")}
            </label>
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
                  className="h-12 w-10 rounded-lg bg-[#26215C] text-center text-lg font-semibold text-[#EEEDFE] outline-none ring-1 ring-white/10 focus:ring-[#7F77DD]"
                />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}
          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="w-full rounded-lg bg-[#534AB7] p-3 font-semibold text-[#EEEDFE] transition hover:bg-[#7F77DD] disabled:opacity-60"
          >
            {loading ? t("auth.verifying", "Verifying...") : t("auth.verifyComplete", "Verify & Complete")}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                resetSignupFlow();
              }}
              className="text-sm text-[#AFA9EC] underline hover:text-[#EEEDFE]"
            >
              {t("auth.editEmailPassword", "Edit email/password")}
            </button>
            <button
              type="button"
              disabled={loading || resendCooldown > 0}
              onClick={() => void sendOtp()}
              className="text-sm font-medium text-[#7F77DD] underline decoration-[#7F77DD]/50 hover:decoration-[#7F77DD] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : t("auth.resendCode", "Resend Code")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
