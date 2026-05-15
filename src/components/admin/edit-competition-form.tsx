"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { updateCompetitionAction } from "@/app/actions/admin";
import { adminTokens } from "@/lib/admin-styles";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils/cn";
import { EditCompetitionImageFields } from "./edit-competition/edit-competition-image-fields";
import { EditCompetitionPrizeFields } from "./edit-competition/edit-competition-prize-fields";
import { EditCompetitionRulesFields } from "./edit-competition/edit-competition-rules-fields";

const inp =
  "w-full rounded-xl border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/20 focus:border-[#7F77DD]/60";
const sectionBg = { background: "linear-gradient(135deg, rgba(20,17,50,0.98) 0%, rgba(10,8,28,0.99) 100%)" } as const;

export function EditCompetitionForm({ competition }: { competition: any }) {
  const router = useRouter();
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const sponsorLogoInputRef = useRef<HTMLInputElement>(null);

  const [langTab, setLangTab] = useState<"ko" | "en" | "ja">("ko");
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

  const isoToLocal = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
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

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <input ref={thumbInputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => void onThumbChange(e)} />
      <input
        ref={sponsorLogoInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void onSponsorLogoChange(e)}
      />

      <form onSubmit={(e) => void submit(e)}>
        <div className="rounded-2xl border border-white/[0.08] p-5" style={sectionBg}>
          {/* 헤더 */}
          <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/60">Admin</p>
              <h1 className="mt-0.5 text-xl font-black text-white">공모전 수정</h1>
            </div>
            <div className="flex items-center gap-3">
              {message && (
                <p className={`text-xs font-medium ${message === "저장되었습니다." ? "text-emerald-400" : "text-red-400"}`}>
                  {message}
                </p>
              )}
              {/* G7: admin token 통일 — Linear/Vercel 스타일.
                  primary = 솔리드 화이트, secondary = ghost border. */}
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className={cn(adminTokens.buttonSecondary, "h-9 px-4 text-[12px]")}
              >
                ← 돌아가기
              </button>
              <button
                type="submit"
                disabled={loading}
                className={cn(adminTokens.buttonPrimary, "h-9 px-5 text-[12px] disabled:opacity-50")}
              >
                {loading ? "저장 중..." : "저장 →"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
            {/* 왼쪽 */}
            <div className="space-y-4">
              {/* 기본 정보 */}
              <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "var(--border-white-02)" }}>
                <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#AFA9EC]">기본 정보</h2>
                <div className="space-y-2">
                  <div>
                    <div
                      className="mb-3 flex gap-1 rounded-lg p-0.5"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      {(["ko", "en", "ja"] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setLangTab(lang)}
                          className="flex-1 rounded-md py-1.5 text-[10px] font-semibold transition"
                          style={{
                            background: langTab === lang ? "rgba(83,74,183,0.5)" : "transparent",
                            color: langTab === lang ? "#AFA9EC" : "rgba(255,255,255,0.35)",
                          }}
                        >
                          {lang === "ko" ? "🇰🇷 한국어" : lang === "en" ? "🇺🇸 English" : "🇯🇵 日本語"}
                        </button>
                      ))}
                    </div>

                    <label className={adminTokens.inputLabel}>
                      제목 {langTab === "ko" ? "(한국어)" : langTab === "en" ? "(영어)" : "(일본어)"}
                    </label>
                    <input
                      value={form[`title_${langTab}` as "title_ko" | "title_en" | "title_ja"]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [`title_${langTab}`]: e.target.value } as typeof p))
                      }
                      className={inp}
                      placeholder={
                        langTab === "ko"
                          ? "공모전 제목 (한국어)"
                          : langTab === "en"
                            ? "Competition title (English)"
                            : "コンペタイトル（日本語）"
                      }
                    />

                    <label className={cn(adminTokens.inputLabel, "mt-2")}>서브제목</label>
                    <input
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      className={inp}
                      placeholder="예: AI 영상 창작자를 위한 글로벌 공모전"
                    />

                    <label className={cn(adminTokens.inputLabel, "mt-2")}>
                      공모전 소개 {langTab === "ko" ? "(한국어)" : langTab === "en" ? "(영어)" : "(일본어)"}
                    </label>
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

                    <label className={cn(adminTokens.inputLabel, "mt-2")}>총 상금</label>
                    <div className="flex gap-1.5">
                      <div className="flex gap-1">
                        {(["KRW", "USD", "JPY"] as const).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              const sym = c === "KRW" ? "₩" : c === "USD" ? "$" : "¥";
                              setPriceCurrency(c);
                              setForm((p) => ({
                                ...p,
                                base_currency: c,
                                prizeInfo: prizeAmount ? `${sym}${Number(prizeAmount).toLocaleString()}` : "",
                                prize_info_ko: prizeAmount ? `${sym}${Number(prizeAmount).toLocaleString()}` : "",
                                prize_info_en: prizeAmount ? `${sym}${Number(prizeAmount).toLocaleString()}` : "",
                                prize_info_ja: prizeAmount ? `${sym}${Number(prizeAmount).toLocaleString()}` : "",
                              }));
                            }}
                            className="rounded-lg border px-2.5 py-2 text-[11px] font-bold transition"
                            style={{
                              borderColor: priceCurrency === c ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                              background: priceCurrency === c ? "rgba(83,74,183,0.3)" : "transparent",
                              color: priceCurrency === c ? "#AFA9EC" : "rgba(255,255,255,0.35)",
                            }}
                          >
                            {c === "KRW" ? "₩ 원" : c === "USD" ? "$ 달러" : "¥ 엔"}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        value={prizeAmount}
                        onChange={(e) => {
                          const sym = priceCurrency === "KRW" ? "₩" : priceCurrency === "USD" ? "$" : "¥";
                          setPrizeAmount(e.target.value);
                          setForm((p) => ({
                            ...p,
                            prizeInfo: e.target.value ? `${sym}${Number(e.target.value).toLocaleString()}` : "",
                            prize_info_ko: e.target.value ? `${sym}${Number(e.target.value).toLocaleString()}` : "",
                            prize_info_en: e.target.value ? `${sym}${Number(e.target.value).toLocaleString()}` : "",
                            prize_info_ja: e.target.value ? `${sym}${Number(e.target.value).toLocaleString()}` : "",
                          }));
                        }}
                        className={inp}
                        placeholder="금액 입력 (예: 1000000)"
                      />
                    </div>
                    {form.prizeInfo && (
                      <p className="mt-1 text-[10px] text-[#AFA9EC]">총 상금: {form.prizeInfo}</p>
                    )}

                    <div className="mt-3 rounded-xl border border-[#7F77DD]/20 bg-[#534AB7]/10 p-3">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#AFA9EC]">
                        고정 환율 설정
                      </p>
                      <p className="mb-2 text-[10px] text-white/30">
                        공모전 시작 시점의 환율을 입력하세요. 사용자에게 환산 금액이 표시됩니다.
                      </p>
                      <div className="space-y-2">
                        <div>
                          <label className={adminTokens.inputLabel}>기준 통화</label>
                          <select
                            value={form.base_currency}
                            onChange={(e) => setForm((p) => ({ ...p, base_currency: e.target.value }))}
                            className={inp + " bg-[#0d0b20]"}
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
                              onChange={(e) =>
                                setForm((p) => ({ ...p, exchange_rate_usd_krw: Number(e.target.value) }))
                              }
                              className={inp}
                              placeholder="예: 1350"
                            />
                          </div>
                          <div>
                            <label className={adminTokens.inputLabel}>1 USD = ? JPY</label>
                            <input
                              type="number"
                              value={form.exchange_rate_usd_jpy}
                              onChange={(e) =>
                                setForm((p) => ({ ...p, exchange_rate_usd_jpy: Number(e.target.value) }))
                              }
                              className={inp}
                              placeholder="예: 148"
                            />
                          </div>
                        </div>
                        {/* 미리보기 */}
                        {form.prize_info_en && (
                          <div className="rounded-lg border border-white/[0.06] bg-[#0d0b20] p-2">
                            <p className="text-[10px] text-white/30 mb-1">미리보기</p>
                            <p className="text-[11px] text-white/55">🇺🇸 {form.prize_info_en}</p>
                            <p className="text-[11px] text-white/55">🇰🇷 {form.prize_info_ko || form.prize_info_en}</p>
                            <p className="text-[11px] text-white/55">🇯🇵 {form.prize_info_ja || form.prize_info_en}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={adminTokens.inputLabel}>장르</label>
                      <select
                        value={form.genre}
                        onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))}
                        className={inp + " bg-[#0d0b20]"}
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
                        className={inp + " bg-[#0d0b20]"}
                      >
                        <option value="Open">모집중</option>
                        <option value="In Review">심사중</option>
                        <option value="Voting">투표중</option>
                        <option value="Closed">종료</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={adminTokens.inputLabel}>접수 시작일</label>
                    <input
                      type="datetime-local"
                      value={isoToLocal(form.start_date)}
                      onChange={(e) => setForm((p) => ({ ...p, start_date: new Date(e.target.value).toISOString() }))}
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={adminTokens.inputLabel}>접수 마감일</label>
                    <input
                      type="datetime-local"
                      value={isoToLocal(form.deadline)}
                      onChange={(e) => setForm((p) => ({ ...p, deadline: new Date(e.target.value).toISOString() }))}
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={adminTokens.inputLabel}>투표 마감일</label>
                    <input
                      type="datetime-local"
                      value={isoToLocal(form.voteEnd)}
                      onChange={(e) => setForm((p) => ({ ...p, voteEnd: new Date(e.target.value).toISOString() }))}
                      className={inp}
                    />
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
              </div>

              {/* 이미지 */}
              <EditCompetitionImageFields
                setForm={setForm}
                thumbInputRef={thumbInputRef}
                sponsorLogoInputRef={sponsorLogoInputRef}
                thumbnailPreview={thumbnailPreview}
                setThumbnailPreview={setThumbnailPreview}
                sponsorLogoPreview={sponsorLogoPreview}
                setSponsorLogoPreview={setSponsorLogoPreview}
              />
            </div>

            {/* 오른쪽 */}
            <div className="space-y-4">
              {/* 공지 및 템플릿 */}
              <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "var(--border-white-02)" }}>
                <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#AFA9EC]">공지 및 템플릿</h2>
                <div className="space-y-2">
                  <div>
                    <label className={adminTokens.inputLabel}>
                      공지사항 {langTab === "ko" ? "(한국어)" : langTab === "en" ? "(영어)" : "(일본어)"}
                    </label>
                    <textarea
                      value={form[`announcement_${langTab}` as "announcement_ko" | "announcement_en" | "announcement_ja"]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [`announcement_${langTab}`]: e.target.value } as typeof p))
                      }
                      rows={4}
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
              </div>

              {/* 상금 구성 */}
              <EditCompetitionPrizeFields
                form={form}
                setForm={setForm}
                prizeAmount={prizeAmount}
                priceCurrency={priceCurrency}
              />

              {/* 규칙 및 심사 */}
              <EditCompetitionRulesFields form={form} setForm={setForm} langTab={langTab} />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
