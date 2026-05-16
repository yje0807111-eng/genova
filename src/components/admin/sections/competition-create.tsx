"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createCompetitionAction } from "@/app/actions/admin";
import { adminTokens } from "@/lib/admin-styles";
import { useI18n } from "@/components/genova/language-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils/cn";

const STATUS_OPTIONS = [
  { value: "Open", labelKey: "adminCompCreate.statusOpen", labelEn: "Open" },
  { value: "In Review", labelKey: "adminCompCreate.statusInReview", labelEn: "In Review" },
  { value: "Voting", labelKey: "adminCompCreate.statusVoting", labelEn: "Voting" },
  { value: "Closed", labelKey: "adminCompCreate.statusClosed", labelEn: "Closed" },
] as const;

const KRW_QUICK_AMOUNTS: { labelKey: string; labelEn: string; value: number }[] = [
  { labelKey: "adminCompCreate.krw300k", labelEn: "300K", value: 300_000 },
  { labelKey: "adminCompCreate.krw500k", labelEn: "500K", value: 500_000 },
  { labelKey: "adminCompCreate.krw1m", labelEn: "1M", value: 1_000_000 },
  { labelKey: "adminCompCreate.krw3m", labelEn: "3M", value: 3_000_000 },
  { labelKey: "adminCompCreate.krw5m", labelEn: "5M", value: 5_000_000 },
];

