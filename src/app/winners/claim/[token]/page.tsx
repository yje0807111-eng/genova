import type { Metadata } from "next";
import { fetchWinnerByToken } from "@/app/actions/lottery-claim";
import { getServerLocale, getServerT } from "@/lib/i18n/server";
import { intlDateLocale } from "@/lib/i18n/browser-locale";
import { ClaimFlowClient } from "@/components/lottery/claim-flow-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Claim · Genova",
  robots: { index: false, follow: false },
};

/**
 * Winner claim landing page (Phase 5-C).
 *
 * The route is /winners/claim/[token].  The token in the URL is the
 * single authenticator — the page deliberately does NOT require a
 * logged-in session, since the winner might claim from a different
 * device than the one they uploaded from.
 *
 * Server side: read the minimal claim snapshot (without re-exposing
 * the token) and render the deadline / status header.  Hand the
 * interactive 3-step form to a tiny client island
 * (ClaimFlowClient) that owns its own state machine and calls the
 * Phase 5-B server actions.
 */
export default async function ClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [snapshot, locale] = await Promise.all([
    fetchWinnerByToken(token),
    getServerLocale(),
  ]);
  const t = getServerT(locale);

  // Bad / unknown token — render a neutral message, never reveal
  // whether the token was malformed vs nonexistent.
  if (!snapshot) {
    return (
      <main className="mx-auto flex min-h-[100svh] max-w-[640px] flex-col items-center justify-center px-6 py-16 text-center text-white">
        <h1 className="text-[22px] font-black tracking-tight">
          {t("claim.invalidToken", "This claim link is invalid or no longer active")}
        </h1>
      </main>
    );
  }

  const dateFmt = new Intl.DateTimeFormat(intlDateLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const deadlineCopy = t("claim.deadline", "Submit by {date}").replace(
    "{date}",
    dateFmt.format(new Date(snapshot.infoDeadline)),
  );

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(snapshot.infoDeadline).getTime() - Date.now()) / 86_400_000,
    ),
  );
  const daysLeftCopy = t("claim.daysLeft", "{n} day(s) left").replace(
    "{n}",
    String(daysLeft),
  );

  const isExpired =
    snapshot.claimStatus === "expired" ||
    new Date(snapshot.infoDeadline).getTime() < Date.now();
  const alreadySubmitted = snapshot.claimStatus !== "pending" && !isExpired;

  return (
    <main className="mx-auto flex min-h-[100svh] w-full max-w-[640px] flex-col justify-center px-6 py-16 text-white">
      <header className="mb-8 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
          🏆 Genova Lottery
        </p>
        <h1 className="mt-2 text-[28px] font-black tracking-tight md:text-[32px]">
          {t("claim.title", "Claim your prize")}
        </h1>
        <p className="mt-2 text-[13px] text-white/65">
          {t("claim.subtitle", "Tier {tier} · ${amount} USD")
            .replace("{tier}", String(snapshot.prizeTier))
            .replace("{amount}", String(snapshot.prizeAmountUsd))}
        </p>
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] text-white/45">
          <span>{deadlineCopy}</span>
          {!isExpired ? <span>· {daysLeftCopy}</span> : null}
        </p>
      </header>

      {isExpired ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-center text-[14px] text-red-200">
          {t("claim.expired", "The submission window has closed")}
        </div>
      ) : alreadySubmitted ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-center text-[14px] text-emerald-200">
          {t(
            "claim.alreadySubmitted",
            "You've already submitted your info. We'll be in touch within a few business days.",
          )}
        </div>
      ) : (
        <ClaimFlowClient token={token} />
      )}
    </main>
  );
}
