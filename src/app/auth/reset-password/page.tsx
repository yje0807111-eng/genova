"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { useI18n } from "@/components/genova/language-provider";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t("resetPassword.mismatch", "비밀번호가 일치하지 않습니다"));
      return;
    }
    if (password.length < 8) {
      setError(t("resetPassword.tooShort", "비밀번호는 8자 이상이어야 합니다"));
      return;
    }

    setSubmitting(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/profile/settings");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-[20px] font-bold text-white">
          {t("resetPassword.title", "새 비밀번호 설정")}
        </h1>
        <p className="mb-6 text-[13px] text-white/45">
          {t("resetPassword.subtitle", "새로운 비밀번호를 입력해주세요")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-[12px] font-semibold text-white/55">
              {t("resetPassword.newPassword", "새 비밀번호")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder={t("resetPassword.newPasswordPlaceholder", "8자 이상")}
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[13px] text-white placeholder:text-white/30 outline-none transition focus:border-[#7F77DD]/40"
            />
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-semibold text-white/55">
              {t("resetPassword.confirm", "비밀번호 확인")}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[13px] text-white placeholder:text-white/30 outline-none transition focus:border-[#7F77DD]/40"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#534AB7] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#6b5fd4] disabled:opacity-50"
          >
            {submitting
              ? t("resetPassword.submitting", "변경 중...")
              : t("resetPassword.submit", "비밀번호 변경")}
          </button>
        </form>
      </div>
    </div>
  );
}
