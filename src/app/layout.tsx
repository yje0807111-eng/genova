import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";
import { LayoutWrapper } from "@/components/genova/layout-wrapper";
import { getServerLocale } from "@/lib/i18n/server";
import "./globals.css";
import { Toaster } from "sonner";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// 모바일 필수 — 없으면 브라우저가 ~980px 데스크톱 레이아웃을 그려
// 축소 표시(반응형 breakpoint 무력화). 모든 모바일 깨짐의 근본 원인.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://genovafilm.com"),
  title: {
    default: "Genova | The Home of AI Filmmakers",
    template: "%s | Genova",
  },
  description:
    "Discover, watch, and share AI-generated films from creators around the world. Genova is the streaming platform built for the next generation of AI filmmakers.",
  openGraph: {
    title: "Genova | The Home of AI Filmmakers",
    description: "Discover, watch, and share AI-generated films from creators around the world.",
    url: "https://genovafilm.com",
    siteName: "Genova",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Genova - The Home of AI Filmmakers",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Genova | The Home of AI Filmmakers",
    description: "Discover, watch, and share AI-generated films from creators around the world.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/icon.png",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read locale from the `genova-locale` cookie set by language-provider.tsx
  // (see B.2-2).  First paint now matches the user's selected locale —
  // no English flash on returning ko/ja sessions, no hydration mismatch.
  const locale = await getServerLocale();

  return (
    <html lang={locale} className={`${plusJakarta.variable} ${syne.variable} h-full antialiased`}>
      <head>
        {/*
          Pretendard variable font for Korean/Japanese rendering.

          Three optimizations stacked on this previously render-blocking
          load (D1 perf audit):
            1. `preconnect` to the CDN origin (the old version pointed to
               a full URL which made preconnect a no-op — it expects an
               origin only).
            2. `preload as="style"` so the bytes start downloading at
                the highest priority before the parser hits the
                stylesheet link.
            3. Keep the actual stylesheet link so first paint still has
               the font.  Future cleanup: switch to next/font/local with
               a hosted woff2 to eliminate the third-party request
               entirely.
        */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="preload"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* Noto Sans JP — Japanese coverage (Pretendard only covers kana/partial kanji). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
        />
      </head>
      <body className="min-h-full bg-background font-sans text-balance">
        <LayoutWrapper initialLocale={locale}>{children}</LayoutWrapper>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "white",
            },
          }}
        />
      </body>
    </html>
  );
}
