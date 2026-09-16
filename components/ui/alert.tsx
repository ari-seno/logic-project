import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AlertVariant = "error" | "info" | "success";

const variants: Record<AlertVariant, string> = {
  error:
    "border-red-200 bg-red-50/80 text-red-800 backdrop-blur",
  info: "border-indigo-200 bg-indigo-50/80 text-indigo-800 backdrop-blur",
  success: "border-emerald-200 bg-emerald-50/80 text-emerald-800 backdrop-blur",
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
        "rounded-lg border px-4 py-2.5 text-sm leading-relaxed",
        variants[variant],
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
    <p className="mt-1.5 text-xs text-red-600" role="alert">
      {messages.join(". ")}
    </p>
  );
}
