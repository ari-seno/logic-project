import { cn } from "@/lib/utils";

export function StatChip({
  label,
  value,
  className,
}: {
  label: string;
  value: number | string;
  className?: string;
}) {
  const isEmpty = value === 0 || value === "0";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-1)] px-2 py-1 text-xs",
        className,
      )}
    >
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          isEmpty && "text-[var(--muted-foreground)]",
        )}
      >
        {value}
      </span>
    </span>
  );
}
