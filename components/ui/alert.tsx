import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { toneSurfaceClasses, type StatusTone } from "@/components/ui/status-tone";

type AlertVariant = "error" | "info" | "success";

const variantTone: Record<AlertVariant, StatusTone> = {
  error: "danger",
  info: "info",
  success: "success",
};

export function Alert({
  variant = "info",
  children,
  className,
}: {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-4 py-2.5 text-sm leading-relaxed backdrop-blur",
        toneSurfaceClasses(variantTone[variant]),
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="mt-1.5 text-xs text-[var(--danger-fg)]" role="alert">
      {messages.join(". ")}
    </p>
  );
}
