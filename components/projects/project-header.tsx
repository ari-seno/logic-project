import Link from "next/link";
import type { ReactNode } from "react";

import { formatDateTime } from "@/lib/utils";

export function ProjectHeader({
  projectId,
  name,
  createdAt,
  updatedAt,
  actions,
}: {
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  actions?: ReactNode;
}) {
  return (
    <div>
      <Link
        href={`/projects/${projectId}`}
        className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        ← Back to overview
      </Link>
      <div className="mt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
            <span>Created {formatDateTime(createdAt)}</span>
            <span>Updated {formatDateTime(updatedAt)}</span>
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}
