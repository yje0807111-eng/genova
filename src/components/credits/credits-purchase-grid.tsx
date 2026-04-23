"use client";

import { useEffect, useState } from "react";

export type CreditPackage = {
  usd: number;
  credits: number;
  bonusPct?: number;
  popular?: boolean;
};

const PACKAGES: CreditPackage[] = [
  { usd: 1, credits: 1000 },
  { usd: 5, credits: 5000 },
  { usd: 10, credits: 11000, bonusPct: 10 },
  { usd: 20, credits: 24000, bonusPct: 20 },
  { usd: 50, credits: 65000, bonusPct: 30, popular: true },
];

function formatCredits(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function CreditsPurchaseGrid() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const showComingSoon = () => setToast("Coming Soon");

  return (
    <>
      {toast ? (
        <div
          role="status"
          className="fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 rounded-full border border-[#534AB7]/60 bg-[#1a1535]/95 px-6 py-3 text-sm font-semibold text-[#EEEDFE] shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
        >
          {toast}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.usd}
            className={`relative flex flex-col rounded-xl border bg-[linear-gradient(165deg,rgba(19,16,40,0.95)_0%,rgba(8,6,24,0.98)_100%)] p-5 shadow-[inset_0_1px_0_rgba(127,119,221,0.1)] ${
              pkg.popular
                ? "border-[#7F77DD]/55 ring-2 ring-[#534AB7]/40"
                : "border-white/10"
            }`}
          >
            {pkg.popular ? (
              <span className="absolute -top-2.5 left-4 rounded-full bg-[#534AB7] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#EEEDFE] shadow-md">
                Most popular
              </span>
            ) : null}
            {pkg.bonusPct != null ? (
              <span className="mb-2 inline-flex w-fit rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-500/30">
                +{pkg.bonusPct}% bonus
              </span>
            ) : (
              <span className="mb-2 h-5" aria-hidden />
            )}
            <p className="font-display text-2xl font-bold tabular-nums text-[#F8F7FF]">${pkg.usd}</p>
            <p className="mt-1 text-sm text-[#AFA9EC]">
              <span className="font-semibold text-[#EEEDFE]">{formatCredits(pkg.credits)}</span> Credits
            </p>
            <button
              type="button"
              onClick={showComingSoon}
              className="mt-5 w-full rounded-lg bg-[#534AB7] py-2.5 text-sm font-semibold text-[#EEEDFE] transition hover:bg-[#7F77DD] focus:outline-none focus:ring-2 focus:ring-[#7F77DD]/50"
            >
              Purchase
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
