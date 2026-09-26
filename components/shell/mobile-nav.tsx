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
  Menu,
  ScrollText,
  Server,
  Sparkles,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { projectIdFromPathname } from "@/components/shell/app-sidebar";

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const projectId = projectIdFromPathname(pathname);

  const sections: { heading: string; items: NavItem[] }[] = [
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
        { key: "requirements", label: "Requirements", href: `${base}/requirements`, icon: FileText },
        { key: "architecture", label: "Architecture", href: `${base}/architecture`, icon: Boxes },
        { key: "decisions", label: "Decisions", href: `${base}/decisions`, icon: ScrollText },
        { key: "domain", label: "Domain", href: `${base}/domains/erd`, icon: Sparkles },
        { key: "api", label: "API", href: `${base}/api`, icon: Server },
        { key: "ui", label: "UI", href: `${base}/ui`, icon: LayoutGrid },
        { key: "tasks", label: "Tasks", href: `${base}/tasks`, icon: ListChecks },
      ],
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[var(--overlay)] backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-3)]">
          <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
            <Dialog.Title className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[var(--brand)] to-[var(--brand-accent)] text-white">
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
                  <path d="M3 3h10v2H3V3zm0 4h10v2H3V7zm0 4h7v2H3v-2z" fill="currentColor" />
                </svg>
              </span>
              <span className="text-gradient">Logic Project</span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            {sections.map((section, sectionIndex) => (
              <div key={section.heading} className="mb-6 flex flex-col gap-1">
                <p className="px-3 text-[length:var(--text-label)] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  {section.heading}
                </p>
                {section.items.map((item) => {
                  const exact =
                    item.href === "/projects" ||
                    (sectionIndex > 0 && item.key === "overview");
                  const active = exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
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
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
