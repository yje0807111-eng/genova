"use client";

import type { ReactNode } from "react";
import Link from "next/link";

/** Profile text link that stops parent click propagation */
export function ProfileTextLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={className}
    >
      {children}
    </Link>
  );
}
