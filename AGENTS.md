<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

Project pins **Next.js 16.2.3** with **React 19.2** on Turbopack. APIs, conventions, and file structure differ from earlier Next versions in ways that bite training-data assumptions. Read `node_modules/next/dist/docs/` before writing code that touches the framework. Heed deprecation notices.

## Genova-specific Next 16 conventions

- **Server Components by default.** Add `"use client"` only when you need state, effects, or browser APIs.
- **Async `params` and `searchParams`.** Every dynamic route hands them in as a `Promise`:
  ```ts
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  }
  ```
- **`generateMetadata` is async.** Same `Promise<params>` signature. See `src/app/watch/[id]/page.tsx`.
- **Turbopack is the dev bundler.** `next.config.ts` pins `turbopack.root` to this dir so it doesn't reach for an outer lockfile.
- **App-router special files in use:** `app/{robots,sitemap,opengraph-image}.ts` conventions over manual `<head>` tags. `metadataBase` set in `app/layout.tsx`.
- **Image hosts whitelist.** `next.config.ts` `images.remotePatterns` — Mux (`image.mux.com`), Supabase project hostname (auto-injected from `NEXT_PUBLIC_SUPABASE_URL`), and a handful of placeholder CDNs. Add new hosts there, not in code.
- **Server Actions live in `src/app/actions/*.ts` (`"use server"`)**. Admin guards use the shared `requireAdmin` / `requireAdminWithService` helpers in `src/lib/auth/admin-actions.ts` — see `docs/rls-audit.md` for which tables need the service-role client.

## Things easy to get wrong

- `import type { mapVideo }` then using `Parameters<typeof mapVideo>` works in TypeScript but has caused Turbopack cache invalidation in this repo. Use a regular import when the value is referenced via `typeof`.
- `from("profiles")` for arbitrary-user reads is blocked (own-only SELECT after migration `20260514120700_profiles_select_own_only.sql`). Use the `public.public_profiles` view instead — or `fetchPublicProfileById` / `mergeVideoRows`.
- `<img>` is lint-flagged. Use `next/image`. Form previews on `blob:` / `data:` URIs are the only legitimate `<img>` left — see commit `4..` (P2-6).
<!-- END:nextjs-agent-rules -->
