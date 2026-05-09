import type { ReactNode } from "react";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#080618]">{children}</div>;
}
