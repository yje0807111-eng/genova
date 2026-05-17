"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { updateCompetitionAction } from "@/app/actions/admin";
import { useI18n } from "@/components/genova/language-provider";
import { adminTokens } from "@/lib/admin-styles";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils/cn";
import { EditCompetitionImageFields } from "./edit-competition/edit-competition-image-fields";
import { EditCompetitionPrizeFields } from "./edit-competition/edit-competition-prize-fields";
import { EditCompetitionRulesFields } from "./edit-competition/edit-competition-rules-fields";
import type { JudgingRound, JudgingWeight } from "./edit-competition/types";

const inp =
  "w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3.5 py-2.5 text-[13px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#7F77DD]/45";

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.06] p-5" style={{ background: "var(--border-white-02)" }}>
      <div className="mb-4 flex items-baseline gap-2.5 border-b border-white/[0.05] pb-3">
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {hint && <span className="text-[11px] text-white/30">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export function EditCompetitionForm({ competition }: { competition: any }) {
  const { t } = useI18n();
  const router = useRouter();
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const sponsorLogoInputRef = useRef<HTMLInputElement>(null);

  const [langTab, setLangTab] = useState<"ko" | "en" | "ja">("ko");
  const [activeStep, setActiveStep] = useState(1);
  const [form, setForm] = useState({
    title_ko: competition.title_ko ?? competition.title ?? "",
    title_en: competition.title_en ?? "",
    title_ja: competition.title_ja ?? "",
    description_ko: competition.description_ko ?? competition.description ?? "",
    description_en: competition.description_en ?? "",
    description_ja: competition.description_ja ?? "",
    genre: competition.genre ?? "All",
    status: competition.status ?? "Open",
    deadline: competition.deadline ?? "",
    voteEnd: competition.vote_end ?? "",
    review_date: competition.review_date ?? "",
    ceremony_date: competition.ceremony_date ?? "",
    prize_info_ko: competition.prize_info_ko ?? competition.prize_info ?? "",
    prize_info_en: competition.prize_info_en ?? "",
    prize_info_ja: competition.prize_info_ja ?? "",
    sponsor: competition.sponsor ?? "",
    thumbnailUrl: competition.thumbnail_url ?? "",
    sponsorLogoUrl: competition.sponsor_logo_url ?? "",
    rules_ko: competition.rules_ko ?? competition.rules ?? "",
    rules_en: competition.rules_en ?? "",
    rules_ja: competition.rules_ja ?? "",
    eligibility_ko: competition.eligibility_ko ?? competition.eligibility ?? "",
    eligibility_en: competition.eligibility_en ?? "",
    eligibility_ja: competition.eligibility_ja ?? "",
    judging_criteria_ko: competition.judging_criteria_ko ?? competition.judging_criteria ?? "",
    judging_criteria_en: competition.judging_criteria_en ?? "",
    judging_criteria_ja: competition.judging_criteria_ja ?? "",
    judging_process_ko: competition.judging_process_ko ?? competition.judging_process ?? "",
    judging_process_en: competition.judging_process_en ?? "",
    judging_process_ja: competition.judging_process_ja ?? "",
    judging_rounds: (Array.isArray(competition.judging_rounds)
      ? (competition.judging_rounds as JudgingRound[])
      : []) as JudgingRound[],
    judging_weights: (Array.isArray(competition.judging_weights)
      ? (competition.judging_weights as JudgingWeight[])
      : []) as JudgingWeight[],
    submission_guidelines_ko: competition.submission_guidelines_ko ?? competition.submission_guidelines ?? "",
    submission_guidelines_en: competition.submission_guidelines_en ?? "",
    submission_guidelines_ja: competition.submission_guidelines_ja ?? "",
    announcement_ko: competition.announcement_ko ?? competition.announcement ?? "",
    announcement_en: competition.announcement_en ?? "",
    announcement_ja: competition.announcement_ja ?? "",
    concept_ko: competition.concept_ko ?? competition.concept ?? "",
    concept_en: competition.concept_en ?? "",
    concept_ja: competition.concept_ja ?? "",
    start_date: competition.start_date ?? "",
    prize_grand: competition.prize_grand ?? "",
    prize_excellence: competition.prize_excellence ?? "",
    prize_merit: competition.prize_merit ?? "",
    prize_audience: competition.prize_audience ?? "",
    prize_audience_count: competition.prize_audience_count ?? 1,
    templateUrl: competition.template_url ?? "",
    exchange_rate_usd_krw: competition.exchange_rate_usd_krw ?? 1350,
    exchange_rate_usd_jpy: competition.exchange_rate_usd_jpy ?? 148,
    base_currency: competition.base_currency ?? "USD",
    prizeInfo: competition.prize_info ?? "",
  });

  const [prizeAmount, setPrizeAmount] = useState(competition.prize_info?.replace(/[^\d]/g, "") ?? "");
  const [priceCurrency, setPriceCurrency] = useState<"KRW" | "USD" | "JPY">(
    (competition.base_currency as "KRW" | "USD" | "JPY") ?? "USD",
  );

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(competition.thumbnail_url ?? null);
  const [sponsorLogoPreview, setSponsorLogoPreview] = useState<string | null>(competition.sponsor_logo_url ?? null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Stable mount-time reference for D-day math (pure during render).
  const [nowMs] = useState(() => Date.now());

  const langSuffix =
    langTab === "ko"
      ? t("adminCompEdit.langSuffixKo", "(Korean)")
      : langTab === "en"
        ? t("adminCompEdit.langSuffixEn", "(English)")
        : t("adminCompEdit.langSuffixJa", "(Japanese)");

  const isoToLocal = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  // datetime-local 값을 안전하게 ISO로. 빈 값/부분 입력이면 ""을 반환해
  // `new Date("").toISOString()` RangeError 크래시를 막는다.
  const localToIso = (local: string) => {
    if (!local) return "";
    const d = new Date(local);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  };
  // 기준 날짜(없으면 현재) + days. 상대 빠른설정 칩에 사용.
  const shiftIso = (baseIso: string, days: number) => {
    const base = baseIso ? new Date(baseIso) : new Date(nowMs);
    const d = Number.isNaN(base.getTime()) ? new Date(nowMs) : base;
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };
  const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];
  const fmtDate = (iso: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} (${WEEKDAY_KO[d.getDay()]}) ${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const relDays = (iso: string) => {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return null;
    return Math.ceil((t - nowMs) / 86_400_000);
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return null;
    const safe = file.name.replace(/[^\w.-]/g, "_");
    const fullPath = `${path}/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("thumbnails").upload(fullPath, file, { upsert: true });
    if (error) return null;
    const {
      data: { publicUrl },
    } = supabase.storage.from("thumbnails").getPublicUrl(fullPath);
    return publicUrl;
  };

  const onThumbChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const preview = URL.createObjectURL(f);
    setThumbnailPreview(preview);
    const url = await uploadImage(f, "competitions");
    if (url) setForm((p) => ({ ...p, thumbnailUrl: url }));
  };

  const onSponsorLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const preview = URL.createObjectURL(f);
    setSponsorLogoPreview(preview);
    const url = await uploadImage(f, "competitions/logos");
    if (url) setForm((p) => ({ ...p, sponsorLogoUrl: url }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await updateCompetitionAction(competition.id, form);
      setMessage(
        res.ok
          ? t("adminCompEdit.saved", "Saved.")
          : res.message ?? t("adminCompEdit.saveFailed", "Failed."),
      );
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const applyPrize = (currency: "KRW" | "USD" | "JPY", amount: string) => {
    const sym = currency === "KRW" ? "₩" : currency === "USD" ? "$" : "¥";
    const formatted = amount ? `${sym}${Number(amount).toLocaleString()}` : "";
    setForm((p) => ({
      ...p,
      base_currency: currency,
      prizeInfo: formatted,
      prize_info_ko: formatted,
      prize_info_en: formatted,
      prize_info_ja: formatted,
    }));
  };

  const steps = [
    { n: 1, title: t("adminCompEdit.step1Title", "Basic Info"), short: t("adminCompEdit.step1Short", "Title · Intro · Category") },
    { n: 2, title: t("adminCompEdit.step2Title", "Schedule"), short: t("adminCompEdit.step2Short", "Submission · Voting period") },
    { n: 3, title: t("adminCompEdit.step3Title", "Prize · Exchange Rate"), short: t("adminCompEdit.step3Short", "Total · Conversion · Allocation") },
    { n: 4, title: t("adminCompEdit.step4Title", "Rules · Judging"), short: t("adminCompEdit.step4Short", "Theme · Eligibility · Judging") },
    { n: 5, title: t("adminCompEdit.step5Title", "Media"), short: t("adminCompEdit.step5Short", "Thumbnail · Logo") },
    { n: 6, title: t("adminCompEdit.step6Title", "Notice · Template"), short: t("adminCompEdit.step6Short", "Notice · Download") },
  ];
  const current = steps.find((s) => s.n === activeStep) ?? steps[0];

  // 내부 가시성 — 전체 상태를 한눈에 보기 위한 핵심 지표.
  const digits = (v: string) => Number(String(v ?? "").replace(/[^0-9]/g, "")) || 0;
  const sym = priceCurrency === "KRW" ? "₩" : priceCurrency === "USD" ? "$" : "¥";
  const prizeTotal = Number(prizeAmount) || 0;
  const prizeAllocated =
    digits(form.prize_grand) +
    digits(form.prize_excellence) +
    digits(form.prize_merit) +
    digits(form.prize_audience) * (form.prize_audience_count || 1);
  const prizeRemaining = prizeTotal - prizeAllocated;
  const prizeOver = prizeRemaining < 0;
  const displayTitle =
    form[`title_${langTab}` as "title_ko" | "title_en" | "title_ja"] ||
    form.title_ko ||
    form.title_en ||
    form.title_ja ||
    t("adminCompEdit.noTitle", "(No title)");
  const statusLabel =
    ({
      Open: t("adminCompEdit.statusOpen", "Open"),
      "In Review": t("adminCompEdit.statusInReview", "In Review"),
      Voting: t("adminCompEdit.statusVoting", "Voting"),
      Closed: t("adminCompEdit.statusClosed", "Closed"),
    } as Record<string, string>)[form.status] ?? form.status;
  const dDay = form.deadline
    ? Math.ceil((new Date(form.deadline).getTime() - nowMs) / 86_400_000)
    : null;

  const sectionState = (n: number): "ok" | "empty" | "warn" | "opt" => {
    switch (n) {
      case 1:
        return form.title_ko || form.title_en || form.title_ja ? "ok" : "empty";
      case 2:
        return form.deadline ? "ok" : "empty";
      case 3:
        return prizeOver ? "warn" : prizeTotal > 0 ? "ok" : "empty";
      case 4:
        return form.rules_ko || form.rules_en || form.rules_ja ? "ok" : "empty";
      case 5:
        return form.thumbnailUrl ? "ok" : "empty";
      case 6:
        return form.announcement_ko ||
          form.announcement_en ||
          form.announcement_ja ||
          form.templateUrl
          ? "ok"
          : "opt";
      default:
        return "opt";
    }
  };
  const dotColor: Record<"ok" | "empty" | "warn" | "opt", string> = {
    ok: "rgba(52,211,153,0.9)",
    empty: "rgba(255,255,255,0.18)",
    warn: "#f87171",
    opt: "rgba(255,255,255,0.10)",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8">
      <input ref={thumbInputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => void onThumbChange(e)} />
      <input
        ref={sponsorLogoInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void onSponsorLogoChange(e)}
      />

      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        {/* 상단 고정 바 — 제목 + 언어 전환 항상 접근 가능 */}
        <div
          className="sticky top-0 z-30 flex flex-col gap-3 rounded-2xl border border-white/[0.08] px-5 py-3 backdrop-blur-xl"
          style={{ background: "rgba(12,9,28,0.85)" }}
        >
         <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className={cn(adminTokens.buttonSecondary, "h-9 px-4 text-[12px]")}
            >
              ← {t("adminCompEdit.back", "Back")}
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/60">Admin</p>
              <h1 className="text-base font-black leading-tight text-white">{t("adminCompEdit.pageTitle", "Edit Competition")}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">{t("adminCompEdit.language", "Language")}</span>
            <div
              className="flex gap-1 rounded-lg p-0.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {(
                [
                  ["ko", t("adminCompEdit.langKo", "Korean")],
                  ["en", t("adminCompEdit.langEn", "English")],
                  ["ja", t("adminCompEdit.langJa", "Japanese")],
                ] as const
              ).map(([lang, label]) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLangTab(lang)}
                  className="rounded-md px-3 py-1.5 text-[11px] font-semibold transition"
                  style={{
                    background: langTab === lang ? "rgba(127,119,221,0.16)" : "transparent",
                    color: langTab === lang ? "#AFA9EC" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
         </div>

         {/* 요약 스트립 — 활성 섹션과 무관하게 핵심 상태 항상 표시 */}
         <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-white/[0.06] pt-2.5 text-[11px]">
           <span className="max-w-[280px] truncate font-bold text-white/85" title={displayTitle}>
             {displayTitle}
           </span>
           <span
             className="rounded px-1.5 py-0.5 text-[10px] font-bold"
             style={{ background: "rgba(127,119,221,0.16)", color: "#AFA9EC" }}
           >
             {statusLabel}
           </span>
           <span className="text-white/40">
             {t("adminCompEdit.summaryDeadline", "Deadline")}{" "}
             <span className="font-semibold text-white/70">
               {dDay == null
                 ? t("adminCompEdit.notSet", "Not set")
                 : dDay >= 0
                   ? `D-${dDay}`
                   : t("adminCompEdit.endedDaysAgo", "{n}d since end").replace("{n}", String(-dDay))}
             </span>
           </span>
           <span className="text-white/40">
             {t("adminCompEdit.summaryTotalPrize", "Total Prize")}{" "}
             <span className="font-semibold text-white/70">
               {prizeTotal ? `${sym}${prizeTotal.toLocaleString()}` : "—"}
             </span>
           </span>
           <span className="text-white/40">
             {t("adminCompEdit.summaryAllocation", "Allocation")}{" "}
             <span className="font-bold" style={{ color: prizeOver ? "#f87171" : "#34d399" }}>
               {prizeTotal === 0
                 ? "—"
                 : prizeOver
                   ? `${t("adminCompEdit.over", "Over")} ${sym}${Math.abs(prizeRemaining).toLocaleString()}`
                   : `${t("adminCompEdit.remaining", "Remaining")} ${sym}${prizeRemaining.toLocaleString()}`}
             </span>
           </span>
         </div>
        </div>

        <div className="lg:grid lg:grid-cols-[210px_1fr] lg:gap-5">
          {/* 좌측 섹션 네비 — lg에서 고정, 모바일에선 가로 스크롤 */}
          <nav className="mb-4 flex gap-1.5 overflow-x-auto pb-1 lg:sticky lg:top-[88px] lg:mb-0 lg:flex-col lg:self-start lg:overflow-visible lg:pb-0">
            {steps.map((s) => {
              const isActive = s.n === activeStep;
              const st = sectionState(s.n);
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setActiveStep(s.n)}
                  className="flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition lg:shrink"
                  style={{
                    borderColor: isActive ? "rgba(127,119,221,0.35)" : "rgba(255,255,255,0.06)",
                    background: isActive ? "rgba(127,119,221,0.10)" : "rgba(255,255,255,0.02)",
                  }}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
                    style={{
                      background: isActive ? "rgba(127,119,221,0.22)" : "rgba(255,255,255,0.05)",
                      color: isActive ? "#AFA9EC" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {s.n}
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block text-[12px] font-bold"
                      style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.6)" }}
                    >
                      {s.title}
                    </span>
                    <span className="hidden truncate text-[10px] text-white/25 lg:block">{s.short}</span>
                  </span>
                  <span
                    className="ml-auto h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: dotColor[st],
                      boxShadow: st === "warn" ? "0 0 6px rgba(248,113,113,0.7)" : "none",
                    }}
                    title={
                      st === "ok"
                        ? t("adminCompEdit.dotFilled", "Filled")
                        : st === "warn"
                          ? t("adminCompEdit.dotWarn", "Needs review (prize allocation exceeded)")
                          : st === "empty"
                            ? t("adminCompEdit.dotEmpty", "Not filled")
                            : t("adminCompEdit.dotOptional", "Optional")
                    }
                  />
                </button>
              );
            })}
          </nav>

          {/* 우측 — 활성 섹션 패널 */}
          <div>
            {activeStep === 1 && (
              <Section title={current.title} hint={current.short}>
                <div className="space-y-4">
                  <div>
                    <label className={adminTokens.inputLabel}>{t("adminCompEdit.fieldTitle", "Title")} {langSuffix}</label>
                      <input
                        value={form[`title_${langTab}` as "title_ko" | "title_en" | "title_ja"]}
                        onChange={(e) => setForm((p) => ({ ...p, [`title_${langTab}`]: e.target.value } as typeof p))}
                        className={inp}
                        placeholder={
                          langTab === "ko"
                            ? t("adminCompEdit.titlePhKo", "Competition title (Korean)")
                            : langTab === "en"
                              ? t("adminCompEdit.titlePhEn", "Competition title (English)")
                              : t("adminCompEdit.titlePhJa", "Competition title (Japanese)")
                        }
                      />
                    </div>
                    <div>
                      <label className={adminTokens.inputLabel}>{t("adminCompEdit.fieldSubtitle", "Subtitle")} {langSuffix}</label>
                      <input
                        value={form[`description_${langTab}` as "description_ko" | "description_en" | "description_ja"]}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, [`description_${langTab}`]: e.target.value } as typeof p))
                        }
                        className={inp}
                        placeholder={t("adminCompEdit.subtitlePh", "e.g. A global competition for AI video creators")}
                      />
                  </div>
                  <div>
                    <label className={adminTokens.inputLabel}>{t("adminCompEdit.fieldConcept", "Competition Intro")} {langSuffix}</label>
                    <textarea
                      value={form[`concept_${langTab}` as "concept_ko" | "concept_en" | "concept_ja"]}
                      onChange={(e) => setForm((p) => ({ ...p, [`concept_${langTab}`]: e.target.value } as typeof p))}
                      rows={4}
                      className={inp + " resize-none"}
                      placeholder={
                        langTab === "ko"
                          ? t("adminCompEdit.conceptPhKo", "Describe the theme, direction, and creative intent...")
                          : langTab === "en"
                            ? t("adminCompEdit.conceptPhEn", "Describe the theme, direction, and creative intent...")
                            : t("adminCompEdit.conceptPhJa", "Describe the theme, direction, and creative intent...")
                      }
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={adminTokens.inputLabel}>{t("adminCompEdit.fieldGenre", "Genre")}</label>
                      <select
                        value={form.genre}
                        onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))}
                        className={inp}
                      >
                        <option value="All">{t("adminCompEdit.genreAll", "All Genres")}</option>
                        <option value="film">{t("adminCompEdit.genreFilm", "Short Film")}</option>
                        <option value="animation">{t("adminCompEdit.genreAnimation", "Animation")}</option>
                        <option value="music">{t("adminCompEdit.genreMusic", "Music Video")}</option>
                        <option value="daily">{t("adminCompEdit.genreDaily", "Daily")}</option>
                        <option value="art">{t("adminCompEdit.genreArt", "Art")}</option>
                      </select>
                    </div>
                    <div>
                      <label className={adminTokens.inputLabel}>{t("adminCompEdit.fieldStatus", "Status")}</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                        className={inp}
                      >
                        <option value="Open">{t("adminCompEdit.statusOpen", "Open")}</option>
                        <option value="In Review">{t("adminCompEdit.statusInReview", "In Review")}</option>
                        <option value="Voting">{t("adminCompEdit.statusVoting", "Voting")}</option>
                        <option value="Closed">{t("adminCompEdit.statusClosed", "Closed")}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={adminTokens.inputLabel}>{t("adminCompEdit.fieldSponsor", "Sponsor")}</label>
                    <input
                      value={form.sponsor}
                      onChange={(e) => setForm((p) => ({ ...p, sponsor: e.target.value }))}
                      className={inp}
                      placeholder={t("adminCompEdit.sponsorPh", "e.g. Runway, Kling AI")}
                    />
                  </div>
                </div>
              </Section>
            )}

            {activeStep === 2 && (
              <Section title={current.title} hint={current.short}>
                {(() => {
                  const chip =
                    "rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-white/55 transition hover:border-[#7F77DD]/40 hover:text-[#AFA9EC]";
                  const Preview = ({ iso }: { iso: string }) => {
                    const f = fmtDate(iso);
                    const rd = relDays(iso);
                    if (!f) return <p className="mt-1 text-[10px] text-white/25">{t("adminCompEdit.selectDate", "Select a date")}</p>;
                    return (
                      <p className="mt-1 text-[10px] text-white/40">
                        {f}
                        {rd != null && (
                          <span className="ml-1 text-[#AFA9EC]">
                            · {rd >= 0 ? `D-${rd}` : t("adminCompEdit.daysAgo", "{n}d ago").replace("{n}", String(-rd))}
                          </span>
                        )}
                      </p>
                    );
                  };
                  const Warn = ({ msg }: { msg: string }) => (
                    <p className="mt-1 text-[10px] font-medium text-red-400">⚠ {msg}</p>
                  );
                  const startT = form.start_date ? new Date(form.start_date).getTime() : NaN;
                  const deadT = form.deadline ? new Date(form.deadline).getTime() : NaN;
                  const voteT = form.voteEnd ? new Date(form.voteEnd).getTime() : NaN;
                  const deadBad = !Number.isNaN(startT) && !Number.isNaN(deadT) && deadT <= startT;
                  const voteBad = !Number.isNaN(deadT) && !Number.isNaN(voteT) && voteT <= deadT;
                  return (
                    <div className="grid gap-5 sm:grid-cols-3">
                      <div>
                        <label className={adminTokens.inputLabel}>{t("adminCompEdit.startDate", "Submission Start")}</label>
                        <input
                          type="datetime-local"
                          value={isoToLocal(form.start_date)}
                          onChange={(e) => setForm((p) => ({ ...p, start_date: localToIso(e.target.value) }))}
                          className={inp}
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, start_date: shiftIso("", 0) }))}>
                            {t("adminCompEdit.chipNow", "Now")}
                          </button>
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, start_date: shiftIso("", 7) }))}>
                            {t("adminCompEdit.chipPlus1w", "+1w")}
                          </button>
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, start_date: shiftIso("", 30) }))}>
                            {t("adminCompEdit.chipPlus1m", "+1mo")}
                          </button>
                        </div>
                        <Preview iso={form.start_date} />
                      </div>
                      <div>
                        <label className={adminTokens.inputLabel}>{t("adminCompEdit.deadlineDate", "Submission Deadline")}</label>
                        <input
                          type="datetime-local"
                          value={isoToLocal(form.deadline)}
                          onChange={(e) => setForm((p) => ({ ...p, deadline: localToIso(e.target.value) }))}
                          className={inp}
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, deadline: shiftIso(p.start_date, 7) }))}>
                            {t("adminCompEdit.chipStartPlus1w", "Start+1w")}
                          </button>
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, deadline: shiftIso(p.start_date, 14) }))}>
                            {t("adminCompEdit.chipPlus2w", "+2w")}
                          </button>
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, deadline: shiftIso(p.start_date, 30) }))}>
                            {t("adminCompEdit.chipPlus1m", "+1mo")}
                          </button>
                        </div>
                        <Preview iso={form.deadline} />
                        {deadBad && <Warn msg={t("adminCompEdit.warnDeadlineBeforeStart", "Deadline is earlier than start date")} />}
                      </div>
                      <div>
                        <label className={adminTokens.inputLabel}>{t("adminCompEdit.voteEndDate", "Voting Deadline")}</label>
                        <input
                          type="datetime-local"
                          value={isoToLocal(form.voteEnd)}
                          onChange={(e) => setForm((p) => ({ ...p, voteEnd: localToIso(e.target.value) }))}
                          className={inp}
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, voteEnd: shiftIso(p.deadline, 3) }))}>
                            {t("adminCompEdit.chipDeadlinePlus3d", "Deadline+3d")}
                          </button>
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, voteEnd: shiftIso(p.deadline, 7) }))}>
                            {t("adminCompEdit.chipPlus1w", "+1w")}
                          </button>
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, voteEnd: shiftIso(p.deadline, 14) }))}>
                            {t("adminCompEdit.chipPlus2w", "+2w")}
                          </button>
                        </div>
                        <Preview iso={form.voteEnd} />
                        {voteBad && <Warn msg={t("adminCompEdit.warnVoteBeforeDeadline", "Voting deadline is earlier than submission deadline")} />}
                      </div>
                      <div>
                        <label className={adminTokens.inputLabel}>{t("adminCompEdit.reviewDate", "심사 날짜")}</label>
                        <input
                          type="datetime-local"
                          value={isoToLocal(form.review_date)}
                          onChange={(e) => setForm((p) => ({ ...p, review_date: localToIso(e.target.value) }))}
                          className={inp}
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, review_date: shiftIso(p.deadline, 3) }))}>
                            {t("adminCompEdit.chipDeadlinePlus3d", "Deadline+3d")}
                          </button>
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, review_date: shiftIso(p.deadline, 7) }))}>
                            {t("adminCompEdit.chipPlus1w", "+1w")}
                          </button>
                        </div>
                        <Preview iso={form.review_date} />
                      </div>
                      <div>
                        <label className={adminTokens.inputLabel}>{t("adminCompEdit.ceremonyDate", "시상식 날짜")}</label>
                        <input
                          type="datetime-local"
                          value={isoToLocal(form.ceremony_date)}
                          onChange={(e) => setForm((p) => ({ ...p, ceremony_date: localToIso(e.target.value) }))}
                          className={inp}
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, ceremony_date: shiftIso(p.voteEnd, 3) }))}>
                            {t("adminCompEdit.chipVotePlus3d", "Vote+3d")}
                          </button>
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, ceremony_date: shiftIso(p.voteEnd, 7) }))}>
                            {t("adminCompEdit.chipPlus1w", "+1w")}
                          </button>
                        </div>
                        <Preview iso={form.ceremony_date} />
                      </div>
                    </div>
                  );
                })()}
              </Section>
            )}

            {activeStep === 3 && (
              <Section title={current.title} hint={current.short}>
                <div className="space-y-5">
                  <div>
                    <label className={adminTokens.inputLabel}>{t("adminCompEdit.totalPrize", "Total Prize")}</label>
                      <div className="flex gap-1.5">
                        <div className="flex gap-1">
                          {(["KRW", "USD", "JPY"] as const).map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setPriceCurrency(c);
                                applyPrize(c, prizeAmount);
                              }}
                              className="rounded-lg border px-2.5 py-2 text-[11px] font-bold transition"
                              style={{
                                borderColor: priceCurrency === c ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                                background: priceCurrency === c ? "rgba(127,119,221,0.14)" : "transparent",
                                color: priceCurrency === c ? "#AFA9EC" : "rgba(255,255,255,0.35)",
                              }}
                            >
                              {c === "KRW"
                                ? t("adminCompEdit.curKrw", "₩ KRW")
                                : c === "USD"
                                  ? t("adminCompEdit.curUsd", "$ USD")
                                  : t("adminCompEdit.curJpy", "¥ JPY")}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={prizeAmount ? Number(prizeAmount).toLocaleString() : ""}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, "");
                            setPrizeAmount(raw);
                            applyPrize(priceCurrency, raw);
                          }}
                          className={inp}
                          placeholder={t("adminCompEdit.amountPh", "Enter amount (e.g. 1,000,000)")}
                        />
                      </div>
                      {form.prizeInfo && <p className="mt-1 text-[10px] text-[#AFA9EC]">{t("adminCompEdit.totalPrizeLabel", "Total Prize")}: {form.prizeInfo}</p>}
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="mb-1 text-[11px] font-bold text-[#AFA9EC]">{t("adminCompEdit.fixedRateTitle", "Fixed Exchange Rate")}</p>
                      <p className="mb-2.5 text-[10px] text-white/30">
                        {t("adminCompEdit.fixedRateDesc", "Enter the exchange rate at competition start. The converted amount is shown to users.")}
                      </p>
                      <div className="space-y-2">
                        <div>
                          <label className={adminTokens.inputLabel}>{t("adminCompEdit.baseCurrency", "Base Currency")}</label>
                          <select
                            value={form.base_currency}
                            onChange={(e) => setForm((p) => ({ ...p, base_currency: e.target.value }))}
                            className={inp}
                          >
                            <option value="USD">{t("adminCompEdit.baseUsd", "USD (Dollar)")}</option>
                            <option value="KRW">{t("adminCompEdit.baseKrw", "KRW (Won)")}</option>
                            <option value="JPY">{t("adminCompEdit.baseJpy", "JPY (Yen)")}</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={adminTokens.inputLabel}>1 USD = ? KRW</label>
                            <input
                              type="number"
                              value={form.exchange_rate_usd_krw}
                              onChange={(e) => setForm((p) => ({ ...p, exchange_rate_usd_krw: Number(e.target.value) }))}
                              className={inp}
                              placeholder={t("adminCompEdit.ratePhKrw", "e.g. 1350")}
                            />
                          </div>
                          <div>
                            <label className={adminTokens.inputLabel}>1 USD = ? JPY</label>
                            <input
                              type="number"
                              value={form.exchange_rate_usd_jpy}
                              onChange={(e) => setForm((p) => ({ ...p, exchange_rate_usd_jpy: Number(e.target.value) }))}
                              className={inp}
                              placeholder={t("adminCompEdit.ratePhJpy", "e.g. 148")}
                            />
                          </div>
                        </div>
                        {form.prize_info_en && (
                          <div className="rounded-lg border border-white/[0.06] bg-[#0a0a0a] p-2">
                            <p className="mb-1 text-[10px] text-white/30">{t("adminCompEdit.preview", "Preview")}</p>
                            <p className="text-[11px] text-white/55">USD · {form.prize_info_en}</p>
                            <p className="text-[11px] text-white/55">KRW · {form.prize_info_ko || form.prize_info_en}</p>
                            <p className="text-[11px] text-white/55">JPY · {form.prize_info_ja || form.prize_info_en}</p>
                          </div>
                        )}
                      </div>
                    </div>

                  <div>
                    <p className="mb-3 text-[12px] font-bold text-white/55">{t("adminCompEdit.prizeAllocation", "Prize Allocation")}</p>
                    <EditCompetitionPrizeFields
                      form={form}
                      setForm={setForm}
                      prizeAmount={prizeAmount}
                      priceCurrency={priceCurrency}
                    />
                  </div>
                </div>
              </Section>
            )}

            {activeStep === 4 && (
              <Section title={current.title} hint={langSuffix}>
                <EditCompetitionRulesFields form={form} setForm={setForm} langTab={langTab} />
              </Section>
            )}

            {activeStep === 5 && (
              <Section title={current.title} hint={current.short}>
                <EditCompetitionImageFields
                  setForm={setForm}
                  thumbInputRef={thumbInputRef}
                  sponsorLogoInputRef={sponsorLogoInputRef}
                  thumbnailPreview={thumbnailPreview}
                  setThumbnailPreview={setThumbnailPreview}
                  sponsorLogoPreview={sponsorLogoPreview}
                  setSponsorLogoPreview={setSponsorLogoPreview}
                />
              </Section>
            )}

            {activeStep === 6 && (
              <Section title={current.title} hint={langSuffix}>
                <div className="space-y-3">
                  <div>
                    <label className={adminTokens.inputLabel}>{t("adminCompEdit.fieldAnnouncement", "Announcement")} {langSuffix}</label>
                    <textarea
                      value={form[`announcement_${langTab}` as "announcement_ko" | "announcement_en" | "announcement_ja"]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [`announcement_${langTab}`]: e.target.value } as typeof p))
                      }
                      rows={5}
                      className={inp + " resize-none"}
                      placeholder={
                        langTab === "ko"
                          ? t("adminCompEdit.announcementPhKo", "Sponsor announcements, special notices...")
                          : langTab === "en"
                            ? t("adminCompEdit.announcementPhEn", "Sponsor announcements, special notices...")
                            : t("adminCompEdit.announcementPhJa", "Sponsor announcements, special notices...")
                      }
                    />
                  </div>
                  <div>
                    <label className={adminTokens.inputLabel}>{t("adminCompEdit.templateUrl", "Template Download URL")}</label>
                    <input
                      value={form.templateUrl}
                      onChange={(e) => setForm((p) => ({ ...p, templateUrl: e.target.value }))}
                      className={inp}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </Section>
            )}

            {/* 하단 고정 바 — 이전/다음 + 저장 */}
            <div
              className="sticky bottom-0 z-20 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] px-5 py-3 backdrop-blur-xl"
              style={{ background: "rgba(12,9,28,0.85)" }}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activeStep === 1}
                  onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
                  className={cn(adminTokens.buttonSecondary, "h-9 px-4 text-[12px] disabled:opacity-30")}
                >
                  ← {t("adminCompEdit.prev", "Prev")}
                </button>
                <button
                  type="button"
                  disabled={activeStep === steps.length}
                  onClick={() => setActiveStep((s) => Math.min(steps.length, s + 1))}
                  className={cn(adminTokens.buttonSecondary, "h-9 px-4 text-[12px] disabled:opacity-30")}
                >
                  {t("adminCompEdit.next", "Next")} →
                </button>
                <span className="ml-1 text-[11px] text-white/30">
                  {activeStep} / {steps.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {message && (
                  <p
                    className={`text-xs font-medium ${message === t("adminCompEdit.saved", "Saved.") ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(adminTokens.buttonPrimary, "h-9 px-6 text-[12px] disabled:opacity-50")}
                >
                  {loading ? t("adminCompEdit.saving", "Saving...") : t("adminCompEdit.save", "Save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
