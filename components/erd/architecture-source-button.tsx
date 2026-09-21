"use client";

import { ErdSourceButton } from "@/components/erd/erd-source-button";

export function ArchitectureSourceButton({
  chart,
  className,
}: {
  chart: string;
  className?: string;
}) {
  return (
    <ErdSourceButton
      chart={chart}
      className={className}
      title="Architecture diagram source"
      description="Copy this into a markdown file or any Mermaid renderer."
    />
  );
}
