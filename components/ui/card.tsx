import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CardVariant = "elevated" | "flat" | "inset" | "interactive";
export type CardPadding = "none" | "sm" | "md" | "lg";

const variantClasses: Record<CardVariant, string> = {
  elevated:
    "bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] shadow-[var(--shadow-2)] rounded-[var(--radius-lg)]",
  flat: "bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-lg)]",
  inset:
    "bg-[var(--muted)] border border-[var(--border)] shadow-none rounded-[var(--radius)]",
  interactive:
    "bg-[var(--surface-1)] border border-[var(--border)] rounded-[var(--radius-lg)] transition-colors hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-2)] focus-within:border-[var(--brand)]",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  variant = "elevated",
  padding = "lg",
  className,
  children,
  as: Tag = "div",
}: {
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  children: ReactNode;
  as?: ElementType;
}) {
  return (
    <Tag
      className={cn(variantClasses[variant], paddingClasses[padding], className)}
    >
      {children}
    </Tag>
  );
}
