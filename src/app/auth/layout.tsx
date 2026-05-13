export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white"
      style={{ fontFamily: "'Inter', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif", WebkitFontSmoothing: "antialiased" }}
    >
      {children}
    </div>
  );
}
