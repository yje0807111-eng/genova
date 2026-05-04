"use client";

import { useI18n } from "@/components/genova/language-provider";
import { AuthForm } from "@/components/auth-form";

export default function AuthPage() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080618]">
      {/* 배경 글로우 */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(83,74,183,0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(127,119,221,0.08) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-[420px]">

          {/* 로고 */}
          <div className="mb-8 text-center">
            <div className="mb-3 flex items-center justify-center gap-2">
              <img src="/genova-logo.png" alt="Genova" className="h-10 w-10" />
              <span className="text-3xl font-black tracking-[-0.06em] text-white">Genova</span>
            </div>
            <p className="text-sm text-white/35">The Home of AI Filmmakers</p>
            {/* 언어 선택 */}
            <div className="mt-4 flex items-center justify-center gap-1">
              {(["en", "ko", "ja"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLocale(lang)}
                  className="rounded-lg px-3 py-1 text-xs font-medium transition"
                  style={{
                    background: locale === lang ? "rgba(83,74,183,0.4)" : "transparent",
                    border:
                      locale === lang
                        ? "1px solid rgba(127,119,221,0.4)"
                        : "1px solid rgba(255,255,255,0.08)",
                    color: locale === lang ? "#AFA9EC" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {lang === "en" ? "EN" : lang === "ko" ? "KO" : "JA"}
                </button>
              ))}
            </div>
          </div>

          {/* 폼 박스 */}
          <div
            className="rounded-2xl border border-white/[0.08] p-6"
            style={{
              background: "linear-gradient(135deg, rgba(20,17,50,0.98) 0%, rgba(10,8,28,0.99) 100%)",
              boxShadow: "0 0 0 1px rgba(127,119,221,0.08), 0 40px 80px rgba(0,0,0,0.5)",
            }}
          >
            <AuthForm />
          </div>

          {/* 하단 안내 */}
          <p className="mt-6 text-center text-xs text-white/20">
            By continuing, you agree to Genova's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
