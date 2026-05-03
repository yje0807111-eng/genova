"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "ghost";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, size = "default", variant = "default", type = "button", ...props },
  ref,
) {
  const sizeCls =
    size === "sm"
      ? "h-9 px-3 text-sm"
      : size === "lg"
        ? "h-11 px-8 text-base"
        : "h-10 px-4 py-2 text-sm";
  const variantCls =
    variant === "outline"
      ? "border border-border bg-transparent text-foreground hover:bg-secondary"
      : variant === "ghost"
        ? "bg-transparent text-foreground hover:bg-secondary"
        : "bg-primary text-primary-foreground hover:bg-primary/90";
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        sizeCls,
        variantCls,
        className,
      )}
      {...props}
    />
  );
});
