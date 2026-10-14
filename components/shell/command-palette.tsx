"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Activity,
  Boxes,
  FileText,
  Gauge,
  History,
  LayoutGrid,
  Layers,
  ListChecks,
  Loader2,
  ScrollText,
  Search,
  Server,
  Sparkles,
} from "lucide-react";

import { projectIdFromPathname } from "@/components/shell/app-sidebar";
import { searchProjectAction } from "@/lib/search/actions";
import {
  SEARCH_MIN_LENGTH,
  type SearchResult,
  type SearchResultKind,
} from "@/lib/search/shared";

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
  { label: "Activity", suffix: "activity", icon: Activity },
  { label: "Versions", suffix: "versions", icon: Layers },
];

const RESULT_ICONS: Record<SearchResultKind, typeof FileText> = {
  requirement: FileText,
  decision: ScrollText,
  domain: Sparkles,
  entity: Boxes,
  component: Boxes,
  technology: Server,
  endpoint: Server,
  screen: LayoutGrid,
  task: ListChecks,
};

const RESULT_LABELS: Record<SearchResultKind, string> = {
  requirement: "Requirements",
  decision: "Decisions",
  domain: "Domains",
  entity: "Entities",
  component: "Components",
  technology: "Technologies",
  endpoint: "API endpoints",
  screen: "Screens",
  task: "Tasks",
};

const GROUP_CLASS =
  "px-1 py-1 text-[var(--muted-foreground)] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[length:var(--text-label)] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase";

const ITEM_CLASS =
  "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-[var(--foreground)] data-[selected=true]:bg-[var(--brand-soft)] data-[selected=true]:text-[var(--brand)]";

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const projectId = projectIdFromPathname(pathname);

  const trimmed = query.trim();
  const isSearching = projectId !== null && trimmed.length >= SEARCH_MIN_LENGTH;

  const matchingSections = useMemo(() => {
    if (!projectId) return [];
    if (trimmed.length === 0) return SECTIONS;
    const needle = trimmed.toLowerCase();
    return SECTIONS.filter((section) =>
      section.label.toLowerCase().includes(needle),
    );
  }, [projectId, trimmed]);

  const matchingItems = useMemo(() => {
    if (projectId) return [];
    if (trimmed.length === 0) return ITEMS;
    const needle = trimmed.toLowerCase();
    return ITEMS.filter((item) => item.label.toLowerCase().includes(needle));
  }, [projectId, trimmed]);

  const grouped = useMemo(() => {
    const map = new Map<SearchResultKind, SearchResult[]>();
    for (const result of results) {
      const list = map.get(result.kind) ?? [];
      list.push(result);
      map.set(result.kind, list);
    }
    return [...map.entries()];
  }, [results]);

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

  useEffect(() => {
    if (!open || !projectId) return;
    const needle = query.trim();
    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled) return;
      if (needle.length < SEARCH_MIN_LENGTH) {
        setResults([]);
        setSearching(false);
        setError(null);
        return;
      }
      setSearching(true);
      setError(null);
      searchProjectAction(projectId, needle).then((outcome) => {
        if (cancelled) return;
        setSearching(false);
        if (outcome.ok) {
          setResults(outcome.results);
        } else {
          setResults([]);
          setError(outcome.error);
        }
      });
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, projectId, query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    setError(null);
    router.push(href);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults([]);
      setError(null);
      setSearching(false);
    }
  }

  const showResults = isSearching;
  const showPages = matchingSections.length > 0 || matchingItems.length > 0;
  const nothingFound =
    showResults && !searching && !error && results.length === 0;

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
        onOpenChange={handleOpenChange}
        label="Command palette"
        shouldFilter={false}
        className="fixed left-1/2 top-[20%] z-50 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-3)]"
      >
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder={
            projectId ? "Search or jump to a section…" : "Jump to a page…"
          }
          className="w-full border-b border-[var(--border)] bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[var(--muted-foreground)]"
        />
        <Command.List className="max-h-72 overflow-y-auto p-2">
          {searching ? (
            <div className="flex items-center gap-2 px-3 py-6 text-xs text-[var(--muted-foreground)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching…
            </div>
          ) : null}

          {error ? (
            <p className="px-3 py-4 text-xs text-[var(--danger-fg)]" role="alert">
              {error}
            </p>
          ) : null}

          {nothingFound ? (
            <p className="px-3 py-6 text-center text-xs text-[var(--muted-foreground)]">
              No matches for “{trimmed}”.
            </p>
          ) : null}

          {!showResults && showPages ? (
            <Command.Group
              heading={projectId ? "Project" : "Workspace"}
              className={GROUP_CLASS}
            >
              {projectId
                ? matchingSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <Command.Item
                        key={section.suffix}
                        value={`section-${section.suffix}`}
                        onSelect={() =>
                          go(`/projects/${projectId}/${section.suffix}`)
                        }
                        className={ITEM_CLASS}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {section.label}
                      </Command.Item>
                    );
                  })
                : matchingItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Command.Item
                        key={item.href}
                        value={`page-${item.href}`}
                        onSelect={() => go(item.href)}
                        className={ITEM_CLASS}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Command.Item>
                    );
                  })}
            </Command.Group>
          ) : null}

          {showResults && showPages && !searching ? (
            <Command.Group heading="Pages" className={GROUP_CLASS}>
              {projectId
                ? matchingSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <Command.Item
                        key={section.suffix}
                        value={`section-${section.suffix}`}
                        onSelect={() =>
                          go(`/projects/${projectId}/${section.suffix}`)
                        }
                        className={ITEM_CLASS}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{section.label}</span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          Page
                        </span>
                      </Command.Item>
                    );
                  })
                : matchingItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Command.Item
                        key={item.href}
                        value={`page-${item.href}`}
                        onSelect={() => go(item.href)}
                        className={ITEM_CLASS}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          Page
                        </span>
                      </Command.Item>
                    );
                  })}
            </Command.Group>
          ) : null}

          {showResults && !searching
            ? grouped.map(([kind, entries]) => {
                const Icon = RESULT_ICONS[kind];
                return (
                  <Command.Group
                    key={kind}
                    heading={RESULT_LABELS[kind]}
                    className={GROUP_CLASS}
                  >
                    {entries.map((result) => (
                      <Command.Item
                        key={`${result.kind}-${result.id}`}
                        value={`${result.kind}-${result.id}`}
                        onSelect={() => go(result.href)}
                        className={ITEM_CLASS}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate">{result.title}</span>
                        {result.subtitle ? (
                          <span className="shrink-0 text-xs capitalize text-[var(--muted-foreground)]">
                            {result.subtitle}
                          </span>
                        ) : null}
                      </Command.Item>
                    ))}
                  </Command.Group>
                );
              })
            : null}

          {!showResults && !showPages ? (
            <p className="px-3 py-6 text-center text-xs text-[var(--muted-foreground)]">
              No matching pages.
            </p>
          ) : null}
        </Command.List>
      </Command.Dialog>
    </>
  );
}
