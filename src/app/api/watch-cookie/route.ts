import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { videoId } = await req.json();
  if (!videoId) return NextResponse.json({ ok: false });

  const existing = req.cookies.get("genova_watched")?.value;
  const watched: string[] = existing ? JSON.parse(existing) : [];

  if (!watched.includes(videoId)) {
    watched.push(videoId);
    // 최근 50개만 유지
    if (watched.length > 50) watched.shift();
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("genova_watched", JSON.stringify(watched), {
    maxAge: 60 * 60 * 24 * 30, // 30일
    path: "/",
    httpOnly: false,
    sameSite: "lax",
  });
  return res;
}
