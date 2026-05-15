import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

/**
 * Phase 5-D: cron endpoint that flips pending lottery winners past
 * their info_deadline to claim_status='expired'.  Wraps the Phase
 * 2A `expire_unclaimed_winners()` SECURITY DEFINER function.
 *
 * Auth: Vercel cron sends `Authorization: Bearer ${CRON_SECRET}`.
 * Reject anything else so the endpoint can't be browsed.
 *
 * Schedule (Vercel `vercel.json` or dashboard):
 *   - Daily once is plenty.  Per the spec, the deadline window is
 *     1 month, so one expiry sweep per day catches everything with
 *     no more than ~24h slop.  A more frequent schedule is
 *     harmless (RPC is idempotent — already-expired rows skip).
 *
 * Returns `{ expired: N }` where N is the number of rows flipped
 * this run.  Logged server-side for the operator to graph.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "DB connection failed" }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("expire_unclaimed_winners");
  if (error) {
    console.error("[cron/lottery-expire] rpc failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const expired = typeof data === "number" ? data : 0;
  console.log("[cron/lottery-expire] expired", { count: expired });
  return NextResponse.json({ expired });
}