export function CompetitionCreate({ onMessage }: { onMessage: (message: string) => void }) {
  const { t } = useI18n();
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
    judgingProcess: "",
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

  const missingRequired = !form.title.trim() || !form.deadline || !form.voteEnd;

  const call = async () => {
    if (missingRequired) {
      onMessage(t("adminCompCreate.requiredWarning", "Title, submission deadline, and voting deadline are required."));
      return;
    }
    setLoading(true);
    try {
      const res = await createCompetitionAction(form);
      if (res.ok) {
        // H6-D.4: this create form only captures the base (single-
        // locale) fields.  Multilang titles / prize tiers / exchange
        // rates live in the full edit form — deep-link there right
        // after creation so the operator finishes in one flow instead
        // of creating, hunting the row, then clicking Edit.
        onMessage(t("adminCompCreate.created", "Created. Moving to the detail edit screen."));
        if (res.id) {
          router.push(`/admin/competition/${res.id}`);
        } else {
          router.refresh();
        }
      } else {
        onMessage(res.message ?? t("adminCompCreate.failed", "Failed."));
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
        <h2 className={cn(adminTokens.sectionHeader, "!mb-0")}>{t("adminCompCreate.header", "Create Competition")}</h2>
      </div>

      <div className="space-y-3 border-b border-white/[0.04] pb-3">
        <div>
          <label className={adminTokens.inputLabel}>{t("adminCompCreate.idLabel", "Competition ID (optional)")}</label>
          <input
            value={form.id}
            onChange={(e) => setForm((p) => ({ ...p, id: e.target.value }))}
            className={inputFull}
            placeholder={t("adminCompCreate.idPlaceholder", "Auto-generated if left blank")}
          />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>
            {t("adminCompCreate.titleLabel", "Competition Title")} <span className="text-red-400">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className={inputFull}
            placeholder={t("adminCompCreate.titlePlaceholder", "e.g. 1st Genova AI Short Film Competition")}
          />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>{t("adminCompCreate.subtitleLabel", "Subtitle")}</label>
          <input
            value={form.subtitle}
            onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
            className={inputFull}
            placeholder={t("adminCompCreate.subtitlePlaceholder", "e.g. A global competition for AI video creators")}
          />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>{t("adminCompCreate.genreLabel", "Genre")}</label>
          <select value={form.genre} onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value }))} className={inputFull}>
            <option value="All">{t("adminCompCreate.genreAll", "All Genres")}</option>
            <option value="film">{t("adminCompCreate.genreFilm", "Short Film")}</option>
            <option value="animation">{t("adminCompCreate.genreAnimation", "Animation")}</option>
            <option value="music">{t("adminCompCreate.genreMusic", "Music Video")}</option>
            <option value="daily">{t("adminCompCreate.genreDaily", "Daily")}</option>
            <option value="art">{t("adminCompCreate.genreArt", "Art")}</option>
          </select>
        </div>
        <div>
          <label className={adminTokens.inputLabel}>{t("adminCompCreate.statusLabel", "Status")}</label>
          <div className="flex flex-wrap gap-1">
            {STATUS_OPTIONS.map(({ value: s, labelKey, labelEn }) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((p) => ({ ...p, status: s }))}
                className={cn(
                  "h-8 rounded-md px-3 text-[12px] font-medium transition",
                  form.status === s ? "bg-white/10 text-white" : "text-white/35 hover:bg-white/[0.04] hover:text-white/70",
                )}
              >
                {t(labelKey, labelEn)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 border-b border-white/[0.04] pb-3 pt-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={adminTokens.inputLabel}>
              {t("adminCompCreate.deadlineLabel", "Submission Deadline")} <span className="text-red-400">*</span>
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
              {t("adminCompCreate.voteEndLabel", "Voting Deadline")} <span className="text-red-400">*</span>
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
          <label className={adminTokens.inputLabel}>{t("adminCompCreate.prizeLabel", "Total Prize")}</label>
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
                  {c === "KRW"
                    ? t("adminCompCreate.currencyKRW", "₩ KRW")
                    : c === "USD"
                      ? t("adminCompCreate.currencyUSD", "$ USD")
                      : t("adminCompCreate.currencyJPY", "¥ JPY")}
                </button>
              ))}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={prizeAmount ? Number(prizeAmount).toLocaleString() : ""}
              onChange={(e) => applyPrizeAmount(e.target.value.replace(/[^0-9]/g, ""), currencySymbol)}
              className={cn(adminTokens.input, "min-w-[140px] flex-1")}
              placeholder={t("adminCompCreate.prizePlaceholder", "Enter amount (e.g. 1,000,000)")}
            />
          </div>
          {currency === "KRW" ? (
            <div className="flex flex-wrap gap-1">
              {KRW_QUICK_AMOUNTS.map(({ labelKey, labelEn, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => applyPrizeAmount(String(value), "₩")}
                  className="h-7 rounded-md border border-white/[0.08] px-2.5 text-[11px] text-white/55 transition hover:bg-white/[0.04] hover:text-white"
                >
                  {t(labelKey, labelEn)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 border-b border-white/[0.04] pb-3 pt-3">
        <div>
          <label className={adminTokens.inputLabel}>{t("adminCompCreate.sponsorLabel", "Sponsor")}</label>
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
          <label className={adminTokens.inputLabel}>{t("adminCompCreate.thumbnailLabel", "Competition Thumbnail")}</label>
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
              <p className="mt-1.5 text-[11px] text-white/50">{t("adminCompCreate.uploadHint", "Click or drag an image")}</p>
              <p className="text-[10px] text-white/30">JPG, PNG, WebP</p>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-3">
        <div>
          <label className={adminTokens.inputLabel}>{t("adminCompCreate.eligibilityLabel", "Eligibility")}</label>
          <textarea value={form.eligibility} onChange={(e) => setForm((p) => ({ ...p, eligibility: e.target.value }))} className={textareaFull} />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>{t("adminCompCreate.submissionGuidelinesLabel", "Submission Guidelines")}</label>
          <textarea
            value={form.submissionGuidelines}
            onChange={(e) => setForm((p) => ({ ...p, submissionGuidelines: e.target.value }))}
            className={textareaFull}
          />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>{t("adminCompCreate.judgingCriteriaLabel", "Judging Method")}</label>
          <textarea value={form.judgingCriteria} onChange={(e) => setForm((p) => ({ ...p, judgingCriteria: e.target.value }))} className={textareaFull} />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>{t("adminCompCreate.judgingProcessLabel", "Judging Process (Steps)")}</label>
          <p className="mb-1.5 text-[10px] text-white/25">{t("adminCompCreate.judgingProcessHint", "One step per line. Use \"Title — description\" to split title and detail.")}</p>
          <textarea
            value={form.judgingProcess}
            onChange={(e) => setForm((p) => ({ ...p, judgingProcess: e.target.value }))}
            className={textareaFull}
            placeholder={"Round 1 — Staff pre-screening.\nRound 2 — Jury evaluation (100%).\nFinal — Results after voting deadline."}
          />
        </div>
        <div>
          <label className={adminTokens.inputLabel}>{t("adminCompCreate.rulesLabel", "Rules")}</label>
          <textarea value={form.rules} onChange={(e) => setForm((p) => ({ ...p, rules: e.target.value }))} className={textareaFull} />
        </div>
      </div>

      <button
        type="button"
        disabled={loading || missingRequired}
        onClick={() => void call()}
        className={cn(adminTokens.buttonPrimary, "mt-4 h-10 w-full disabled:cursor-not-allowed disabled:opacity-40")}
      >
        {loading
          ? t("adminCompCreate.submitting", "Creating...")
          : missingRequired
            ? t("adminCompCreate.submitMissing", "Enter required fields")
            : t("adminCompCreate.submit", "Create Competition →")}
      </button>
    </div>
  );
}
