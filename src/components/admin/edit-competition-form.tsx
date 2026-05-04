"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { updateCompetitionAction } from "@/app/actions/admin";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

const inp =
  "w-full rounded-xl border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none placeholder:text-white/20 focus:border-[#7F77DD]/60";
const lbl = "mb-1 block text-[10px] text-white/40";
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
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-white/40 transition hover:text-white"
              >
                ← 돌아가기
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl px-5 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)" }}
              >
                {loading ? "저장 중..." : "저장 →"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
            {/* 왼쪽 */}
            <div className="space-y-4">
              {/* 기본 정보 */}
              <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
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

                    <label className={lbl}>
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

                    <label className={`${lbl} mt-2`}>총 상금</label>
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
                          <label className={lbl}>기준 통화</label>
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
                            <label className={lbl}>1 USD = ? KRW</label>
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
                            <label className={lbl}>1 USD = ? JPY</label>
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
                            <p className="text-[11px] text-white/60">🇺🇸 {form.prize_info_en}</p>
                            <p className="text-[11px] text-white/60">🇰🇷 {form.prize_info_ko || form.prize_info_en}</p>
                            <p className="text-[11px] text-white/60">🇯🇵 {form.prize_info_ja || form.prize_info_en}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={lbl}>장르</label>
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
                      <label className={lbl}>상태</label>
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
                    <label className={lbl}>접수 마감일</label>
                    <input
                      type="datetime-local"
                      value={isoToLocal(form.deadline)}
                      onChange={(e) => setForm((p) => ({ ...p, deadline: new Date(e.target.value).toISOString() }))}
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>투표 마감일</label>
                    <input
                      type="datetime-local"
                      value={isoToLocal(form.voteEnd)}
                      onChange={(e) => setForm((p) => ({ ...p, voteEnd: new Date(e.target.value).toISOString() }))}
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>스폰서</label>
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
              <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#AFA9EC]">이미지</h2>
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>공모전 썸네일</label>
                    {thumbnailPreview ? (
                      <div className="relative overflow-hidden rounded-xl border border-white/[0.08]">
                        <img src={thumbnailPreview} alt="" className="aspect-video w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => thumbInputRef.current?.click()}
                          className="absolute right-12 top-2 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/90"
                        >
                          변경
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setThumbnailPreview(null);
                            setForm((p) => ({ ...p, thumbnailUrl: "" }));
                            if (thumbInputRef.current) thumbInputRef.current.value = "";
                          }}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white/70 backdrop-blur-sm transition hover:bg-red-500/70 hover:text-white"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => thumbInputRef.current?.click()}
                        className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#7F77DD]/25 bg-white/[0.02] transition hover:border-[#7F77DD]/50"
                      >
                        <svg className="h-6 w-6 text-[#7F77DD]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path d="M12 16v-8m0 0-3 3m3-3 3 3M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="text-xs text-white/30">썸네일 업로드</p>
                      </button>
                    )}
                  </div>
                  <div>
                    <label className={lbl}>스폰서 로고</label>
                    {sponsorLogoPreview ? (
                      <div className="relative overflow-hidden rounded-xl border border-white/[0.08] p-3">
                        <img src={sponsorLogoPreview} alt="" className="h-16 object-contain" />
                        <button
                          type="button"
                          onClick={() => sponsorLogoInputRef.current?.click()}
                          className="absolute right-12 top-2 rounded-lg bg-black/70 px-2 py-1 text-xs text-white"
                        >
                          변경
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSponsorLogoPreview(null);
                            setForm((p) => ({ ...p, sponsorLogoUrl: "" }));
                            if (sponsorLogoInputRef.current) sponsorLogoInputRef.current.value = "";
                          }}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white/70 backdrop-blur-sm transition hover:bg-red-500/70 hover:text-white"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => sponsorLogoInputRef.current?.click()}
                        className="flex h-20 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] transition hover:border-white/20"
                      >
                        <p className="text-xs text-white/30">스폰서 로고 업로드</p>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽 */}
            <div className="space-y-4">
              {/* 공지 및 템플릿 */}
              <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#AFA9EC]">공지 및 템플릿</h2>
                <div className="space-y-2">
                  <div>
                    <label className={lbl}>
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
                    <label className={lbl}>템플릿 다운로드 URL</label>
                    <input
                      value={form.templateUrl}
                      onChange={(e) => setForm((p) => ({ ...p, templateUrl: e.target.value }))}
                      className={inp}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* 규칙 및 심사 */}
              <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#AFA9EC]">규칙 및 심사</h2>
                <div className="space-y-2">
                  <div>
                    <label className={lbl}>참가 자격 {langTab === "ko" ? "(한국어)" : langTab === "en" ? "(영어)" : "(일본어)"}</label>
                    <textarea
                      value={form[`eligibility_${langTab}` as "eligibility_ko" | "eligibility_en" | "eligibility_ja"]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [`eligibility_${langTab}`]: e.target.value } as typeof p))
                      }
                      rows={2}
                      className={inp + " resize-none"}
                      placeholder={
                        langTab === "ko"
                          ? "예: 전 세계 AI 크리에이터 누구나"
                          : langTab === "en"
                            ? "e.g. Open to all AI creators worldwide"
                            : "例: 世界中のAIクリエイター"
                      }
                    />
                  </div>
                  <div>
                    <label className={lbl}>출품 가이드라인 {langTab === "ko" ? "(한국어)" : langTab === "en" ? "(영어)" : "(일본어)"}</label>
                    <textarea
                      value={
                        form[
                          `submission_guidelines_${langTab}` as
                            | "submission_guidelines_ko"
                            | "submission_guidelines_en"
                            | "submission_guidelines_ja"
                        ]
                      }
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [`submission_guidelines_${langTab}`]: e.target.value } as typeof p))
                      }
                      rows={2}
                      className={inp + " resize-none"}
                      placeholder={
                        langTab === "ko"
                          ? "예: 90초 이내 AI 생성 영상"
                          : langTab === "en"
                            ? "e.g. AI-generated video under 90 seconds"
                            : "例: 90秒以内のAI生成動画"
                      }
                    />
                  </div>
                  <div>
                    <label className={lbl}>심사 방법 {langTab === "ko" ? "(한국어)" : langTab === "en" ? "(영어)" : "(일본어)"}</label>
                    <textarea
                      value={
                        form[`judging_criteria_${langTab}` as "judging_criteria_ko" | "judging_criteria_en" | "judging_criteria_ja"]
                      }
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [`judging_criteria_${langTab}`]: e.target.value } as typeof p))
                      }
                      rows={2}
                      className={inp + " resize-none"}
                      placeholder={
                        langTab === "ko"
                          ? "예: 심사위원 50% + 시청자 투표 50%"
                          : langTab === "en"
                            ? "e.g. Judges 50% + Audience vote 50%"
                            : "例: 審査員50% + 視聴者投票50%"
                      }
                    />
                  </div>
                  <div>
                    <label className={lbl}>규칙 {langTab === "ko" ? "(한국어)" : langTab === "en" ? "(영어)" : "(일본어)"}</label>
                    <textarea
                      value={form[`rules_${langTab}` as "rules_ko" | "rules_en" | "rules_ja"]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [`rules_${langTab}`]: e.target.value } as typeof p))
                      }
                      rows={3}
                      className={inp + " resize-none"}
                      placeholder={
                        langTab === "ko"
                          ? "예: AI로 제작한 영상만 출품 가능"
                          : langTab === "en"
                            ? "e.g. Only AI-generated videos allowed"
                            : "例: AI生成動画のみ出品可能"
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
