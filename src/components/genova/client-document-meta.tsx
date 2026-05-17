"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/genova/language-provider";

function segmentTitle(pathname: string, t: (k: string, fb?: string) => string): string {
  if (pathname === "/" || pathname === "") return t("meta.title.home", "Home");
  if (pathname === "/films") return t("meta.title.films", "Films");
  if (pathname === "/feed") return t("meta.title.feed", "Feed");
  if (pathname === "/competition" || pathname.startsWith("/competition/"))
    return t("meta.title.competition", "Competition");
  if (pathname === "/upload" || pathname.startsWith("/upload/"))
    return t("meta.title.upload", "Upload");
  if (pathname === "/search") return t("meta.title.search", "Search");
  if (pathname.startsWith("/watch/")) return t("meta.title.watch", "Watch");
  if (pathname.startsWith("/profile/")) {
    if (pathname.includes("/settings")) return t("meta.title.settings", "Settings");
    return t("meta.title.profile", "Profile");
  }
  if (pathname.startsWith("/creator/")) return t("meta.title.creator", "Creator");
  if (pathname.startsWith("/genre/")) return t("meta.title.genre", "Genre");
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return t("meta.title.admin", "Admin");
  return t("meta.brand", "Genova");
}

export function ClientDocumentMeta() {
  const pathname = usePathname() ?? "";
  const { locale, t } = useI18n();

  useEffect(() => {
    const brand = t("meta.brand", "Genova");
    const page = segmentTitle(pathname, t);
    document.title = page === brand ? brand : `${page} | ${brand}`;

    const desc = t(
      "meta.defaultDescription",
      "The Home of AI Filmmakers",
    );
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, [pathname, locale, t]);

  return null;
}
