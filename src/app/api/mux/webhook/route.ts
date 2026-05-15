import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

/**
 * C1: Mux webhook receiver.
 *
 * The upload form already polls /api/mux/asset?uploadId=... until the
 * asset reports `ready`, then submits the form with the correct
 * mux_playback_id / mux_asset_id / duration_seconds.  Polling alone is
 * fragile though — if the user closes the tab before the asset is ready
 * the row gets created with duration_seconds=0 (skipping lottery
 * issuance) or, worse, the form never submits at all and the asset
 * becomes orphaned for cleanup-mux to delete.
 *
 * This webhook is the authoritative source of truth: when Mux marks an
 * asset ready, we backfill the matching `videos` row's
 * mux_playback_id, mux_asset_id, and duration_seconds from the event
 * payload.  No-op when the row doesn't exist yet (normal race during
 * the upload flow).
 *
 * Events handled:
 *   video.asset.ready          — backfill playback_id + duration
 *   video.asset.errored        — log so cleanup-mux later removes it
 *   video.upload.asset_created — backfill mux_asset_id by upload_id
 *
 * Security: Mux signs every payload.  We pass the raw body + headers
 * through `mux.webhooks.unwrap()` which verifies the v1 HMAC against
 * MUX_WEBHOOK_SIGNING_SECRET and returns a typed event.  Verification
 * failure → 400.  Mux retries on non-2xx, so transient DB errors
 * return 500; permanent ones (row not found, no signing secret in
 * dev) return 200 to drop the redelivery.
 *
 * Idempotency: every UPDATE is keyed by mux_asset_id and writes
 * specific columns only if they're still empty (COALESCE) or the
 * value actually differs.  Replaying the same event is a no-op.
 */

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(req: Request) {
  const signingSecret = process.env.MUX_WEBHOOK_SIGNING_SECRET;
  const rawBody = await req.text();

  // No secret configured (dev / preview) — accept and log only.  We
  // never trust the body for writes in this branch.
  if (!signingSecret) {
    console.warn("[mux/webhook] MUX_WEBHOOK_SIGNING_SECRET not set, dropping event");
    return NextResponse.json({ ok: true, verified: false });
  }

  let event;
  try {
    event = await mux.webhooks.unwrap(rawBody, req.headers, signingSecret);
  } catch (e) {
    console.error("[mux/webhook] signature verify failed", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    console.error("[mux/webhook] service client unavailable");
    // Return 500 so Mux retries — the secret is configured, so a DB
    // outage shouldn't drop the event permanently.
    return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "video.asset.ready": {
        const asset = event.data as {
          id?: string;
          playback_ids?: { id: string; policy: string }[];
          duration?: number;
        };
        const assetId = asset.id;
        if (!assetId) {
          console.warn("[mux/webhook] video.asset.ready missing data.id");
          break;
        }
        const playbackId =
          asset.playback_ids?.find((p) => p.policy === "public")?.id ??
          asset.playback_ids?.[0]?.id ??
          null;
        const durationSeconds = asset.duration
          ? Math.round(asset.duration)
          : null;

        // Only fill fields that are still empty / zero.  The create
        // action sets them up-front in the normal flow; this is the
        // defense-in-depth path for closed-tab uploads or duration-0
        // races.  Two-step (read then UPDATE) because PostgREST
        // doesn't expose a conditional-update primitive without a
        // custom RPC.
        const { data: row, error: readErr } = await supabase
          .from("videos")
          .select("id, mux_playback_id, duration_seconds")
          .eq("mux_asset_id", assetId)
          .maybeSingle();
        if (readErr) {
          console.error("[mux/webhook] videos lookup failed", assetId, readErr);
          return NextResponse.json({ error: readErr.message }, { status: 500 });
        }
        if (!row) {
          // Normal race: webhook arrived before createVideoAction
          // wrote the row.  The create action will populate the
          // values itself.
          console.log("[mux/webhook] no videos row yet for asset", assetId);
          break;
        }

        const patch: Record<string, unknown> = {};
        if (playbackId && !row.mux_playback_id) {
          patch.mux_playback_id = playbackId;
        }
        if (
          durationSeconds &&
          durationSeconds > 0 &&
          (!row.duration_seconds || row.duration_seconds === 0)
        ) {
          patch.duration_seconds = durationSeconds;
        }

        if (Object.keys(patch).length === 0) {
          // Row already has authoritative values from the create
          // action — webhook adds nothing.
          break;
        }

        const { error: updErr } = await supabase
          .from("videos")
          .update(patch)
          .eq("id", row.id);
        if (updErr) {
          console.error("[mux/webhook] videos update failed", row.id, updErr);
          return NextResponse.json({ error: updErr.message }, { status: 500 });
        }
        console.log("[mux/webhook] backfilled", row.id, patch);
        break;
      }

      case "video.asset.errored": {
        const asset = event.data as {
          id?: string;
          errors?: { type?: string; messages?: string[] };
        };
        // Just log — we don't have an asset_status column on videos
        // yet, and the upload form polling already surfaces errors to
        // the user.  Cleanup-mux will collect the asset later.
        console.error(
          "[mux/webhook] video.asset.errored",
          asset.id,
          asset.errors,
        );
        break;
      }

      case "video.upload.asset_created": {
        // Belt-and-suspenders: if the client polled
        // /api/mux/asset?uploadId=... and got the asset_id, the row
        // already has it.  But if the form submitted with only the
        // upload_id (legacy / partial path), this lets us backfill.
        const data = event.data as {
          id?: string; // upload_id
          asset_id?: string;
        };
        if (!data.id || !data.asset_id) break;

        const { error: updErr } = await supabase
          .from("videos")
          .update({ mux_asset_id: data.asset_id })
          .eq("mux_upload_id", data.id)
          .is("mux_asset_id", null);
        if (updErr) {
          console.error(
            "[mux/webhook] asset_created backfill failed",
            data.id,
            updErr,
          );
          return NextResponse.json({ error: updErr.message }, { status: 500 });
        }
        break;
      }

      default:
        // Plenty of Mux events we don't care about (live_stream.*,
        // video.asset.master.ready, etc.).  Acknowledge so Mux doesn't
        // retry.
        break;
    }
  } catch (e) {
    console.error("[mux/webhook] handler exception", event.type, e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, type: event.type });
}
