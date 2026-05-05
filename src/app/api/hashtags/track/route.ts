import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type HashtagEventType = "search" | "click";

function normalizeTag(raw: string): string {
  return raw.replace(/^#+/, "").trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { tag?: string; eventType?: HashtagEventType } | null;
  const tag = normalizeTag(body?.tag ?? "");
  const eventType = body?.eventType;

  if (!tag || (eventType !== "search" && eventType !== "click")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 500 });

  const { error } = await supabase.rpc("increment_hashtag_stat", {
    p_tag: tag,
    p_event_type: eventType,
  });

  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
