"use client";

import { useEffect, useState } from "react";

export function AnimateIn({
  delay = 0,
  children,
  className,
}: {
  delay?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      data-animate-in
      className={className}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0px)" : "translateY(16px)",
        transition: "opacity 0.35s cubic-bezier(0.22,1,0.36,1), transform 0.35s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {children}
    </div>
  );
}
