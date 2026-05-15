"use client";

import type { CSSProperties, ReactNode } from "react";
import { useBusinessApplyModal } from "./business-apply-modal-context";

export function BusinessApplyButton({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const { open } = useBusinessApplyModal();
  return (
    <button type="button" onClick={open} className={className} style={style}>
      {children}
    </button>
  );
}
