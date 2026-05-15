"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createCompetitionAction } from "@/app/actions/admin";
import { adminTokens } from "@/lib/admin-styles";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils/cn";

const STATUS_OPTIONS = [
  { value: "Open", label: "모집중" },
  { value: "In Review", label: "심사중" },
  { value: "Voting", label: "투표중" },
  { value: "Closed", label: "종료" },
] as const;

const KRW_QUICK_AMOUNTS: { label: string; value: number }[] = [
  { label: "30만", value: 300_000 },
  { label: "50만", value: 500_000 },
  { label: "100만", value: 1_000_000 },
  { label: "300만", value: 3_000_000 },
  { label: "500만", value: 5_000_000 },
];

export function CompetitionCreate({ onMessage }: { onMessage: (message: string) => void }) {
  const router = useRouter();
  const competitionThumbInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: "",
    title: "",
    subtitle: "",
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
  const [currency, setCurrency] = useState<"KRW" | "USD" | "JPY">("KRW");
  const [prizeAmount, setPrizeAmount] = useState("");
  const currencySymbol = currency === "KRW" ? "₩" : currency === "USD" ? "$" : "¥";
  const [competitionThumbPreview, setCompetitionThumbPreview] = useState<string | null>(null);
  const [competitionThumbDragging, setCompetitionThumbDragging] = useState(false);

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

  const applyPrizeAmount = (raw: string, sym: string) => {
    setPrizeAmount(raw);
    setForm((p) => ({ ...p, prizeInfo: raw ? `${sym}${Number(raw).toLocaleString()}` : "" }));
  };

  const call = async () => {
    setLoading(true);
    try {
      const res = await createCompetitionAction(form);
      if (res.ok) {
        // H6-D.4: this create form only captures the base (single-
        // locale) fields.  Multilang titles / prize tiers / exchange
        // rates live in the full edit form — deep-link there right
        // after creation so the operator finishes in one flow instead
        // of creating, hunting the row, then clicking Edit.
        onMessage("생성되었습니다. 상세 편집 화면으로 이동합니다.");
        if (res.id) {
          router.push(`/admin/competition/${res.id}`);
        } else {
          router.refresh();
        }
      } else {
        onMessage(res.message ?? "실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputFull = cn(adminTokens.input, "w-full");
  const textareaFull = cn(adminTokens.input, "min-h-[80px] w-full resize-none py-2");

  return (
    <div className={adminTokens.card}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className={cn(adminTokens.sectionHeader, "!mb-0")}>공모전 생성</h2>
      </div>

      <div className="space-y-3 border-b border-white/[0.04] pb-3">
        <div>
          <label className={adminTokens.inputLabel}>공모전 ID (선택사항)</label>
          <input
            value={form.id}
            onChange={(e) => setForm((p) => ({ ...p, id: e.target.value }))}
            className={inputFull}
            placeholder="비워두면 자동 생성"
          />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>
            공모전 제목 <span className="text-red-400">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className={inputFull}
            placeholder="예: 1회 Genova AI 단편영화 공모전"
          />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>서브제목</label>
          <input
            value={form.subtitle}
            onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
            className={inputFull}
            placeholder="예: AI 영상 창작자를 위한 글로벌 공모전"
          />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>장르</label>
          <select value={form.genre} onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))} className={inputFull}>
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
          <div className="flex flex-wrap gap-1">
            {STATUS_OPTIONS.map(({ value: s, label }) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((p) => ({ ...p, status: s }))}
                className={cn(
                  "h-8 rounded-md px-3 text-[12px] font-medium transition",
                  form.status === s ? "bg-white/10 text-white" : "text-white/35 hover:bg-white/[0.04] hover:text-white/70",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 border-b border-white/[0.04] pb-3 pt-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={adminTokens.inputLabel}>
              접수 마감일 <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={isoToDatetimeLocalValue(form.deadline)}
              onChange={(e) => setForm((p) => ({ ...p, deadline: datetimeLocalToIso(e.target.value) }))}
              className={inputFull}
            />
          </div>
          <div>
            <label className={adminTokens.inputLabel}>
              투표 마감일 <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={isoToDatetimeLocalValue(form.voteEnd)}
              onChange={(e) => setForm((p) => ({ ...p, voteEnd: datetimeLocalToIso(e.target.value) }))}
              className={inputFull}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={adminTokens.inputLabel}>총 상금</label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex shrink-0 gap-1">
              {(["KRW", "USD", "JPY"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    const sym = c === "KRW" ? "₩" : c === "USD" ? "$" : "¥";
                    setCurrency(c);
                    setForm((p) => ({ ...p, prizeInfo: prizeAmount ? `${sym}${Number(prizeAmount).toLocaleString()}` : "" }));
                  }}
                  className={cn(
                    "h-8 rounded-md px-3 text-[12px] font-medium transition",
                    currency === c ? "bg-white/10 text-white" : "text-white/35 hover:bg-white/[0.04] hover:text-white/70",
                  )}
                >
                  {c === "KRW" ? "₩ 원" : c === "USD" ? "$ 달러" : "¥ 엔"}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={prizeAmount}
              onChange={(e) => applyPrizeAmount(e.target.value, currencySymbol)}
              className={cn(adminTokens.input, "min-w-[140px] flex-1")}
              placeholder="금액 입력 (예: 1000000)"
            />
          </div>
          {currency === "KRW" ? (
            <div className="flex flex-wrap gap-1">
              {KRW_QUICK_AMOUNTS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => applyPrizeAmount(String(value), "₩")}
                  className="h-7 rounded-md border border-white/[0.08] px-2.5 text-[11px] text-white/55 transition hover:bg-white/[0.04] hover:text-white"
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 border-b border-white/[0.04] pb-3 pt-3">
        <div>
          <label className={adminTokens.inputLabel}>스폰서</label>
          <input value={form.sponsor} onChange={(e) => setForm((p) => ({ ...p, sponsor: e.target.value }))} className={inputFull} />
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
          <label className={adminTokens.inputLabel}>공모전 썸네일</label>
          {competitionThumbPreview ? (
            <div className="relative mt-1.5 overflow-hidden rounded-md border border-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob: URI from file input preview, next/image not applicable */}
              <img src={competitionThumbPreview} alt="" className="aspect-video max-h-40 w-full object-cover" />
            </div>
          ) : (
            <button
              type="button"
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
              className={cn(
                "mt-1.5 w-full rounded-md border border-dashed border-white/[0.1] bg-white/[0.01] py-6 text-center transition hover:border-white/[0.2]",
                competitionThumbDragging && "border-white/[0.2] bg-white/[0.03]",
              )}
            >
              <Upload size={16} className="mx-auto text-white/35" />
              <p className="mt-1.5 text-[11px] text-white/50">클릭하거나 이미지 드래그</p>
              <p className="text-[10px] text-white/30">JPG, PNG, WebP</p>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-3">
        <div>
          <label className={adminTokens.inputLabel}>참가 자격</label>
          <textarea value={form.eligibility} onChange={(e) => setForm((p) => ({ ...p, eligibility: e.target.value }))} className={textareaFull} />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>출품 가이드라인</label>
          <textarea
            value={form.submissionGuidelines}
            onChange={(e) => setForm((p) => ({ ...p, submissionGuidelines: e.target.value }))}
            className={textareaFull}
          />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>심사 방법</label>
          <textarea value={form.judgingCriteria} onChange={(e) => setForm((p) => ({ ...p, judgingCriteria: e.target.value }))} className={textareaFull} />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>규칙</label>
          <textarea value={form.rules} onChange={(e) => setForm((p) => ({ ...p, rules: e.target.value }))} className={textareaFull} />
        </div>
      </div>

      <button type="button" disabled={loading} onClick={() => void call()} className={cn(adminTokens.buttonPrimary, "mt-4 h-10 w-full")}>
        {loading ? "생성 중..." : "공모전 생성 →"}
      </button>
    </div>
  );
}
