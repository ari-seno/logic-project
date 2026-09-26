"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

const OPTIONS = [
  { format: "md", label: "Markdown", hint: "Full project spec" },
  { format: "json", label: "Project JSON", hint: "Structured bundle" },
  { format: "openapi", label: "OpenAPI 3.1", hint: "API contract" },
  { format: "sql", label: "SQL schema", hint: "PostgreSQL DDL" },
  { format: "mermaid", label: "Mermaid diagram", hint: "Architecture graph" },
] as const;

export function ExportMenu({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Export
      </Button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-2 shadow-xl">
          <ul className="flex flex-col">
            {OPTIONS.map((opt) => (
              <li key={opt.format}>
                <a
                  href={`/api/projects/${projectId}/export?format=${opt.format}`}
                  onClick={() => setOpen(false)}
                  className="flex w-full flex-col items-start rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--muted)]"
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {opt.hint}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
