import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AlertVariant = "error" | "info" | "success";

const variants: Record<AlertVariant, string> = {
  error:
    "border-red-300 bg-red-50 text-red-800",
  info: "border-blue-300 bg-blue-50 text-blue-800",
  success: "border-green-300 bg-green-50 text-green-800",
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
        "rounded-md border px-3 py-2 text-sm",
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
    <p className="mt-1 text-xs text-red-600" role="alert">
      {messages.join(". ")}
    </p>
  );
}
