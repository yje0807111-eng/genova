"use client";

import Link from "next/link";
import { useI18n } from "@/components/genova/language-provider";
import { AuthForm } from "@/components/auth-form";
import { cn } from "@/lib/utils/cn";

export default function AuthPage() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* 살아있는 그라데이션 메시 — 느리게 표류하는 보라 blob 3개 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 32%, rgba(83,74,183,0.13) 0%, rgba(83,74,183,0.04) 45%, transparent 70%)",
          }}
        />
        <div
          className="auth-mesh-a absolute left-[2%] top-[6%] h-[58vh] w-[58vh] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(127,119,221,0.30) 0%, transparent 66%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="auth-mesh-b absolute right-[0%] top-[18%] h-[64vh] w-[64vh] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(83,74,183,0.32) 0%, transparent 66%)",
            filter: "blur(90px)",
          }}
        />
        <div
          className="auth-mesh-c absolute bottom-[-8%] left-[24%] h-[56vh] w-[68vh] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(175,169,236,0.22) 0%, transparent 66%)",
            filter: "blur(90px)",
          }}
        />
      </div>

      <Link
        href="/"
        className="group absolute left-6 top-6 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[12px] font-semibold text-white/55 backdrop-blur-md transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
      >
        {t("auth.browseExplore")}
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </Link>
      <div className="absolute right-6 top-6 z-10">
        <div className="flex gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] p-1 backdrop-blur-md">
          {(["en", "ko", "ja"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLocale(lang)}
              className={cn(
                "h-7 rounded-full px-3 text-[11px] font-semibold transition",
                locale === lang ? "bg-white/10 text-white" : "text-white/35 hover:text-white/70",
              )}
            >
              {lang === "en" ? "EN" : lang === "ko" ? "KO" : "JA"}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 mb-10 flex flex-col items-center">
        <Link href="/" className="mb-4 flex items-center gap-3">
          <img src="/genova-logo.png" alt="Genova" className="h-10 w-10 object-contain" />
          <span className="text-3xl font-black tracking-tight text-white">Genova</span>
        </Link>
        <p className="text-[14px] text-white/50">The Home of AI Filmmakers</p>
      </div>

      <div className="relative z-10 w-full max-w-[400px]">
        <AuthForm />

        <p className="mt-8 text-center text-[11px] text-white/30">
          {t("auth.agreementPrefix")}
          <Link href="/terms" className="text-white/50 underline transition hover:text-white/70">
            {t("footer.terms")}
          </Link>
          {t("auth.agreementMiddle")}
          <Link href="/privacy" className="text-white/50 underline transition hover:text-white/70">
            {t("footer.privacy")}
          </Link>
          {t("auth.agreementSuffix")}
        </p>
      </div>
    </div>
  );
}
