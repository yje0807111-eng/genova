"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-shell";

/** Home (`/`) renders its own `GenovaNavbar`; avoid double headers. */
export function SiteHeaderGate() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <SiteHeader />;
}
