import Link from "next/link";

import { StatChip } from "@/components/ui/stat-chip";
import { cn } from "@/lib/utils";

export function StageCard({
  title,
  subtitle,
  href,
  metrics,
  done,
}: {
  title: string;
  subtitle: string;
  href: string;
  metrics: { label: string; value: number }[];
  done: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            {subtitle}
          </p>
        </div>
        <span
          aria-hidden="true"
          className={cn(
            "mt-1 h-2 w-2 shrink-0 rounded-full",
            done ? "bg-[var(--success)]" : "bg-[var(--border-strong)]",
          )}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {metrics.map((metric) => (
          <StatChip
            key={metric.label}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </div>
      <Link
        href={href}
        className="mt-auto text-xs font-medium text-[var(--brand)] hover:underline"
      >
        Open section →
      </Link>
    </div>
  );
}
