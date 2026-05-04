"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/genova/language-provider";
import { deleteCompetitionAction, setVideoOriginalAction } from "@/app/actions/admin";
import { updateVideoVisibilityAction } from "@/app/actions/video";
import { deleteVideoAction } from "@/app/actions/video";
import {
  createCompetitionAction,
  setVideoAwardAction,
  setVideoFinalistAction,
  updateCompetitionStatusAction,
} from "@/app/actions/admin";
import { grantCompetitionTrophyAction, runWeeklyGenreTrophiesAction } from "@/app/actions/trophies-admin";
import type { Competition, Video } from "@/lib/types";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

function AwardDropdown({
  videoId,
  currentAward,
  awardOptions,
  newAwardOption,
  setNewAwardOption,
  onAddOption,
  onSelect,
  onClose,
}: {
  videoId: string;
  currentAward: string | null | undefined;
  awardOptions: string[];
  newAwardOption: string;
  setNewAwardOption: (v: string) => void;
  onAddOption: () => void;
  onSelect: (award: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      data-video-id={videoId}
      className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-white/[0.08] py-1"
      style={{
        background: "linear-gradient(135deg, rgba(20,17,50,0.99) 0%, rgba(10,8,28,1) 100%)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      {/* 수상 목록 */}
      <div className="max-h-[200px] overflow-y-auto">
        <button
          type="button"
          onClick={() => onSelect("")}
          className="flex w-full items-center px-3 py-1.5 text-left text-xs text-white/40 transition hover:bg-white/[0.05] hover:text-white/70"
        >
          수상 취소
        </button>
        {awardOptions.map((award) => (
          <button
            key={award}
            type="button"
            onClick={() => onSelect(award)}
            className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition hover:bg-white/[0.05]"
            style={{ color: currentAward === award ? "#AFA9EC" : "rgba(255,255,255,0.6)" }}
          >
            <span>{award}</span>
            {currentAward === award && (
              <svg viewBox="0 0 24 24" className="h-3 w-3 text-[#7F77DD]" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* 새 수상 추가 */}
      <div className="border-t border-white/[0.06] p-2">
        <div className="flex gap-1">
          <input
            value={newAwardOption}
            onChange={(e) => setNewAwardOption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddOption();
              }
            }}
            className="flex-1 rounded-lg border border-white/[0.12] bg-[#0d0b20] px-2 py-1 text-[10px] text-white outline-none placeholder:text-white/20"
            placeholder="새 수상 추가..."
          />
          <button
            type="button"
            onClick={onAddOption}
            className="rounded-lg border border-[#7F77DD]/30 px-2 py-1 text-[10px] text-[#AFA9EC] transition hover:bg-[#534AB7]/20"
          >
            +
          </button>
        </div>
      </div>

      {/* 닫기 */}
      <button type="button" onClick={onClose} className="absolute right-2 top-2 text-white/20 hover:text-white/50">
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export function AdminDashboard({ competitions, videos }: { competitions: Competition[]; videos: Video[] }) {
  const router = useRouter();
  const { t } = useI18n();
  const competitionThumbInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: "",
    title: "",
    genre: "All",
    status: "Open",
    deadline: "",
    voteEnd: "",
    prizeInfo: "",
    sponsor: "",
    thumbnailUrl: "",
    rules: "",
    judgingCriteria: "",
    eligibility: "",
    submissionGuidelines: "",
  });
  const [trophyUserId, setTrophyUserId] = useState("");
  const [trophyCompetitionId, setTrophyCompetitionId] = useState("");
  const [trophyAward, setTrophyAward] = useState("대상");
  const [weeklyWeekStart, setWeeklyWeekStart] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [videoFilter, setVideoFilter] = useState<"all" | "competition" | string>("all");
  const [currency, setCurrency] = useState<"KRW" | "USD" | "JPY">("KRW");
  const [prizeAmount, setPrizeAmount] = useState("");
  const currencySymbol = currency === "KRW" ? "₩" : currency === "USD" ? "$" : "¥";
  const [videoSort, setVideoSort] = useState<"latest" | "likes" | "views" | "reports">("latest");
  const [videoTimeFilter, setVideoTimeFilter] = useState<"all" | "week" | "month">("all");
  const [selectedCompetitionFilter, setSelectedCompetitionFilter] = useState<string>("all");
  const [awardOptions, setAwardOptions] = useState([
    "대상",
    "금상",
    "은상",
    "동상",
    "입선",
    "장려상",
    "Grand Prize",
    "Excellence",
    "Merit",
    "Audience Award",
    "Special Award",
  ]);
  const [newAwardOption, setNewAwardOption] = useState("");
  const [showAwardSelect, setShowAwardSelect] = useState<string | null>(null);
  const [selectedAward, setSelectedAward] = useState("");
  const [localCompetitions, setLocalCompetitions] = useState(competitions);
  const [heroEyebrowKo, setHeroEyebrowKo] = useState("");
  const [heroEyebrowEn, setHeroEyebrowEn] = useState("");
  const [heroEyebrowJa, setHeroEyebrowJa] = useState("");
  const [eyebrowLangTab, setEyebrowLangTab] = useState<"ko" | "en" | "ja">("ko");
  const [heroEyebrowLoading, setHeroEyebrowLoading] = useState(false);
  const [featuredCompetitionId, setFeaturedCompetitionId] = useState("");
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [competitionThumbPreview, setCompetitionThumbPreview] = useState<string | null>(null);
  const [competitionThumbDragging, setCompetitionThumbDragging] = useState(false);

  useEffect(() => {
    setLocalCompetitions(competitions);
  }, [competitions]);

  useEffect(() => {
    Promise.all([
      fetch("/api/site-settings?key=films_hero_eyebrow_ko").then((r) => r.json()),
      fetch("/api/site-settings?key=films_hero_eyebrow_en").then((r) => r.json()),
      fetch("/api/site-settings?key=films_hero_eyebrow_ja").then((r) => r.json()),
    ])
      .then(([ko, en, ja]) => {
        if (ko.value) setHeroEyebrowKo(ko.value);
        if (en.value) setHeroEyebrowEn(en.value);
        if (ja.value) setHeroEyebrowJa(ja.value);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/site-settings?key=films_featured_competition_id")
      .then((r) => r.json())
      .then((d) => {
        if (d.value) setFeaturedCompetitionId(d.value);
      })
      .catch(() => {});
  }, []);

  const onCompetitionThumbChange = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setCompetitionThumbPreview(URL.createObjectURL(file));
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    const safe = file.name.replace(/[^\w.-]/g, "_");
    const path = `competitions/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("thumbnails").upload(path, file, { upsert: true });
    if (error) return;
    const {
      data: { publicUrl },
    } = supabase.storage.from("thumbnails").getPublicUrl(path);
    setForm((p) => ({ ...p, thumbnailUrl: publicUrl }));
  };

  const call = async (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fn();
      setMessage(res.ok ? "저장되었습니다." : res.message ?? "실패했습니다.");
      if (res.ok) router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const callWithOptimistic = async (
    fn: () => Promise<{ ok: boolean; message?: string }>,
    optimisticUpdate?: () => void,
  ) => {
    setLoading(true);
    setMessage(null);
    if (optimisticUpdate) optimisticUpdate();
    try {
      const res = await fn();
      setMessage(res.ok ? "저장되었습니다." : res.message ?? "실패했습니다.");
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const inp =
    "w-full rounded-xl border border-white/[0.12] bg-[#0d0b20] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#7F77DD]/60 focus:ring-1 focus:ring-[#7F77DD]/30";
  const sectionBg = { background: "linear-gradient(135deg, rgba(20,17,50,0.98) 0%, rgba(10,8,28,0.99) 100%)" } as const;

  const isoToDatetimeLocalValue = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  const datetimeLocalToIso = (raw: string) => {
    if (!raw.trim()) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  };

  const statusLabel = (status: string) => {
    if (status === "Open") return "모집중";
    if (status === "In Review") return "심사중";
    if (status === "Voting") return "투표중";
    if (status === "Closed") return "종료";
    return status;
  };

  const filteredVideos = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    let result = videos.filter((v) => {
      if (videoFilter.startsWith("competition_")) {
        return v.purpose === "competition";
      }
      if (videoFilter === "competition") return v.isFinalist || v.purpose === "competition";
      if (videoFilter !== "all") return v.genre === videoFilter;
      return true;
    });

    result = result.filter((v) => {
      if (videoTimeFilter === "week") return new Date(v.createdAt).getTime() >= weekAgo;
      if (videoTimeFilter === "month") return new Date(v.createdAt).getTime() >= monthAgo;
      return true;
    });

    result = [...result].sort((a, b) => {
      if (videoSort === "likes") return (b.likeCount ?? 0) - (a.likeCount ?? 0);
      if (videoSort === "views") return (b.viewCount ?? 0) - (a.viewCount ?? 0);
      if (videoSort === "reports")
        return (
          ((b as Video & { reportCount?: number }).reportCount ?? 0) -
          ((a as Video & { reportCount?: number }).reportCount ?? 0)
        );
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [videos, videoFilter, videoTimeFilter, videoSort]);

  const competitionVideos = selectedCompetition
    ? videos.filter((v) => v.purpose === "competition" || v.isFinalist)
    : [];

  return (
    <div className="w-full pb-8">
      {/* 헤더 */}
      <div className="mb-4 rounded-2xl border border-white/[0.08] p-4" style={sectionBg}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/60">
                {t("admin.dashboard", "Dashboard")}
              </p>
              <h1 className="text-xl font-black tracking-tight text-white">{t("admin.title", "Admin")}</h1>
            </div>
            <div className="flex gap-2">
              {[
                { labelKey: "admin.totalFilms", labelFb: "전체 영상", value: videos.length },
                { labelKey: "admin.competitions", labelFb: "공모전", value: localCompetitions.length },
                {
                  labelKey: "admin.active",
                  labelFb: "진행중",
                  value: localCompetitions.filter((c) => c.status === "Open").length,
                },
              ].map(({ labelKey, labelFb, value }) => (
                <div
                  key={labelKey}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.06] px-3 py-1.5"
                  style={{ background: "rgba(83,74,183,0.08)" }}
                >
                  <p className="text-base font-black text-white">{value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/35">{t(labelKey, labelFb)}</p>
                </div>
              ))}
            </div>
          </div>
          {message && (
            <p
              className={`text-xs font-medium ${
                message === "Saved successfully." || message === "저장되었습니다." ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/[0.06] p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">사이트 설정</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-[10px] text-white/30">Films 히어로 배너 텍스트</label>
            <div className="mb-2 flex gap-1 rounded-lg p-0.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {(["ko", "en", "ja"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setEyebrowLangTab(lang)}
                  className="flex-1 rounded-md py-1 text-[10px] font-semibold transition"
                  style={{
                    background: eyebrowLangTab === lang ? "rgba(83,74,183,0.5)" : "transparent",
                    color: eyebrowLangTab === lang ? "#AFA9EC" : "rgba(255,255,255,0.35)",
                  }}
                >
                  {lang === "ko" ? "🇰🇷 KO" : lang === "en" ? "🇺🇸 EN" : "🇯🇵 JA"}
                </button>
              ))}
            </div>
            <input
              value={eyebrowLangTab === "ko" ? heroEyebrowKo : eyebrowLangTab === "en" ? heroEyebrowEn : heroEyebrowJa}
              onChange={(e) => {
                if (eyebrowLangTab === "ko") setHeroEyebrowKo(e.target.value);
                else if (eyebrowLangTab === "en") setHeroEyebrowEn(e.target.value);
                else setHeroEyebrowJa(e.target.value);
              }}
              className="w-full rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none"
              placeholder={
                eyebrowLangTab === "ko"
                  ? "예: 제1회 Genova AI 단편영화 공모전"
                  : eyebrowLangTab === "en"
                    ? "e.g. 1ST GENOVA AI FILM COMPETITION"
                    : "例: 第1回 Genova AI 映画コンペ"
              }
            />
          </div>
          <button
            type="button"
            disabled={heroEyebrowLoading}
            onClick={async () => {
              setHeroEyebrowLoading(true);
              try {
                await Promise.all([
                  fetch("/api/site-settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key: "films_hero_eyebrow_ko", value: heroEyebrowKo }),
                  }),
                  fetch("/api/site-settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key: "films_hero_eyebrow_en", value: heroEyebrowEn }),
                  }),
                  fetch("/api/site-settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ key: "films_hero_eyebrow_ja", value: heroEyebrowJa }),
                  }),
                ]);
                setMessage("저장되었습니다.");
              } finally {
                setHeroEyebrowLoading(false);
              }
            }}
            className="self-end rounded-lg border border-[#7F77DD]/30 px-3 py-2 text-[10px] text-[#AFA9EC] transition hover:bg-[#534AB7]/20"
          >
            {heroEyebrowLoading ? "저장 중..." : "저장"}
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-[10px] text-white/30">Films 히어로 배너 공모전</label>
            <select
              value={featuredCompetitionId}
              onChange={(e) => setFeaturedCompetitionId(e.target.value)}
              className="w-full rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none"
            >
              <option value="">공모전 선택 안함</option>
              {localCompetitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={featuredLoading}
            onClick={async () => {
              setFeaturedLoading(true);
              try {
                await fetch("/api/site-settings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ key: "films_featured_competition_id", value: featuredCompetitionId }),
                });
                setMessage("저장되었습니다.");
              } finally {
                setFeaturedLoading(false);
              }
            }}
            className="self-end rounded-lg border border-[#7F77DD]/30 px-3 py-2 text-[10px] text-[#AFA9EC] transition hover:bg-[#534AB7]/20"
          >
            {featuredLoading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1fr]" style={{ overflow: "visible" }}>
        {/* 공모전 생성 */}
        <div className="rounded-2xl border border-white/[0.08] p-4" style={sectionBg}>
          <h2 className="mb-3 border-b border-[#7F77DD]/20 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
            공모전 생성
          </h2>
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-[10px] text-white/40">공모전 ID (선택사항)</label>
              <input
                key="id"
                value={form.id}
                onChange={(e) => setForm((p) => ({ ...p, id: e.target.value }))}
                className="w-full rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none placeholder:text-white/20"
                placeholder="비워두면 자동 생성"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-white/40">공모전 제목 *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none placeholder:text-white/20"
                placeholder="예: 1회 Genova AI 단편영화 공모전"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-white/40">장르</label>
              <select
                value={form.genre}
                onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))}
                className="w-full rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none"
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
              <label className="mb-1 block text-[10px] text-white/40">상태</label>
              <div className="flex gap-1">
                {["Open", "In Review", "Voting", "Closed"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, status: s }))}
                    className="flex-1 rounded-lg border py-1.5 text-[10px] font-medium transition"
                    style={{
                      borderColor: form.status === s ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                      background: form.status === s ? "rgba(83,74,183,0.3)" : "transparent",
                      color: form.status === s ? "#AFA9EC" : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {s === "Open" ? "모집중" : s === "In Review" ? "심사중" : s === "Voting" ? "투표중" : "종료"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-white/40">접수 마감일 *</label>
              <input
                type="datetime-local"
                value={isoToDatetimeLocalValue(form.deadline)}
                onChange={(e) => setForm((p) => ({ ...p, deadline: datetimeLocalToIso(e.target.value) }))}
                className="w-full rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-white/40">투표 마감일 *</label>
              <input
                type="datetime-local"
                value={isoToDatetimeLocalValue(form.voteEnd)}
                onChange={(e) => setForm((p) => ({ ...p, voteEnd: datetimeLocalToIso(e.target.value) }))}
                className="w-full rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-white/40">총 상금</label>
              <div className="flex gap-1.5">
                <div className="flex gap-1">
                  {(["KRW", "USD", "JPY"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        const sym = c === "KRW" ? "₩" : c === "USD" ? "$" : "¥";
                        setCurrency(c);
                        setForm((p) => ({
                          ...p,
                          prizeInfo: prizeAmount ? `${sym}${Number(prizeAmount).toLocaleString()}` : "",
                        }));
                      }}
                      className="rounded-lg border px-2 py-1.5 text-[10px] font-bold transition"
                      style={{
                        borderColor: currency === c ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                        background: currency === c ? "rgba(83,74,183,0.3)" : "transparent",
                        color: currency === c ? "#AFA9EC" : "rgba(255,255,255,0.35)",
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
                    setPrizeAmount(e.target.value);
                    setForm((p) => ({
                      ...p,
                      prizeInfo: e.target.value ? `${currencySymbol}${Number(e.target.value).toLocaleString()}` : "",
                    }));
                  }}
                  className="flex-1 rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-1.5 text-xs text-white outline-none placeholder:text-white/20"
                  placeholder="금액 입력 (예: 1000000)"
                />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {["300000", "500000", "1000000", "3000000", "5000000"].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      const sym = currency === "KRW" ? "₩" : currency === "USD" ? "$" : "¥";
                      setPrizeAmount(amount);
                      setForm((p) => ({ ...p, prizeInfo: `${sym}${Number(amount).toLocaleString()}` }));
                    }}
                    className="rounded-md border border-white/[0.06] px-2 py-0.5 text-[10px] text-white/35 transition hover:border-[#7F77DD]/30 hover:text-white/60"
                  >
                    {currency === "KRW" ? `${Number(amount) / 10000}만` : amount}
                  </button>
                ))}
              </div>
              {form.prizeInfo && (
                <p className="mt-1 text-[10px] text-[#AFA9EC]">총 상금: {form.prizeInfo}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-white/40">스폰서</label>
              <input
                value={form.sponsor}
                onChange={(e) => setForm((p) => ({ ...p, sponsor: e.target.value }))}
                className="w-full rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none placeholder:text-white/20"
                placeholder="예: Runway, Kling AI"
              />
            </div>

            <input
              ref={competitionThumbInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onCompetitionThumbChange(f);
              }}
            />
            <div>
              <label className="mb-1 block text-[10px] text-white/40">공모전 썸네일</label>
              {competitionThumbPreview ? (
                <div className="relative overflow-hidden rounded-xl border border-white/[0.08]">
                  <img src={competitionThumbPreview} alt="" className="aspect-video w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => competitionThumbInputRef.current?.click()}
                    className="absolute right-12 top-2 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/90"
                  >
                    변경
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCompetitionThumbPreview(null);
                      setForm((p) => ({ ...p, thumbnailUrl: "" }));
                      if (competitionThumbInputRef.current) competitionThumbInputRef.current.value = "";
                    }}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white/70 backdrop-blur-sm transition hover:bg-red-500/70 hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setCompetitionThumbDragging(true);
                  }}
                  onDragLeave={() => setCompetitionThumbDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setCompetitionThumbDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) void onCompetitionThumbChange(f);
                  }}
                  onClick={() => competitionThumbInputRef.current?.click()}
                  className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition"
                  style={{
                    borderColor: competitionThumbDragging ? "rgba(127,119,221,0.6)" : "rgba(127,119,221,0.25)",
                    background: competitionThumbDragging ? "rgba(83,74,183,0.15)" : "rgba(255,255,255,0.02)",
                  }}
                >
                  <svg className="h-6 w-6 text-[#7F77DD]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M12 16v-8m0 0-3 3m3-3 3 3M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-xs text-white/30">클릭하거나 이미지를 드래그하세요</p>
                  <p className="text-[10px] text-white/20">JPG, PNG, WebP</p>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[10px] text-white/40">참가 자격</label>
              <textarea
                value={form.eligibility}
                onChange={(e) => setForm((p) => ({ ...p, eligibility: e.target.value }))}
                rows={2}
                className="w-full resize-none rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none placeholder:text-white/20"
                placeholder="예: 전 세계 AI 크리에이터 누구나 참가 가능"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] text-white/40">출품 가이드라인</label>
              <textarea
                value={form.submissionGuidelines}
                onChange={(e) => setForm((p) => ({ ...p, submissionGuidelines: e.target.value }))}
                rows={2}
                className="w-full resize-none rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none placeholder:text-white/20"
                placeholder="예: 90초 이내 AI 생성 영상, MP4 형식"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] text-white/40">심사 방법</label>
              <textarea
                value={form.judgingCriteria}
                onChange={(e) => setForm((p) => ({ ...p, judgingCriteria: e.target.value }))}
                rows={2}
                className="w-full resize-none rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none placeholder:text-white/20"
                placeholder="예: 심사위원 50% + 시청자 투표 50%"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] text-white/40">규칙</label>
              <textarea
                value={form.rules}
                onChange={(e) => setForm((p) => ({ ...p, rules: e.target.value }))}
                rows={3}
                className="w-full resize-none rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none placeholder:text-white/20"
                placeholder="예: AI로 제작한 영상만 출품 가능, 1인 1작품..."
              />
            </div>

            {message && (
              <p
                className={`text-xs font-medium ${
                  message === "Saved successfully." || message === "저장되었습니다." ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {message}
              </p>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={() => void call(() => createCompetitionAction(form))}
              className="mt-1 w-full rounded-xl py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
                boxShadow: "0 4px 16px rgba(83,74,183,0.3)",
              }}
            >
              {loading ? "생성 중..." : "공모전 생성 →"}
            </button>
          </div>
        </div>

        {/* 공모전 관리 + 트로피 */}
        <div className="space-y-4">
          {/* 공모전 관리 */}
          <div className="rounded-2xl border border-white/[0.08] p-4" style={sectionBg}>
            <h2 className="mb-3 border-b border-[#7F77DD]/20 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
              공모전 관리
            </h2>

            {/* 선택된 공모전 영상 관리 모달 */}
            {selectedCompetition && (
              <div className="mb-3 rounded-xl border border-[#7F77DD]/30 p-3" style={{ background: "rgba(83,74,183,0.1)" }}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-[#AFA9EC]">{selectedCompetition.title} — Videos</p>
                  <button
                    type="button"
                    onClick={() => setSelectedCompetition(null)}
                    className="text-white/30 hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <div className="max-h-[300px] space-y-1.5 overflow-y-auto">
                  {videos.filter((v) => v.purpose === "competition").length === 0 ? (
                    <p className="text-xs text-white/30">출품작이 없습니다.</p>
                  ) : (
                    videos
                      .filter((v) => v.purpose === "competition")
                      .map((v) => (
                        <div
                          key={v.id}
                          className="rounded-lg border border-white/[0.06] p-2"
                          style={{ background: "rgba(255,255,255,0.02)" }}
                        >
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="min-w-0 flex-1 truncate text-xs font-semibold text-white">{v.title}</p>
                            {v.award && (
                              <span className="shrink-0 rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-bold text-yellow-400">
                                {v.award}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => void call(() => setVideoFinalistAction(v.id, !v.isFinalist))}
                              className="rounded-md border border-white/[0.08] px-2 py-1 text-[10px] transition hover:border-[#7F77DD]/30"
                              style={{
                                color: v.isFinalist ? "#AFA9EC" : "rgba(255,255,255,0.4)",
                                background: v.isFinalist ? "rgba(83,74,183,0.2)" : "transparent",
                              }}
                            >
                              {v.isFinalist ? "✓ 결선" : "결선 지정"}
                            </button>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => void call(() => setVideoOriginalAction(v.id, !v.isOriginal))}
                              className="rounded-md border border-white/[0.08] px-2 py-1 text-[10px] transition hover:border-yellow-500/30"
                              style={{
                                color: v.isOriginal ? "#fbbf24" : "rgba(255,255,255,0.4)",
                                background: v.isOriginal ? "rgba(251,191,36,0.1)" : "transparent",
                              }}
                            >
                              {v.isOriginal ? "★ 추천" : "추천 지정"}
                            </button>
                            <Link
                              href={`/watch/${v.id}`}
                              target="_blank"
                              className="rounded-md border border-white/[0.08] px-2 py-1 text-[10px] text-white/40 transition hover:border-white/20 hover:text-white/70"
                            >
                              보기 →
                            </Link>
                            <div className="relative">
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => setShowAwardSelect(showAwardSelect === v.id ? null : v.id)}
                                className="rounded-md border border-white/[0.08] px-2 py-1 text-[10px] text-white/40 transition hover:border-yellow-500/30 hover:text-yellow-400"
                              >
                                🏆 {t("admin.setAward", "Set Award")}
                              </button>
                              {showAwardSelect === v.id && (
                                <AwardDropdown
                                  videoId={v.id}
                                  currentAward={v.award}
                                  awardOptions={awardOptions}
                                  newAwardOption={newAwardOption}
                                  setNewAwardOption={setNewAwardOption}
                                  onAddOption={() => {
                                    if (!newAwardOption.trim()) return;
                                    if (!awardOptions.includes(newAwardOption.trim())) {
                                      setAwardOptions((prev) => [...prev, newAwardOption.trim()]);
                                    }
                                    setNewAwardOption("");
                                  }}
                                  onSelect={(award) => {
                                    void call(() => setVideoAwardAction(v.id, award));
                                    setShowAwardSelect(null);
                                  }}
                                  onClose={() => setShowAwardSelect(null)}
                                />
                              )}
                            </div>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                void call(() =>
                                  updateVideoVisibilityAction(v.id, v.visibility === "private" ? "public" : "private"),
                                )
                              }
                              className="rounded-md border border-white/[0.08] px-2 py-1 text-[10px] transition hover:border-white/20"
                              style={{ color: v.visibility === "private" ? "#f87171" : "rgba(255,255,255,0.4)" }}
                            >
                              {v.visibility === "private" ? "🔒 비공개" : "비공개"}
                            </button>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => {
                                if (!confirm(`"${v.title}" 영상을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
                                void call(() => deleteVideoAction(v.id));
                              }}
                              className="rounded-md border border-red-500/20 px-2 py-1 text-[10px] text-red-400/50 transition hover:border-red-500/40 hover:text-red-400"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              {localCompetitions.length === 0 && (
                <p className="text-xs text-white/30">공모전이 없습니다.</p>
              )}
              {localCompetitions.map((c) => (
                <div
                  key={c.id}
                  className="cursor-pointer rounded-lg border border-white/[0.06] p-2.5 transition hover:border-[#7F77DD]/30"
                  style={{
                    background: selectedCompetition?.id === c.id ? "rgba(83,74,183,0.15)" : "rgba(255,255,255,0.02)",
                  }}
                  onClick={() => {
                    const isSelected = selectedCompetition?.id === c.id;
                    setSelectedCompetition(isSelected ? null : c);
                    setVideoFilter("all");
                    if (!isSelected) {
                      setVideoFilter("competition");
                    }
                  }}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-xs font-semibold text-white">{c.title}</p>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold"
                      style={{
                        background: c.status === "Open" ? "rgba(16,185,129,0.2)" : "rgba(83,74,183,0.2)",
                        color: c.status === "Open" ? "#34d399" : "#AFA9EC",
                        border: `1px solid ${c.status === "Open" ? "rgba(16,185,129,0.3)" : "rgba(127,119,221,0.3)"}`,
                      }}
                    >
                      {statusLabel(c.status)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {["Open", "In Review", "Voting", "Closed"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={loading || c.status === s}
                        onClick={(e) => {
                          e.stopPropagation();
                          void callWithOptimistic(
                            () => updateCompetitionStatusAction(c.id, s),
                            () =>
                              setLocalCompetitions((prev) =>
                                prev.map((comp) => (comp.id === c.id ? { ...comp, status: s } : comp)),
                              ),
                          );
                        }}
                        className="rounded-md border border-white/[0.08] px-2 py-0.5 text-[10px] transition hover:border-[#7F77DD]/30 hover:text-white disabled:opacity-30"
                        style={{ color: c.status === s ? "#AFA9EC" : "rgba(255,255,255,0.4)" }}
                      >
                        {s === "Open" ? "모집중" : s === "In Review" ? "심사중" : s === "Voting" ? "투표중" : "종료"}
                      </button>
                    ))}
                    <Link
                      href={`/admin/competition/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-md border border-white/[0.08] px-2 py-0.5 text-[10px] text-white/40 transition hover:border-[#7F77DD]/30 hover:text-white/70"
                    >
                      수정
                    </Link>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!confirm(`"${c.title}" 공모전을 삭제하시겠습니까?`)) return;
                        void callWithOptimistic(
                          () => deleteCompetitionAction(c.id),
                          () => {
                            setLocalCompetitions((prev) => prev.filter((comp) => comp.id !== c.id));
                            if (selectedCompetition?.id === c.id) {
                              setSelectedCompetition(null);
                              setVideoFilter("all");
                            }
                          },
                        );
                      }}
                      className="rounded-md border border-red-500/20 px-2 py-0.5 text-[10px] text-red-400/50 transition hover:border-red-500/40 hover:text-red-400"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 트로피 */}
          <div className="rounded-2xl border border-white/[0.08] p-4" style={sectionBg}>
            <h2 className="mb-3 border-b border-[#7F77DD]/20 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
              트로피
            </h2>
            <p className="mb-2 text-[10px] font-semibold text-[#AFA9EC]/90">수동 트로피 지급</p>
            <p className="mb-2 text-[10px] text-white/30">
              수상자의 프로필 UUID와 공모전을 선택하고 수상 등급을 지정하세요.
              User UUID는 Supabase → Authentication → Users 에서 확인할 수 있습니다.
            </p>
            <div className="space-y-1.5">
              <input
                value={trophyUserId}
                onChange={(e) => setTrophyUserId(e.target.value)}
                className="w-full rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none placeholder:text-white/20"
                placeholder="User UUID (e.g. 91fb0109-...)"
              />
              <select
                value={trophyCompetitionId}
                onChange={(e) => setTrophyCompetitionId(e.target.value)}
                className="w-full rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none"
              >
                <option value="">공모전 선택</option>
                {localCompetitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <select
                value={trophyAward}
                onChange={(e) => setTrophyAward(e.target.value)}
                className="w-full rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none"
              >
                {["대상", "금상", "은상", "입선", "장려상"].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  void call(() =>
                    grantCompetitionTrophyAction({
                      userId: trophyUserId.trim(),
                      competitionId: trophyCompetitionId.trim(),
                      award: trophyAward,
                    }),
                  )
                }
                className="w-full rounded-lg border border-[#7F77DD]/30 py-2 text-xs font-semibold text-[#AFA9EC] transition hover:bg-[#534AB7]/20"
              >
                트로피 지급
              </button>
              <div className="border-t border-white/[0.06] pt-2">
                <p className="mb-2 text-[10px] font-semibold text-[#AFA9EC]/90">주간 장르 트로피</p>
                <p className="mb-1.5 text-[10px] text-white/30">
                  매주 장르별 조회수 상위 크리에이터 3명에게 자동으로 트로피를 지급합니다.
                  날짜를 비워두면 가장 최근 완료된 주(월요일 기준)가 자동 선택됩니다.
                </p>
                <input
                  value={weeklyWeekStart}
                  onChange={(e) => setWeeklyWeekStart(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-xs text-white outline-none placeholder:text-white/20"
                  placeholder="Week start YYYY-MM-DD"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void call(() => runWeeklyGenreTrophiesAction(weeklyWeekStart.trim() || undefined))}
                  className="mt-1.5 w-full rounded-lg border border-white/[0.08] py-2 text-xs text-white/40 transition hover:text-white/70"
                >
                  주간 집계 실행
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 영상 관리 */}
        <div className="rounded-2xl border border-white/[0.08] p-4" style={{ ...sectionBg, overflow: "visible" }}>
          <div className="mb-3 flex items-center justify-between border-b border-[#7F77DD]/20 pb-1.5">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
              {selectedCompetition ? `${selectedCompetition.title}` : "영상 관리"}
              <span className="ml-2 text-white/30">({filteredVideos.length})</span>
            </h2>
            {selectedCompetition && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCompetition(null);
                  setVideoFilter("all");
                }}
                className="text-[10px] text-white/30 transition hover:text-white/60"
              >
                ← 전체 영상
              </button>
            )}
          </div>

          <div className="mb-3 flex items-center gap-2">
            {/* 장르/목적 드롭다운 */}
            <div className="relative flex-1">
              <select
                value={videoFilter}
                onChange={(e) => setVideoFilter(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-1.5 text-[10px] text-white outline-none"
              >
                <option value="all">전체 장르</option>
                <option value="competition">공모전</option>
                {selectedCompetition ? (
                  <option value={"competition_" + selectedCompetition.id}>{selectedCompetition.title}</option>
                ) : null}
                <option value="film">단편영화</option>
                <option value="animation">애니메이션</option>
                <option value="music">뮤직비디오</option>
                <option value="daily">일상</option>
                <option value="art">아트</option>
              </select>
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/30"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {/* 시간 드롭다운 */}
            <div className="relative flex-1">
              <select
                value={videoTimeFilter}
                onChange={(e) => setVideoTimeFilter(e.target.value as "all" | "week" | "month")}
                className="w-full cursor-pointer appearance-none rounded-lg border border-white/[0.12] bg-[#0d0b20] px-3 py-1.5 text-[10px] text-white outline-none"
              >
                <option value="all">전체 기간</option>
                <option value="week">이번 주</option>
                <option value="month">이번 달</option>
              </select>
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/30"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {/* 정렬 버튼 */}
            <div
              className="flex gap-1 rounded-lg p-0.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {[
                { key: "latest", label: "최신" },
                { key: "likes", label: "♥" },
                { key: "views", label: "👁" },
                { key: "reports", label: "🚨" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setVideoSort(key as "latest" | "likes" | "views" | "reports")}
                  className="rounded-md px-2 py-1 text-[10px] font-medium transition"
                  style={{
                    background: videoSort === key ? "rgba(83,74,183,0.5)" : "transparent",
                    color: videoSort === key ? "#AFA9EC" : "rgba(255,255,255,0.35)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[600px] space-y-1.5 overflow-y-auto overflow-x-visible pr-1">
            {filteredVideos.length === 0 && (
              <p className="text-xs text-white/30">영상이 없습니다.</p>
            )}
            {filteredVideos.map((v) => (
              <div
                key={v.id}
                className="rounded-lg border border-white/[0.06] p-2.5"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">{v.title}</p>
                    <p className="text-[10px] text-white/30">
                      {v.genre}
                      {v.purpose === "competition" ? " · Competition" : ""}
                      {v.viewCount != null
                        ? ` · ${v.viewCount >= 1000 ? `${(v.viewCount / 1000).toFixed(1)}K` : v.viewCount} views`
                        : ""}
                      {v.likeCount != null ? ` · ${v.likeCount} likes` : ""}
                    </p>
                  </div>
                  {v.award && (
                    <span className="shrink-0 rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-bold text-yellow-400">
                      {v.award}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void call(() => setVideoFinalistAction(v.id, !v.isFinalist))}
                    className="rounded-md border border-white/[0.08] px-2 py-1 text-[10px] transition hover:border-[#7F77DD]/30"
                    style={{
                      color: v.isFinalist ? "#AFA9EC" : "rgba(255,255,255,0.4)",
                      background: v.isFinalist ? "rgba(83,74,183,0.2)" : "transparent",
                    }}
                  >
                    {v.isFinalist ? "✓ 결선" : "결선 지정"}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void call(() => setVideoOriginalAction(v.id, !v.isOriginal))}
                    className="rounded-md border border-white/[0.08] px-2 py-1 text-[10px] transition hover:border-yellow-500/30"
                    style={{
                      color: v.isOriginal ? "#fbbf24" : "rgba(255,255,255,0.4)",
                      background: v.isOriginal ? "rgba(251,191,36,0.1)" : "transparent",
                    }}
                  >
                    {v.isOriginal ? "★ 추천" : "추천 지정"}
                  </button>
                  <Link
                    href={`/watch/${v.id}`}
                    target="_blank"
                    className="rounded-md border border-white/[0.08] px-2 py-1 text-[10px] text-white/40 transition hover:border-white/20 hover:text-white/70"
                  >
                    보기 →
                  </Link>
                  <div className="relative">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowAwardSelect(showAwardSelect === v.id ? null : v.id)}
                      className="rounded-md border border-white/[0.08] px-2 py-1 text-[10px] text-white/40 transition hover:border-yellow-500/30 hover:text-yellow-400"
                    >
                      🏆 {t("admin.setAward", "Set Award")}
                    </button>
                    {showAwardSelect === v.id && (
                      <AwardDropdown
                        videoId={v.id}
                        currentAward={v.award}
                        awardOptions={awardOptions}
                        newAwardOption={newAwardOption}
                        setNewAwardOption={setNewAwardOption}
                        onAddOption={() => {
                          if (!newAwardOption.trim()) return;
                          if (!awardOptions.includes(newAwardOption.trim())) {
                            setAwardOptions((prev) => [...prev, newAwardOption.trim()]);
                          }
                          setNewAwardOption("");
                        }}
                        onSelect={(award) => {
                          void call(() => setVideoAwardAction(v.id, award));
                          setShowAwardSelect(null);
                        }}
                        onClose={() => setShowAwardSelect(null)}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      void call(() =>
                        updateVideoVisibilityAction(v.id, v.visibility === "private" ? "public" : "private"),
                      )
                    }
                    className="rounded-md border border-white/[0.08] px-2 py-1 text-[10px] transition hover:border-white/20"
                    style={{ color: v.visibility === "private" ? "#f87171" : "rgba(255,255,255,0.4)" }}
                  >
                    {v.visibility === "private" ? "🔒 비공개" : "비공개"}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      if (!confirm(`"${v.title}" 영상을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
                      void call(() => deleteVideoAction(v.id));
                    }}
                    className="rounded-md border border-red-500/20 px-2 py-1 text-[10px] text-red-400/50 transition hover:border-red-500/40 hover:text-red-400"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
