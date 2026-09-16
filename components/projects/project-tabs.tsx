import Link from "next/link";

import { cn } from "@/lib/utils";

type TabKey = "overview" | "requirements" | "decisions";

export function ProjectTabs({
  projectId,
  active,
}: {
  projectId: string;
  active: TabKey;
}) {
  const tabs: { key: TabKey; label: string; href: string }[] = [
    { key: "overview", label: "Overview", href: `/projects/${projectId}` },
    {
      key: "requirements",
      label: "Requirements",
      href: `/projects/${projectId}/requirements`,
    },
    {
      key: "decisions",
      label: "Decisions",
      href: `/projects/${projectId}/decisions`,
    },
  ];

  return (
    <nav
      aria-label="Project sections"
      className="flex gap-1 border-b border-[var(--border)]"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-[var(--brand)] text-[var(--brand)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
