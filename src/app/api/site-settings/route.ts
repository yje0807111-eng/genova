import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithService } from "@/lib/auth/admin-actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "No supabase" }, { status: 500 });

  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  return NextResponse.json({ value: data?.value ?? null });
}

export async function POST(req: NextRequest) {
  // Admin-only: writes to site_settings must bypass RLS and require
  // an authenticated admin caller. Until this commit the POST handler
  // had NO auth guard at all, so anonymous callers could rewrite any
  // setting through PostgREST or the route directly.
  const auth = await requireAdminWithService();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }
  const { service } = auth;

  const { key, value } = await req.json();
  if (!key || !value) return NextResponse.json({ error: "Missing key or value" }, { status: 400 });

  await service
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
