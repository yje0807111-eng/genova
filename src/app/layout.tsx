import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";
import { LayoutWrapper } from "@/components/genova/layout-wrapper";
import "./globals.css";

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
    icon: "/genova-logo.png",
    shortcut: "/genova-logo.png",
    apple: "/genova-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${syne.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet" />
      </head>
      <body className="min-h-full bg-background font-sans text-balance">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
