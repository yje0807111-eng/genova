"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { updateCompetitionAction } from "@/app/actions/admin";
import { adminTokens } from "@/lib/admin-styles";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils/cn";
import { EditCompetitionImageFields } from "./edit-competition/edit-competition-image-fields";
import { EditCompetitionPrizeFields } from "./edit-competition/edit-competition-prize-fields";
import { EditCompetitionRulesFields } from "./edit-competition/edit-competition-rules-fields";

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
  const router = useRouter();
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const sponsorLogoInputRef = useRef<HTMLInputElement>(null);

  const [langTab, setLangTab] = useState<"ko" | "en" | "ja">("ko");
  const [activeStep, setActiveStep] = useState(1);
  const [form, setForm] = useState({
    title_ko: competition.title_ko ?? competition.title ?? "",
    title_en: competition.title_en ?? "",
    title_ja: competition.title_ja ?? "",
    description: competition.description ?? "",
    genre: competition.genre ?? "All",
    status: competition.status ?? "Open",
    deadline: competition.deadline ?? "",
    voteEnd: competition.vote_end ?? "",
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

  const langSuffix = langTab === "ko" ? "(한국어)" : langTab === "en" ? "(영어)" : "(일본어)";

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
      setMessage(res.ok ? "저장되었습니다." : res.message ?? "실패했습니다.");
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
    { n: 1, title: "기본 정보", short: "제목·소개·분류" },
    { n: 2, title: "일정", short: "접수·투표 기간" },
    { n: 3, title: "상금 · 환율", short: "총상금·환산·배분" },
    { n: 4, title: "규칙 · 심사", short: "주제·자격·심사" },
    { n: 5, title: "미디어", short: "썸네일·로고" },
    { n: 6, title: "공지 · 템플릿", short: "공지·다운로드" },
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
    "(제목 없음)";
  const statusLabel =
    ({ Open: "모집중", "In Review": "심사중", Voting: "투표중", Closed: "종료" } as Record<string, string>)[
      form.status
    ] ?? form.status;
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
              ← 돌아가기
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/60">Admin</p>
              <h1 className="text-base font-black leading-tight text-white">공모전 수정</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">언어</span>
            <div
              className="flex gap-1 rounded-lg p-0.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {(
                [
                  ["ko", "한국어"],
                  ["en", "English"],
                  ["ja", "日本語"],
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
             마감{" "}
             <span className="font-semibold text-white/70">
               {dDay == null ? "미설정" : dDay >= 0 ? `D-${dDay}` : `종료 ${-dDay}일 경과`}
             </span>
           </span>
           <span className="text-white/40">
             총상금{" "}
             <span className="font-semibold text-white/70">
               {prizeTotal ? `${sym}${prizeTotal.toLocaleString()}` : "—"}
             </span>
           </span>
           <span className="text-white/40">
             배분{" "}
             <span className="font-bold" style={{ color: prizeOver ? "#f87171" : "#34d399" }}>
               {prizeTotal === 0
                 ? "—"
                 : prizeOver
                   ? `초과 ${sym}${Math.abs(prizeRemaining).toLocaleString()}`
                   : `잔액 ${sym}${prizeRemaining.toLocaleString()}`}
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
                        ? "입력됨"
                        : st === "warn"
                          ? "확인 필요 (상금 배분 초과)"
                          : st === "empty"
                            ? "미입력"
                            : "선택"
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
                    <label className={adminTokens.inputLabel}>제목 {langSuffix}</label>
                      <input
                        value={form[`title_${langTab}` as "title_ko" | "title_en" | "title_ja"]}
                        onChange={(e) => setForm((p) => ({ ...p, [`title_${langTab}`]: e.target.value } as typeof p))}
                        className={inp}
                        placeholder={
                          langTab === "ko"
                            ? "공모전 제목 (한국어)"
                            : langTab === "en"
                              ? "Competition title (English)"
                              : "コンペタイトル（日本語）"
                        }
                      />
                    </div>
                    <div>
                      <label className={adminTokens.inputLabel}>서브제목</label>
                      <input
                        value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        className={inp}
                        placeholder="예: AI 영상 창작자를 위한 글로벌 공모전"
                      />
                  </div>
                  <div>
                    <label className={adminTokens.inputLabel}>공모전 소개 {langSuffix}</label>
                    <textarea
                      value={form[`concept_${langTab}` as "concept_ko" | "concept_en" | "concept_ja"]}
                      onChange={(e) => setForm((p) => ({ ...p, [`concept_${langTab}`]: e.target.value } as typeof p))}
                      rows={4}
                      className={inp + " resize-none"}
                      placeholder={
                        langTab === "ko"
                          ? "공모전의 주제, 방향성, 창작 의도를 설명하세요..."
                          : langTab === "en"
                            ? "Describe the theme, direction, and creative intent..."
                            : "テーマ、方向性、創作意図を説明してください..."
                      }
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={adminTokens.inputLabel}>장르</label>
                      <select
                        value={form.genre}
                        onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))}
                        className={inp}
                      >
                        <option value="All">전체 장르</option>
                        <option value="film">단편영화</option>
                        <option value="animation">애니메이션</option>
                        <option value="music">뮤직비디오</option>
                        <option value="daily">일상</option>
                        <option value="art">아트</option>
                      </select>
                    </div>
                    <div>
                      <label className={adminTokens.inputLabel}>상태</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                        className={inp}
                      >
                        <option value="Open">모집중</option>
                        <option value="In Review">심사중</option>
                        <option value="Voting">투표중</option>
                        <option value="Closed">종료</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={adminTokens.inputLabel}>스폰서</label>
                    <input
                      value={form.sponsor}
                      onChange={(e) => setForm((p) => ({ ...p, sponsor: e.target.value }))}
                      className={inp}
                      placeholder="예: Runway, Kling AI"
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
                    if (!f) return <p className="mt-1 text-[10px] text-white/25">날짜를 선택하세요</p>;
                    return (
                      <p className="mt-1 text-[10px] text-white/40">
                        {f}
                        {rd != null && (
                          <span className="ml-1 text-[#AFA9EC]">
                            · {rd >= 0 ? `D-${rd}` : `${-rd}일 경과`}
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
                        <label className={adminTokens.inputLabel}>접수 시작일</label>
                        <input
                          type="datetime-local"
                          value={isoToLocal(form.start_date)}
                          onChange={(e) => setForm((p) => ({ ...p, start_date: localToIso(e.target.value) }))}
                          className={inp}
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, start_date: shiftIso("", 0) }))}>
                            지금
                          </button>
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, start_date: shiftIso("", 7) }))}>
                            +1주
                          </button>
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, start_date: shiftIso("", 30) }))}>
                            +1달
                          </button>
                        </div>
                        <Preview iso={form.start_date} />
                      </div>
                      <div>
                        <label className={adminTokens.inputLabel}>접수 마감일</label>
                        <input
                          type="datetime-local"
                          value={isoToLocal(form.deadline)}
                          onChange={(e) => setForm((p) => ({ ...p, deadline: localToIso(e.target.value) }))}
                          className={inp}
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, deadline: shiftIso(p.start_date, 7) }))}>
                            시작+1주
                          </button>
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, deadline: shiftIso(p.start_date, 14) }))}>
                            +2주
                          </button>
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, deadline: shiftIso(p.start_date, 30) }))}>
                            +1달
                          </button>
                        </div>
                        <Preview iso={form.deadline} />
                        {deadBad && <Warn msg="마감이 시작일보다 빠릅니다" />}
                      </div>
                      <div>
                        <label className={adminTokens.inputLabel}>투표 마감일</label>
                        <input
                          type="datetime-local"
                          value={isoToLocal(form.voteEnd)}
                          onChange={(e) => setForm((p) => ({ ...p, voteEnd: localToIso(e.target.value) }))}
                          className={inp}
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, voteEnd: shiftIso(p.deadline, 3) }))}>
                            마감+3일
                          </button>
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, voteEnd: shiftIso(p.deadline, 7) }))}>
                            +1주
                          </button>
                          <button type="button" className={chip} onClick={() => setForm((p) => ({ ...p, voteEnd: shiftIso(p.deadline, 14) }))}>
                            +2주
                          </button>
                        </div>
                        <Preview iso={form.voteEnd} />
                        {voteBad && <Warn msg="투표 마감이 접수 마감보다 빠릅니다" />}
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
                    <label className={adminTokens.inputLabel}>총 상금</label>
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
                              {c === "KRW" ? "₩ 원" : c === "USD" ? "$ 달러" : "¥ 엔"}
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
                          placeholder="금액 입력 (예: 1,000,000)"
                        />
                      </div>
                      {form.prizeInfo && <p className="mt-1 text-[10px] text-[#AFA9EC]">총 상금: {form.prizeInfo}</p>}
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="mb-1 text-[11px] font-bold text-[#AFA9EC]">고정 환율 설정</p>
                      <p className="mb-2.5 text-[10px] text-white/30">
                        공모전 시작 시점의 환율을 입력하세요. 사용자에게 환산 금액이 표시됩니다.
                      </p>
                      <div className="space-y-2">
                        <div>
                          <label className={adminTokens.inputLabel}>기준 통화</label>
                          <select
                            value={form.base_currency}
                            onChange={(e) => setForm((p) => ({ ...p, base_currency: e.target.value }))}
                            className={inp}
                          >
                            <option value="USD">USD (달러)</option>
                            <option value="KRW">KRW (원)</option>
                            <option value="JPY">JPY (엔)</option>
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
                              placeholder="예: 1350"
                            />
                          </div>
                          <div>
                            <label className={adminTokens.inputLabel}>1 USD = ? JPY</label>
                            <input
                              type="number"
                              value={form.exchange_rate_usd_jpy}
                              onChange={(e) => setForm((p) => ({ ...p, exchange_rate_usd_jpy: Number(e.target.value) }))}
                              className={inp}
                              placeholder="예: 148"
                            />
                          </div>
                        </div>
                        {form.prize_info_en && (
                          <div className="rounded-lg border border-white/[0.06] bg-[#0a0a0a] p-2">
                            <p className="mb-1 text-[10px] text-white/30">미리보기</p>
                            <p className="text-[11px] text-white/55">USD · {form.prize_info_en}</p>
                            <p className="text-[11px] text-white/55">KRW · {form.prize_info_ko || form.prize_info_en}</p>
                            <p className="text-[11px] text-white/55">JPY · {form.prize_info_ja || form.prize_info_en}</p>
                          </div>
                        )}
                      </div>
                    </div>

                  <div>
                    <p className="mb-3 text-[12px] font-bold text-white/55">상금 배분</p>
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
                    <label className={adminTokens.inputLabel}>공지사항 {langSuffix}</label>
                    <textarea
                      value={form[`announcement_${langTab}` as "announcement_ko" | "announcement_en" | "announcement_ja"]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [`announcement_${langTab}`]: e.target.value } as typeof p))
                      }
                      rows={5}
                      className={inp + " resize-none"}
                      placeholder={
                        langTab === "ko"
                          ? "기업 협찬, 특별 공지 등..."
                          : langTab === "en"
                            ? "Sponsor announcements, special notices..."
                            : "スポンサー情報、特別告知など..."
                      }
                    />
                  </div>
                  <div>
                    <label className={adminTokens.inputLabel}>템플릿 다운로드 URL</label>
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
                  ← 이전
                </button>
                <button
                  type="button"
                  disabled={activeStep === steps.length}
                  onClick={() => setActiveStep((s) => Math.min(steps.length, s + 1))}
                  className={cn(adminTokens.buttonSecondary, "h-9 px-4 text-[12px] disabled:opacity-30")}
                >
                  다음 →
                </button>
                <span className="ml-1 text-[11px] text-white/30">
                  {activeStep} / {steps.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {message && (
                  <p
                    className={`text-xs font-medium ${message === "저장되었습니다." ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(adminTokens.buttonPrimary, "h-9 px-6 text-[12px] disabled:opacity-50")}
                >
                  {loading ? "저장 중..." : "저장하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
