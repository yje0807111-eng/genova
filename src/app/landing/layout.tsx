import type { ReactNode } from "react";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#0a0a0a]">{children}</div>;
}
