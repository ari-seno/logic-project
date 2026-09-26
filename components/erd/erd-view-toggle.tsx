"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

type ViewMode = "diagram" | "list";

export function ErdViewToggle({
  projectId,
  view,
}: {
  projectId: string;
  view: ViewMode;
}) {
  const baseHref = `/projects/${projectId}/domains/erd`;
  return (
    <div
      role="tablist"
      aria-label="ERD view mode"
      className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-1 text-sm shadow-sm"
    >
      <Link
        role="tab"
        aria-selected={view === "diagram"}
        href={baseHref}
        scroll={false}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-3 py-1.5 font-medium transition-colors",
          view === "diagram"
            ? "bg-[var(--brand)] text-[var(--brand-foreground)]"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        )}
      >
        Visual
      </Link>
      <Link
        role="tab"
        aria-selected={view === "list"}
        href={`${baseHref}?view=list`}
        scroll={false}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-3 py-1.5 font-medium transition-colors",
          view === "list"
            ? "bg-[var(--brand)] text-[var(--brand-foreground)]"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        )}
      >
        List
      </Link>
    </div>
  );
}
