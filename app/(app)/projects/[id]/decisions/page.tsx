import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { DecisionStatusBadge } from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, EmptyStateIcon } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { listDecisions } from "@/lib/decisions/queries";

export default async function DecisionsListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const decisions = await listDecisions({ projectId: project.id });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to overview
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Decisions</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {project.name}
            </p>
          </div>
          <ButtonLink href={`/projects/${project.id}/decisions/new`}>
            New decision
          </ButtonLink>
        </div>
        <div className="mt-4">
          <ProjectTabs projectId={project.id} active="decisions" />
        </div>
      </div>

      {decisions.length === 0 ? (
        <EmptyState
          icon={
            <EmptyStateIcon>
              <path d="M12 2v6" />
              <path d="M12 16v6" />
              <path d="m4.93 4.93 4.24 4.24" />
              <path d="m14.83 14.83 4.24 4.24" />
              <path d="M2 12h6" />
              <path d="M16 12h6" />
              <path d="m4.93 19.07 4.24-4.24" />
              <path d="m14.83 9.17 4.24-4.24" />
            </EmptyStateIcon>
          }
          title="No decisions yet"
          description="Capture important project decisions and the rationale behind them. Future you will thank present you."
          action={
            <ButtonLink href={`/projects/${project.id}/decisions/new`}>
              Add decision
            </ButtonLink>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {decisions.map((dec) => (
            <li
              key={dec.id}
              className="card-glass p-5 transition-shadow hover:shadow-md"
            >
              <Link
                href={`/projects/${project.id}/decisions/${dec.id}`}
                className="flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-base font-semibold tracking-tight">
                    {dec.title}
                  </span>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    <DecisionStatusBadge status={dec.status} />
                  </div>
                </div>
                {dec.decision ? (
                  <p className="line-clamp-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
                    {dec.decision}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-x-4 text-xs text-[var(--muted-foreground)]">
                  <span>Created {formatDate(dec.created_at)}</span>
                  <span>Updated {formatDate(dec.updated_at)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
