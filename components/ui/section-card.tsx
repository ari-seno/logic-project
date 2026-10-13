import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[length:var(--text-label)] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {action}
        </div>
      ) : null}
    </header>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  variant = "flat",
  padding = "md",
  className,
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  variant?: "elevated" | "flat" | "inset";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}) {
  const variantClasses = {
    elevated:
      "bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] shadow-[var(--shadow-2)]",
    flat: "bg-[var(--surface-1)] border border-[var(--border)]",
    inset: "bg-[var(--muted)] border border-[var(--border)]",
  } as const;

  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  } as const;

  return (
    <section
      className={cn(
        "rounded-[var(--radius-lg)]",
        variantClasses[variant],
        paddingClasses[padding],
        className,
      )}
    >
      {title ? (
        <SectionHeader
          title={title}
          description={description}
          action={action}
          className={children ? "mb-3" : undefined}
        />
      ) : null}
      {children}
    </section>
  );
}
