"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type Mode = "login" | "signup";
type SignupStep = "credentials" | "otp";

const emptyDigits = () => ["", "", "", "", "", ""];

/**
 * Sign-up flow: verify email ownership via OTP, then attach password after verification.
 */
export function AuthForm() {
  const router = useRouter();
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
    if (signupPassword.length < 6) {
      setError("Please check your password and try again.");
      return;
    }

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setError("Supabase environment variables are not configured.");
      return;
    }

    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "email",
      });
      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password: signupPassword,
      });
      if (passwordError) {
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
          Sign In
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
            mode === "signup" ? "bg-[#534AB7] text-[#EEEDFE]" : "text-[#AFA9EC] hover:text-[#EEEDFE]"
          }`}
        >
          Sign Up
        </button>
      </div>

      {mode === "login" && (
        <form onSubmit={(e) => void handleLogin(e)} className="space-y-3">
          <div>
            <label htmlFor="auth-email" className="mb-1 block text-xs text-[#AFA9EC]">
              Email
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
              Password
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
              placeholder="6+ characters"
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#534AB7] p-3 font-semibold text-[#EEEDFE] transition hover:bg-[#7F77DD] disabled:opacity-60"
          >
            {loading ? "Processing..." : "Sign In"}
          </button>
        </form>
      )}

      {mode === "signup" && signupStep === "credentials" && (
        <div className="space-y-3">
          <div>
            <label htmlFor="signup-email" className="mb-1 block text-xs text-[#AFA9EC]">
              Email
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
              Password (used for sign in)
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
              placeholder="6+ characters"
            />
          </div>
          <p className="text-xs text-[#AFA9EC]">
            A 6-digit code will be sent to your email.
          </p>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}
          <button
            type="button"
            disabled={loading}
            onClick={() => void sendOtp()}
            className="w-full rounded-lg bg-[#534AB7] p-3 font-semibold text-[#EEEDFE] transition hover:bg-[#7F77DD] disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Verification Code"}
          </button>
        </div>
      )}

      {mode === "signup" && signupStep === "otp" && (
        <form onSubmit={(e) => void verifyOtpAndCompleteSignup(e)} className="space-y-4">
          <p className="text-sm text-[#AFA9EC]">
            Verification code sent to <span className="font-medium text-[#EEEDFE]">{email}</span>.
          </p>
          <div>
            <label className="mb-2 block text-xs text-[#AFA9EC]">6-digit verification code</label>
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
            {loading ? "Verifying..." : "Verify & Complete"}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                resetSignupFlow();
              }}
              className="text-sm text-[#AFA9EC] underline hover:text-[#EEEDFE]"
            >
              Edit email/password
            </button>
            <button
              type="button"
              disabled={loading || resendCooldown > 0}
              onClick={() => void sendOtp()}
              className="text-sm font-medium text-[#7F77DD] underline decoration-[#7F77DD]/50 hover:decoration-[#7F77DD] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend Code"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
