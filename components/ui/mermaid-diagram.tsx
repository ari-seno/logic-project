"use client";

import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type MermaidDiagramProps = {
  chart: string;
  className?: string;
  ariaLabel?: string;
};

export function MermaidDiagram({
  chart,
  className,
  ariaLabel,
}: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reactId = useId();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    (async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "strict",
          fontFamily: "inherit",
          er: {
            useMaxWidth: true,
            entityPadding: 12,
          },
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: "basis",
          },
        });

        const id = `mermaid-${reactId.replace(/:/g, "")}`;
        const { svg } = await mermaid.render(id, chart);
        if (cancelled) return;
        container.innerHTML = svg;
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to render diagram.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, reactId]);

  if (error) {
    return (
      <div
        role="alert"
        className={cn(
          "rounded-lg border border-[var(--danger)] bg-[var(--danger)]/10 p-4 text-sm",
          className,
        )}
      >
        <p className="font-medium">Could not render diagram.</p>
        <pre className="mt-2 whitespace-pre-wrap text-xs opacity-80">
          {error}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      className={cn(
        "flex justify-center overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4",
        className,
      )}
    />
  );
}
