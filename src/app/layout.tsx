import type { Metadata } from "next";
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
        <link rel="preconnect" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet" />
      </head>
      <body className="min-h-full bg-background font-sans text-balance">
        <LayoutWrapper>{children}</LayoutWrapper>
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
