import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLandingCookie = request.cookies.has("genova_landing");

  // First-visit gate: route the bare root to the landing page once per
  // browser session.  The session cookie set on the redirect keeps the
  // rest of the session from looping; the "다시 안보기" button on the
  // landing page upgrades this to a 1-year persistent cookie so the
  // computer never sees the landing page again.
  if (pathname === "/" && !hasLandingCookie) {
    const landingUrl = request.nextUrl.clone();
    landingUrl.pathname = "/landing";
    const res = NextResponse.redirect(landingUrl);
    res.cookies.set("genova_landing", "1", { path: "/", sameSite: "lax" });
    return res;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    const res = NextResponse.next({ request });
    if (pathname.startsWith("/landing") && !hasLandingCookie) {
      res.cookies.set("genova_landing", "1", { path: "/", sameSite: "lax" });
    }
    return res;
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    /* Stale/invalid refresh token in cookies — continue; client will re-auth or use anon */
  }

  // Direct landing visits (e.g. clicking the logo) also mark the
  // session as "seen" so a subsequent "/" doesn't bounce back here.
  if (pathname.startsWith("/landing") && !hasLandingCookie) {
    supabaseResponse.cookies.set("genova_landing", "1", {
      path: "/",
      sameSite: "lax",
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
