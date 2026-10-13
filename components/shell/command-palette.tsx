"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Boxes,
  FileText,
  Gauge,
  History,
  LayoutGrid,
  ListChecks,
  ScrollText,
  Search,
  Server,
  Sparkles,
} from "lucide-react";

import { projectIdFromPathname } from "@/components/shell/app-sidebar";

const ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: Gauge },
  { label: "Projects", href: "/projects", icon: LayoutGrid },
];

const SECTIONS = [
  { label: "Requirements", suffix: "requirements", icon: FileText },
  { label: "Architecture", suffix: "architecture", icon: Boxes },
  { label: "Decisions", suffix: "decisions", icon: ScrollText },
  { label: "Domain", suffix: "domains/erd", icon: Sparkles },
  { label: "API", suffix: "api", icon: Server },
  { label: "UI", suffix: "ui", icon: LayoutGrid },
  { label: "Tasks", suffix: "tasks", icon: ListChecks },
  { label: "AI history", suffix: "ai-history", icon: History },
];

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const projectId = projectIdFromPathname(pathname);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:border-[var(--border-strong)] sm:flex"
        aria-label="Open command palette"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search</span>
        <kbd className="rounded border border-[var(--border)] px-1 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Command palette"
        className="fixed left-1/2 top-[20%] z-50 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-3)]"
      >
        <Command.Input
          placeholder="Jump to a page…"
          className="w-full border-b border-[var(--border)] bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[var(--muted-foreground)]"
        />
        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-xs text-[var(--muted-foreground)]">
            No matching pages.
          </Command.Empty>
          <Command.Group
            heading={projectId ? "Project" : "Workspace"}
            className="px-1 py-1 text-[var(--muted-foreground)] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[length:var(--text-label)] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase"
          >
            {projectId
              ? SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <Command.Item
                      key={section.suffix}
                      onSelect={() => go(`/projects/${projectId}/${section.suffix}`)}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-[var(--foreground)] data-[selected=true]:bg-[var(--brand-soft)] data-[selected=true]:text-[var(--brand)]"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {section.label}
                    </Command.Item>
                  );
                })
              : ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.href}
                      onSelect={() => go(item.href)}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-[var(--foreground)] data-[selected=true]:bg-[var(--brand-soft)] data-[selected=true]:text-[var(--brand)]"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Command.Item>
                  );
                })}
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </>
  );
}
