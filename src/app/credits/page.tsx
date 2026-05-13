import { redirect } from "next/navigation";
import { AnimateIn } from "@/components/animate-in";
import { CreditsPurchaseGrid } from "@/components/credits/credits-purchase-grid";
import { fetchCreditTransactionsForUser } from "@/lib/queries/credits-queries";
import { fetchProfileById } from "@/lib/queries/profile-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatNum(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

const POINTS_USAGE = [
  {
    title: "Convert to Credits",
    body: "Exchange reward Points for Credits at the platform rate to unlock premium tools and catalog content.",
  },
  {
    title: "Studio & generation",
    body: "Spend Credits on Genova Studio sessions, renders, and AI-assisted workflows tied to your projects.",
  },
  {
    title: "Recipes & packs",
    body: "Purchase creator Recipes, style packs, and reusable prompt templates from the marketplace.",
  },
  {
    title: "1:1 prompt trades",
    body: "Tip creators or buy bespoke prompt sessions — Points and Credits keep peer trades transparent.",
  },
];

export default async function CreditsPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const profile = await fetchProfileById(user.id);
  if (!profile) redirect("/auth");

  const transactions = await fetchCreditTransactionsForUser(user.id);

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, #0D0B1E 0%, rgba(13,11,30,0.82) 180px, rgba(13,11,30,0.42) 320px, transparent 460px), radial-gradient(ellipse 62% 52% at 52% 6%, rgba(83,74,183,0.26) 0%, rgba(83,74,183,0.12) 32%, rgba(10,10,10,0) 72%), radial-gradient(ellipse 46% 40% at 14% 10%, rgba(127,119,221,0.13) 0%, rgba(10,10,10,0) 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          mixBlendMode: "soft-light",
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.26) 0.5px, transparent 0.8px), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.2) 0.5px, transparent 0.8px)",
          backgroundSize: "3px 3px, 4px 4px",
        }}
      />

      <div className="page-cinematic relative mx-auto max-w-5xl space-y-10 px-6 py-10 text-[#EEEDFE] sm:px-8 lg:px-10">
        <AnimateIn delay={0} className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#7F77DD]/90">Wallet</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-[42px]">Credits &amp; Points</h1>
          <p className="max-w-2xl text-sm text-[#AFA9EC]">
            Top up Credits for studio time and purchases; earn Points from community activity and convert them when you are ready.
          </p>
        </AnimateIn>

        <AnimateIn delay={0.05}>
          <section className="rounded-2xl border border-white/10 bg-[linear-gradient(165deg,rgba(19,16,40,0.92)_0%,rgba(10,10,10,0.96)_100%)] p-6 shadow-[inset_0_1px_0_rgba(127,119,221,0.12)] backdrop-blur-sm sm:p-8">
            <h2 className="sr-only">Balance</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7F77DD]">Credits</p>
                <p className="mt-2 font-display text-4xl font-bold tabular-nums text-[#F8F7FF]">{formatNum(profile.credits)}</p>
                <p className="mt-1 text-xs text-[#AFA9EC]/90">Spend on Studio, recipes, and catalog unlocks.</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7F77DD]">Points</p>
                <p className="mt-2 font-display text-4xl font-bold tabular-nums text-[#F8F7FF]">{formatNum(profile.points)}</p>
                <p className="mt-1 text-xs text-[#AFA9EC]/90">Earn from engagement; convert to Credits anytime.</p>
              </div>
            </div>
            <div className="mt-8 rounded-xl border border-[#534AB7]/25 bg-black/25 px-4 py-3 text-center text-sm text-[#AFA9EC]">
              <span className="font-semibold text-[#EEEDFE]">100 Points = $1 = 1,000 Credits</span>
              <span className="mx-2 text-[#534AB7]/80">·</span>
              Rates and bonuses may vary by region; final amounts shown at checkout.
            </div>
          </section>
        </AnimateIn>

        <AnimateIn delay={0.1}>
          <section className="space-y-5" aria-labelledby="packages-heading">
            <div>
              <h2 id="packages-heading" className="text-xl font-bold text-[#EEEDFE]">
                Credit packs
              </h2>
              <p className="mt-1 text-sm text-[#AFA9EC]">Larger packs include bonus Credits. Payments will open in a secure flow when checkout goes live.</p>
            </div>
            <CreditsPurchaseGrid />
          </section>
        </AnimateIn>

        <AnimateIn delay={0.12}>
          <section className="space-y-5" aria-labelledby="usage-heading">
            <h2 id="usage-heading" className="text-xl font-bold text-[#EEEDFE]">
              What you can do with Points
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {POINTS_USAGE.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/10 bg-[#131028]/80 p-5 ring-1 ring-white/[0.04]"
                >
                  <h3 className="font-semibold text-[#F8F7FF]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#AFA9EC]">{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        </AnimateIn>

        <AnimateIn delay={0.15}>
          <section className="space-y-4" aria-labelledby="history-heading">
            <h2 id="history-heading" className="text-xl font-bold text-[#EEEDFE]">
              Credit activity
            </h2>
            {transactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 bg-[#1A1535]/40 px-6 py-14 text-center text-sm text-[#AFA9EC]">
                No transactions yet
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0A0818]/80 text-xs uppercase tracking-wider text-[#7F77DD]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Details</th>
                      <th className="px-4 py-3 text-right font-semibold">Change</th>
                      <th className="hidden px-4 py-3 text-right font-semibold sm:table-cell">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-[#131028]/50">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="text-[#EEEDFE]">
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[#AFA9EC]">
                          {new Date(tx.createdAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-4 py-3 text-[#AFA9EC]">{tx.reason ?? "—"}</td>
                        <td className={`px-4 py-3 text-right font-medium tabular-nums ${tx.delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                          {tx.delta >= 0 ? "+" : ""}
                          {formatNum(tx.delta)}
                        </td>
                        <td className="hidden px-4 py-3 text-right tabular-nums text-[#AFA9EC] sm:table-cell">
                          {tx.balanceAfter != null ? formatNum(tx.balanceAfter) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </AnimateIn>
      </div>
    </div>
  );
}
