"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { AnimateIn } from "@/components/animate-in";
import { submitBusinessInquiryAction } from "@/app/actions/business";
import { useI18n } from "@/components/genova/language-provider";

const COUNTRY_CODES = [
  { code: "+1", country: "US", label: "🇺🇸 +1" },
  { code: "+1", country: "CA", label: "🇨🇦 +1" },
  { code: "+44", country: "UK", label: "🇬🇧 +44" },
  { code: "+61", country: "AU", label: "🇦🇺 +61" },
  { code: "+64", country: "NZ", label: "🇳🇿 +64" },
  { code: "+353", country: "IE", label: "🇮🇪 +353" },
  { code: "+82", country: "KR", label: "🇰🇷 +82" },
  { code: "+81", country: "JP", label: "🇯🇵 +81" },
];

const BUDGET_OPTION_DEFS = [
  { value: "under_1m", tKey: "business.budgetUnder1m" },
  { value: "1m_5m", tKey: "business.budget1m5m" },
  { value: "5m_10m", tKey: "business.budget5m10m" },
  { value: "over_10m", tKey: "business.budgetOver10m" },
  { value: "tbd", tKey: "business.budgetTbd" },
] as const;

export function BusinessApplyClient() {
  const { t } = useI18n();
  const [type, setType] = useState<"individual" | "business">("business");
  const [contactName, setContactName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const phone = phoneNumber.trim() ? `${countryCode} ${phoneNumber.trim()}` : "";
  const [productDescription, setProductDescription] = useState("");
  const [competitionConcept, setCompetitionConcept] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [desiredTimeline, setDesiredTimeline] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canSubmit = contactName.trim() && email.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorMsg(null);
    const res = await submitBusinessInquiryAction({
      type,
      contactName,
      companyName,
      email,
      phone,
      productDescription,
      competitionConcept,
      budgetRange,
      desiredTimeline,
      notes,
    });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      setErrorMsg(res.error);
    }
  };

  if (submitted) {
    return (
      <div className="-mt-16 min-h-screen bg-[#080618] pt-16">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
          <AnimateIn delay={0.05}>
            <div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.3)",
              }}
            >
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <h1
              className="text-[36px] font-black leading-tight text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              상담 신청 완료
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-white/55">
              신청이 접수되었습니다.
              <br />
              24시간 내 담당자가 입력하신 이메일로 연락드립니다.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/competition"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13px] font-bold text-white transition-all duration-300 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
                  boxShadow: "0 8px 32px rgba(83,74,183,0.5)",
                }}
              >
                진행 중인 공모전 보기
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-6 py-3 text-[13px] font-bold text-white/70 transition hover:border-white/25 hover:bg-white/[0.06] hover:text-white"
              >
                홈으로
              </Link>
            </div>
          </AnimateIn>
        </div>
      </div>
    );
  }

  return (
    <div className="-mt-16 min-h-screen bg-[#080618]">
      <div className="relative pt-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full"
            style={{
              background: "radial-gradient(ellipse, rgba(127,119,221,0.12) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        </div>
        <div
          className="pointer-events-none absolute left-0 right-0 top-16 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(127,119,221,0.5) 30%, rgba(175,169,236,0.3) 60%, transparent)",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-6 pb-24 pt-12">
          <AnimateIn delay={0.05}>
            <Link
              href="/business"
              className="mb-8 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-white/40 transition hover:text-white/70"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              뒤로
            </Link>

            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#7F77DD]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#AFA9EC]">
                Business Inquiry
              </span>
            </div>
            <h1
              className="text-[40px] font-black leading-tight text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              상담 신청
            </h1>
            <p className="mt-3 text-[14px] text-white/55">
              아래 정보를 입력해주세요. 24시간 내 담당자가 연락드립니다.
            </p>

            <div className="mt-10 space-y-6">
              {/* Type Tabs */}
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/55">
                  신청 유형
                </p>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
                  <button
                    type="button"
                    onClick={() => setType("business")}
                    className={`rounded-lg py-2.5 text-[13px] font-bold transition ${
                      type === "business"
                        ? "bg-white text-[#080618]"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    기업
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("individual")}
                    className={`rounded-lg py-2.5 text-[13px] font-bold transition ${
                      type === "individual"
                        ? "bg-white text-[#080618]"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    개인
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="담당자 이름" required>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={t("business.placeholderContactName")}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-[13px] text-white outline-none transition placeholder:text-white/30 focus:border-[#7F77DD]/50"
                  />
                </Field>
                {type === "business" && (
                  <Field label="회사명">
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={t("business.placeholderCompany")}
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-[13px] text-white outline-none transition placeholder:text-white/30 focus:border-[#7F77DD]/50"
                    />
                  </Field>
                )}
                <Field label="이메일" required>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@example.com"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-[13px] text-white outline-none transition placeholder:text-white/30 focus:border-[#7F77DD]/50"
                  />
                </Field>
                <Field label="연락처">
                  <div className="flex gap-2">
                    <select
                      value={`${countryCode}-${COUNTRY_CODES.findIndex((c) => c.code === countryCode)}`}
                      onChange={(e) => {
                        const idx = parseInt(e.target.value.split("-")[1], 10);
                        setCountryCode(COUNTRY_CODES[idx]?.code ?? "+1");
                      }}
                      className="shrink-0 cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-2.5 text-[13px] text-white outline-none transition focus:border-[#7F77DD]/50"
                    >
                      {COUNTRY_CODES.map((c, idx) => (
                        <option key={`${c.country}-${idx}`} value={`${c.code}-${idx}`} className="bg-[#080618]">
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={t("business.placeholderPhoneSample")}
                      className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-[13px] text-white outline-none transition placeholder:text-white/30 focus:border-[#7F77DD]/50"
                    />
                  </div>
                </Field>
              </div>

              {/* Project Info */}
              <Field label="제품/서비스 소개">
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder={t("business.placeholderProduct")}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-[13px] text-white outline-none transition placeholder:text-white/30 focus:border-[#7F77DD]/50"
                />
              </Field>

              <Field label="원하는 공모전 컨셉">
                <textarea
                  value={competitionConcept}
                  onChange={(e) => setCompetitionConcept(e.target.value)}
                  placeholder={t("business.placeholderConcept")}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-[13px] text-white outline-none transition placeholder:text-white/30 focus:border-[#7F77DD]/50"
                />
              </Field>

              {/* Budget */}
              <Field label="예상 예산">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {BUDGET_OPTION_DEFS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBudgetRange(opt.value)}
                      className={`rounded-lg border px-3 py-2.5 text-[12px] font-semibold transition ${
                        budgetRange === opt.value
                          ? "border-[#7F77DD]/50 bg-[#7F77DD]/15 text-white"
                          : "border-white/[0.08] bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {t(opt.tKey)}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="희망 일정">
                <input
                  type="text"
                  value={desiredTimeline}
                  onChange={(e) => setDesiredTimeline(e.target.value)}
                  placeholder={t("business.placeholderTimeline")}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-[13px] text-white outline-none transition placeholder:text-white/30 focus:border-[#7F77DD]/50"
                />
              </Field>

              <Field label="추가 요청사항">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("business.placeholderNotes")}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-[13px] text-white outline-none transition placeholder:text-white/30 focus:border-[#7F77DD]/50"
                />
              </Field>

              {/* Error */}
              {errorMsg && (
                <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-[12px] text-red-300">
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <Link
                  href="/business"
                  className="rounded-full border border-white/[0.12] bg-white/[0.03] px-6 py-3 text-[13px] font-bold text-white/70 transition hover:border-white/25 hover:bg-white/[0.06] hover:text-white"
                >
                  취소
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!canSubmit}
                  className="rounded-full px-8 py-3 text-[13px] font-bold text-white transition-all duration-300 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                  style={{
                    background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
                    boxShadow: "0 8px 32px rgba(83,74,183,0.5)",
                  }}
                >
                  {submitting ? "제출 중..." : "신청 제출"}
                </button>
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white/55">
        {label}
        {required && <span className="ml-1 text-[#AFA9EC]">*</span>}
      </p>
      {children}
    </div>
  );
}
