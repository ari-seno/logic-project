"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BarChart3,
  Boxes,
  FileText,
  Gauge,
  LayoutGrid,
  ListChecks,
  ScrollText,
  Server,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  heading: string;
  items: NavItem[];
};

export function projectIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([0-9a-fA-F-]{36})(?:\/|$)/);
  return match?.[1] ?? null;
}

function isActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const projectId = projectIdFromPathname(pathname);

  const sections: NavSection[] = [
    {
      heading: "Workspace",
      items: [
        { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: Gauge },
        { key: "projects", label: "Projects", href: "/projects", icon: LayoutGrid },
      ],
    },
  ];

  if (projectId) {
    const base = `/projects/${projectId}`;
    sections.push({
      heading: "Project",
      items: [
        { key: "overview", label: "Overview", href: base, icon: BarChart3 },
        {
          key: "requirements",
          label: "Requirements",
          href: `${base}/requirements`,
          icon: FileText,
        },
        {
          key: "architecture",
          label: "Architecture",
          href: `${base}/architecture`,
          icon: Boxes,
        },
        {
          key: "decisions",
          label: "Decisions",
          href: `${base}/decisions`,
          icon: ScrollText,
        },
        { key: "domain", label: "Domain", href: `${base}/domains/erd`, icon: Sparkles },
        { key: "api", label: "API", href: `${base}/api`, icon: Server },
        { key: "ui", label: "UI", href: `${base}/ui`, icon: LayoutGrid },
        { key: "tasks", label: "Tasks", href: `${base}/tasks`, icon: ListChecks },
      ],
    });
  }

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-6 px-3 py-4">
      {sections.map((section, sectionIndex) => (
        <div key={section.heading} className="flex flex-col gap-1">
          <p className="px-3 text-[length:var(--text-label)] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {section.heading}
          </p>
          {section.items.map((item) => {
            const exact =
              item.href === "/projects" ||
              (sectionIndex > 0 && item.key === "overview");
            const active = isActive(pathname, item.href, exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
