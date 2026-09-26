"use client";

import { useState } from "react";

import { CopyButton } from "@/components/ui/copy-button";
import { JsonTokens } from "@/lib/export/json-tokens";

export interface JsonBlockProps {
  json: string;
  filename: string;
  summary: {
    chars: number;
    lines: number;
    endpoints: number;
    groups: number;
    updatedAt: string | null;
  };
  truncated: boolean;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function JsonBlock({ json, filename, summary, truncated }: JsonBlockProps) {
  const [wrap, setWrap] = useState(false);
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
        <span>
          {formatNumber(summary.chars)} chars · {formatNumber(summary.lines)} lines ·{" "}
          {summary.endpoints} endpoint{summary.endpoints === 1 ? "" : "s"} ·{" "}
          {summary.groups} group{summary.groups === 1 ? "" : "s"} · updated{" "}
          {formatDate(summary.updatedAt)}
        </span>
      </div>
      <div className="mb-2 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setWrap((w) => !w)}
          className="rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 px-2.5 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-1)]"
        >
          {wrap ? "No wrap" : "Wrap"}
        </button>
        <a
          href={`data:application/json;charset=utf-8,${encodeURIComponent(json)}`}
          download={filename}
          className="rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 px-2.5 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-1)]"
        >
          Download .json
        </a>
        <CopyButton value={json} />
      </div>
      {truncated && (
        <div
          role="alert"
          className="mb-2 rounded-md border border-[var(--warning)] bg-[var(--warning)]/10 px-3 py-2 text-xs text-[var(--foreground)]"
        >
          Output truncated. Use <strong>Download .json</strong> to get the full contract.
        </div>
      )}
      <pre
        className={
          "rounded-md border border-[var(--border)] bg-[var(--surface-1)]/70 p-4 font-mono text-[11px] leading-relaxed text-[var(--foreground)] " +
          (wrap
            ? "whitespace-pre-wrap break-words"
            : "max-h-[480px] overflow-auto whitespace-pre")
        }
      >
        <code>
          <JsonTokens value={json} />
        </code>
      </pre>
    </div>
  );
}
