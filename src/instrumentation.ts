import * as Sentry from "@sentry/nextjs";

// Server/edge Sentry init. Fully inert unless NEXT_PUBLIC_SENTRY_DSN is
// set (no DSN ⇒ no init ⇒ zero network/overhead). Set the env var in
// Vercel to activate; nothing else needed.
export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  if (
    process.env.NEXT_RUNTIME === "nodejs" ||
    process.env.NEXT_RUNTIME === "edge"
  ) {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      enabled: true,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
