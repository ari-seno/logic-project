import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ArchitectureDecisionStatusBadge } from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { listArchitectureDecisionsByProject } from "@/lib/architecture/decisions/queries";

export default async function ArchitectureDecisionsListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const decisions = await listArchitectureDecisionsByProject({
    projectId: project.id,
  });

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="architecture" />

      <div>
        <Link
          href={`/projects/${project.id}/architecture`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to architecture
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Architecture decisions
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {project.name}
            </p>
          </div>
          <ButtonLink
            href={`/projects/${project.id}/architecture/decisions/new`}
          >
            New decision
          </ButtonLink>
        </div>
      </div>

      {decisions.length === 0 ? (
        <div className="card-glass text-center">
          <h2 className="text-lg font-semibold">No decisions yet</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Record the why behind each architectural choice.
          </p>
          <div className="mt-4">
            <ButtonLink
              href={`/projects/${project.id}/architecture/decisions/new`}
            >
              Add Decision
            </ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {decisions.map((d) => (
            <li
              key={d.id}
              className="flex items-start justify-between gap-3 rounded-md border border-[var(--border)] bg-white/70 px-4 py-3"
            >
              <Link
                href={`/projects/${project.id}/architecture/decisions/${d.id}`}
                className="flex flex-col gap-1 hover:underline"
              >
                <span className="font-medium">{d.title}</span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  Updated {formatDate(d.updated_at)}
                </span>
              </Link>
              <ArchitectureDecisionStatusBadge status={d.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
