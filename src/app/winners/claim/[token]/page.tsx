import type { Metadata } from "next";
import { Trophy, Clock, CheckCircle2, XCircle } from "lucide-react";
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
      <main className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden px-5 py-16 text-white">
        <ClaimBackdrop />
        <div
          className="anim-modal relative w-full max-w-[440px] rounded-3xl border border-white/[0.08] px-7 py-10 text-center"
          style={{
            background:
              "linear-gradient(160deg, rgba(20,16,40,0.9) 0%, rgba(10,10,10,0.96) 100%)",
            boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
          }}
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-400/25 bg-red-500/10">
            <XCircle className="h-6 w-6 text-red-300" />
          </div>
          <h1 className="text-[18px] font-black tracking-tight">
            {t("claim.invalidToken", "This claim link is invalid or no longer active")}
          </h1>
        </div>
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

  const urgent = !isExpired && daysLeft <= 3;

  return (
    <main className="relative flex min-h-[100svh] w-full justify-center overflow-hidden px-5 py-14 text-white">
      <ClaimBackdrop />

      <div className="relative flex w-full max-w-[600px] flex-col justify-center">
        {/* Prize hero card */}
        <section
          className="anim-modal relative overflow-hidden rounded-3xl border border-[#7F77DD]/20"
          style={{
            background:
              "linear-gradient(160deg, rgba(22,17,46,0.92) 0%, rgba(10,10,10,0.97) 100%)",
            boxShadow:
              "0 30px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(127,119,221,0.16)",
          }}
        >
          <div
            className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full opacity-70"
            style={{
              background:
                "radial-gradient(circle, rgba(83,74,183,0.4) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
            aria-hidden
          />
          <div className="relative px-7 pb-7 pt-9 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#AFA9EC]">
              {t("claim.eyebrow", "Genova Lottery")}
            </p>
            <div
              className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#F5D182]/25"
              style={{
                background:
                  "radial-gradient(circle at 50% 35%, rgba(245,209,130,0.22) 0%, rgba(83,74,183,0.12) 70%)",
              }}
            >
              <Trophy className="h-7 w-7 text-[#F5D182]" />
            </div>
            <h1 className="mt-5 text-[24px] font-black tracking-tight md:text-[28px]">
              {t("claim.title", "Claim your prize")}
            </h1>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span
                className="bg-clip-text text-[40px] font-black leading-none tracking-tight text-transparent md:text-[48px]"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #FFFFFF 0%, #F5D182 100%)",
                }}
              >
                ${snapshot.prizeAmountUsd}
              </span>
              <span className="rounded-full border border-[#7F77DD]/30 bg-[#534AB7]/15 px-3 py-1 text-[12px] font-bold text-[#AFA9EC]">
                {t("claim.tierBadge", "Tier {tier}").replace(
                  "{tier}",
                  String(snapshot.prizeTier),
                )}
              </span>
            </div>
            <div
              className={`mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-semibold ${
                urgent
                  ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                  : "border-white/[0.1] bg-white/[0.03] text-white/55"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{deadlineCopy}</span>
              {!isExpired ? (
                <>
                  <span className="opacity-40">·</span>
                  <span>{daysLeftCopy}</span>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {/* Status / flow */}
        <div className="mt-5">
          {isExpired ? (
            <StatusCard
              tone="red"
              icon={<XCircle className="h-5 w-5" />}
              text={t("claim.expired", "The submission window has closed")}
            />
          ) : alreadySubmitted ? (
            <StatusCard
              tone="emerald"
              icon={<CheckCircle2 className="h-5 w-5" />}
              text={t(
                "claim.alreadySubmitted",
                "You've already submitted your info. We'll be in touch within a few business days.",
              )}
            />
          ) : (
            <ClaimFlowClient token={token} />
          )}
        </div>
      </div>
    </main>
  );
}

function ClaimBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div
        className="absolute left-1/2 top-0 h-[60vh] w-[120vw] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(83,74,183,0.16) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-40 left-1/2 h-[50vh] w-[80vw] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(circle at 50% 100%, rgba(127,119,221,0.1) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
    </div>
  );
}

function StatusCard({
  tone,
  icon,
  text,
}: {
  tone: "red" | "emerald";
  icon: React.ReactNode;
  text: string;
}) {
  const palette =
    tone === "red"
      ? "border-red-400/25 bg-red-500/10 text-red-200"
      : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200";
  return (
    <div
      className={`anim-modal flex items-center gap-3 rounded-2xl border px-5 py-4 text-[14px] ${palette}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="leading-relaxed">{text}</span>
    </div>
  );
}
