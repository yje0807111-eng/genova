"use client";

import { adminTokens } from "@/lib/admin-styles";
import { useI18n } from "@/components/genova/language-provider";
import type { EditCompetitionFormState } from "./types";

const inp =
  "w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3.5 py-2.5 text-[13px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#7F77DD]/45";

export function EditCompetitionPrizeFields({
  form,
  setForm,
  prizeAmount,
  priceCurrency,
}: {
  form: EditCompetitionFormState;
  setForm: (updater: (p: EditCompetitionFormState) => EditCompetitionFormState) => void;
  prizeAmount: string;
  priceCurrency: "KRW" | "USD" | "JPY";
}) {
  const { t } = useI18n();
  return (
    <div>
      {/* 총상금 잔액 표시 */}
      {(() => {
        const sym = priceCurrency === "KRW" ? "₩" : priceCurrency === "USD" ? "$" : "¥";
        const total = Number(prizeAmount) || 0;
        const allocated =
          (Number(form.prize_grand.replace(/[^0-9]/g, "")) || 0) +
          (Number(form.prize_excellence.replace(/[^0-9]/g, "")) || 0) +
          (Number(form.prize_merit.replace(/[^0-9]/g, "")) || 0) +
          ((Number(form.prize_audience.replace(/[^0-9]/g, "")) || 0) * (form.prize_audience_count || 1));
        const remaining = total - allocated;
        const isOver = remaining < 0;
        return (
          <div
            className="mb-4 rounded-xl p-3"
            style={{
              background: isOver ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isOver ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.07)"}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/35">{t("adminCompEditPrize.totalPrize", "Total prize")}</span>
              <span className="text-[13px] font-bold text-white">{sym}{total.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-white/35">{t("adminCompEditPrize.allocated", "Allocated")}</span>
              <span className="text-[12px] font-semibold text-white/55">{sym}{allocated.toLocaleString()}</span>
            </div>
            <div className="mt-1.5 h-px bg-white/10" />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] font-bold" style={{ color: isOver ? "#ef4444" : "#AFA9EC" }}>
                {isOver ? t("adminCompEditPrize.over", "Over") : t("adminCompEditPrize.remaining", "Remaining")}
              </span>
              <span
                className="text-[13px] font-extrabold"
                style={{ color: isOver ? "#ef4444" : remaining === 0 ? "#34d399" : "#AFA9EC" }}
              >
                {sym}{Math.abs(remaining).toLocaleString()}
                {remaining === 0 && " ✓"}
              </span>
            </div>
          </div>
        );
      })()}

      {(() => {
        const sym = priceCurrency === "KRW" ? "₩" : priceCurrency === "USD" ? "$" : "¥";
        const total = Number(prizeAmount) || 0;
        const allocated =
          (Number(form.prize_grand.replace(/[^0-9]/g, "")) || 0) +
          (Number(form.prize_excellence.replace(/[^0-9]/g, "")) || 0) +
          (Number(form.prize_merit.replace(/[^0-9]/g, "")) || 0) +
          (Number(form.prize_audience.replace(/[^0-9]/g, "")) || 0) * (form.prize_audience_count || 1);
        const remaining = total - allocated;
        const btn =
          "rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-semibold text-white/55 transition hover:border-[#7F77DD]/40 hover:text-[#AFA9EC] disabled:opacity-30 disabled:hover:border-white/[0.08] disabled:hover:text-white/55";
        return (
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              className={btn}
              disabled={remaining <= 0}
              onClick={() =>
                setForm((p) => {
                  const cur = Number(p.prize_grand.replace(/[^0-9]/g, "")) || 0;
                  const v = cur + remaining;
                  return { ...p, prize_grand: v ? `${sym}${v.toLocaleString()}` : "" };
                })
              }
            >
              {t("adminCompEditPrize.fillGrandWithRemaining", "Fill Grand Prize with remaining")}
            </button>
            <button
              type="button"
              className={btn}
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  prize_grand: "",
                  prize_excellence: "",
                  prize_merit: "",
                  prize_audience: "",
                }))
              }
            >
              {t("adminCompEditPrize.clearAll", "Clear all")}
            </button>
          </div>
        );
      })()}

      <div className="space-y-2">
        {[
          { key: "prize_grand", label: t("adminCompEditPrize.grandPrize", "Grand Prize") },
          { key: "prize_excellence", label: t("adminCompEditPrize.excellenceAward", "Excellence Award") },
          { key: "prize_merit", label: t("adminCompEditPrize.meritAward", "Merit Award") },
        ].map((tier) => {
          const sym = priceCurrency === "KRW" ? "₩" : priceCurrency === "USD" ? "$" : "¥";
          const val = form[tier.key as "prize_grand" | "prize_excellence" | "prize_merit"];
          const num = Number(val.replace(/[^0-9]/g, "")) || 0;
          return (
            <div key={tier.key}>
              <label className={adminTokens.inputLabel}>{tier.label}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-white/30">{sym}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={num ? num.toLocaleString() : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    const formatted = raw ? `${sym}${Number(raw).toLocaleString()}` : "";
                    setForm((p) => ({ ...p, [tier.key]: formatted }));
                  }}
                  className={inp + " pl-7"}
                  placeholder="0"
                />
              </div>
              {num > 0 && (
                <p className="mt-0.5 text-[10px] text-white/30">
                  {sym}{num.toLocaleString()}
                  {priceCurrency === "USD" && (
                    <span className="ml-2">
                      · ₩{(num * (form.exchange_rate_usd_krw || 1350)).toLocaleString()}
                      · ¥{(num * (form.exchange_rate_usd_jpy || 148)).toLocaleString()}
                    </span>
                  )}
                  {priceCurrency === "KRW" && (
                    <span className="ml-2">
                      · ${Math.round(num / (form.exchange_rate_usd_krw || 1350)).toLocaleString()}
                    </span>
                  )}
                </p>
              )}
            </div>
          );
        })}

        {/* 관객상 — 인원 수 설정 */}
        {(() => {
          const sym = priceCurrency === "KRW" ? "₩" : priceCurrency === "USD" ? "$" : "¥";
          const val = form.prize_audience;
          const num = Number(val.replace(/[^0-9]/g, "")) || 0;
          const count = form.prize_audience_count || 1;
          const total = num * count;
          return (
            <div>
              <label className={adminTokens.inputLabel}>{t("adminCompEditPrize.audienceAward", "Audience Award")}</label>
              <div className="flex items-center gap-2">
                <div className="relative" style={{ flex: "3" }}>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-white/30">{sym}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={num ? num.toLocaleString() : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      const formatted = raw ? `${sym}${Number(raw).toLocaleString()}` : "";
                      setForm((p) => ({ ...p, prize_audience: formatted }));
                    }}
                    className={inp + " pl-7"}
                    placeholder="0"
                  />
                </div>
                <span className="shrink-0 text-[11px] text-white/30">×</span>
                <div style={{ flex: "1" }}>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={count}
                    onChange={(e) => setForm((p) => ({ ...p, prize_audience_count: Number(e.target.value) || 1 }))}
                    className={inp + " text-center"}
                    placeholder="1"
                  />
                </div>
                <span className="shrink-0 text-[11px] text-white/30">{t("adminCompEditPrize.peopleSuffix", "people")}</span>
              </div>
              {num > 0 && (
                <p className="mt-0.5 text-[10px] text-white/30">
                  {t("adminCompEditPrize.audienceBreakdown", "{amount} per person × {count} people = ")
                    .replace("{amount}", `${sym}${num.toLocaleString()}`)
                    .replace("{count}", String(count))}
                  <span className="text-[#AFA9EC]">{sym}{total.toLocaleString()}</span>
                  {priceCurrency === "USD" && <span className="ml-2">· ₩{(total * (form.exchange_rate_usd_krw || 1350)).toLocaleString()}</span>}
                </p>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
