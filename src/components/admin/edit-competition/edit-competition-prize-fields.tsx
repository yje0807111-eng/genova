"use client";

import { adminTokens } from "@/lib/admin-styles";
import type { EditCompetitionFormState } from "./types";

const inp =
  "w-full rounded-xl border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/20 focus:border-[#7F77DD]/60";

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
              background: isOver ? "rgba(239,68,68,0.1)" : "rgba(83,74,183,0.1)",
              border: `1px solid ${isOver ? "rgba(239,68,68,0.3)" : "rgba(127,119,221,0.2)"}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/35">총 상금</span>
              <span className="text-[13px] font-bold text-white">{sym}{total.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-white/35">배분됨</span>
              <span className="text-[12px] font-semibold text-white/55">{sym}{allocated.toLocaleString()}</span>
            </div>
            <div className="mt-1.5 h-px bg-white/10" />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] font-bold" style={{ color: isOver ? "#ef4444" : "#AFA9EC" }}>
                {isOver ? "초과" : "남은 금액"}
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

      <div className="space-y-2">
        {[
          { key: "prize_grand", label: "대상" },
          { key: "prize_excellence", label: "우수상" },
          { key: "prize_merit", label: "장려상" },
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
                  type="number"
                  value={val.replace(/[^0-9]/g, "")}
                  onChange={(e) => {
                    const n = e.target.value;
                    const formatted = n ? `${sym}${Number(n).toLocaleString()}` : "";
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
              <label className={adminTokens.inputLabel}>관객상</label>
              <div className="flex items-center gap-2">
                <div className="relative" style={{ flex: "3" }}>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-white/30">{sym}</span>
                  <input
                    type="number"
                    value={val.replace(/[^0-9]/g, "")}
                    onChange={(e) => {
                      const n = e.target.value;
                      const formatted = n ? `${sym}${Number(n).toLocaleString()}` : "";
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
                <span className="shrink-0 text-[11px] text-white/30">명</span>
              </div>
              {num > 0 && (
                <p className="mt-0.5 text-[10px] text-white/30">
                  1인당 {sym}{num.toLocaleString()} × {count}명 = <span className="text-[#AFA9EC]">{sym}{total.toLocaleString()}</span>
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
