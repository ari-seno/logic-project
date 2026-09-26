import Link from "next/link";

import { cn } from "@/lib/utils";

type TabKey =
  | "overview"
  | "requirements"
  | "decisions"
  | "domain"
  | "architecture"
  | "api"
  | "ui"
  | "tasks";

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
      key: "architecture",
      label: "Architecture",
      href: `/projects/${projectId}/architecture`,
    },
    {
      key: "decisions",
      label: "Decisions",
      href: `/projects/${projectId}/decisions`,
    },
    {
      key: "domain",
      label: "Domain",
      href: `/projects/${projectId}/domains/erd`,
    },
    {
      key: "api",
      label: "API",
      href: `/projects/${projectId}/api`,
    },
    {
      key: "ui",
      label: "UI",
      href: `/projects/${projectId}/ui`,
    },
    {
      key: "tasks",
      label: "Tasks",
      href: `/projects/${projectId}/tasks`,
    },
  ];

  return (
    <nav
      aria-label="Project sections"
      className="flex snap-x snap-mandatory gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--muted)] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "shrink-0 snap-center rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all",
              isActive
                ? "bg-[var(--surface-1)] text-[var(--brand)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
