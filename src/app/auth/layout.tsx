import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white"
      style={{ WebkitFontSmoothing: "antialiased" }}
    >
      {children}
    </div>
  );
}
