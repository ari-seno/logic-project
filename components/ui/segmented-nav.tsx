import Link from "next/link";

import { cn } from "@/lib/utils";

export type SegmentedNavItem = {
  key: string;
  label: string;
  href: string;
  count?: number;
};

export type SegmentedNavProps = {
  items: SegmentedNavItem[];
  activeKey?: string | null;
  ariaLabel: string;
  className?: string;
};

export function SegmentedNav({
  items,
  activeKey,
  ariaLabel,
  className,
}: SegmentedNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--muted)] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-[var(--surface-1)] text-[var(--brand)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            )}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                  isActive
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "bg-[var(--surface-1)] text-[var(--muted-foreground)]",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
