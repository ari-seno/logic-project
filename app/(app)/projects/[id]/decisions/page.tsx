import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { DecisionStatusBadge } from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
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
        <div className="card-glass p-12 text-center">
          <h2 className="text-lg font-semibold">No decisions yet</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Record important project decisions and their rationale.
          </p>
          <div className="mt-4">
            <ButtonLink href={`/projects/${project.id}/decisions/new`}>
              Add Decision
            </ButtonLink>
          </div>
        </div>
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
