"use client";

import { useEffect } from "react";

import { cn } from "@/lib/utils";

export type ApplyBannerProps = {
  open: boolean;
  title: string;
  detail: string;
  variant: "success" | "partial";
  onDismiss: () => void;
};

export function ApplyBanner({
  open,
  title,
  detail,
  variant,
  onDismiss,
}: ApplyBannerProps) {
  useEffect(() => {
    if (!open) return undefined;
    const id = window.setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => window.clearTimeout(id);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border px-4 py-3 shadow-xl backdrop-blur",
        variant === "success"
          ? "border-[var(--brand)]/40 bg-[var(--brand)]/10 text-[var(--foreground)]"
          : "border-[var(--brand)]/40 bg-amber-100 text-[var(--foreground)]",
      )}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{detail}</p>
    </div>
  );
}
