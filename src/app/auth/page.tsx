"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/genova/language-provider";
import { AuthForm } from "@/components/auth-form";
import { cn } from "@/lib/utils/cn";

export default function AuthPage() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "800px",
          height: "800px",
          background: "radial-gradient(circle, rgba(83,74,183,0.08) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
      />

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
          <Image src="/genova-logo.png" alt="Genova" width={40} height={40} className="h-10 w-10" />
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
