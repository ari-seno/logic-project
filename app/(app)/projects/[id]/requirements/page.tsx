import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import {
  PriorityBadge,
  RequirementStatusBadge,
  TypeBadge,
} from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { listRequirements } from "@/lib/requirements/queries";

export default async function RequirementsListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const requirements = await listRequirements({ projectId: project.id });

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="requirements" />

      <div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to overview
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Requirements
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {project.name}
            </p>
          </div>
          <ButtonLink href={`/projects/${project.id}/requirements/new`}>
            New requirement
          </ButtonLink>
        </div>
      </div>

      {requirements.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-12 text-center">
          <h2 className="text-lg font-semibold">No requirements yet</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Define what this project needs to accomplish.
          </p>
          <div className="mt-4">
            <ButtonLink href={`/projects/${project.id}/requirements/new`}>
              Add Requirement
            </ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {requirements.map((req) => (
            <li
              key={req.id}
              className="rounded-lg border border-[var(--border)] bg-white p-5"
            >
              <Link
                href={`/projects/${project.id}/requirements/${req.id}`}
                className="flex flex-col gap-3 hover:underline"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-base font-semibold">{req.title}</span>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    <TypeBadge type={req.type} />
                    <RequirementStatusBadge status={req.status} />
                    <PriorityBadge priority={req.priority} />
                  </div>
                </div>
                {req.description ? (
                  <p className="line-clamp-3 text-sm text-[var(--muted-foreground)]">
                    {req.description}
                  </p>
                ) : (
                  <p className="italic text-sm text-[var(--muted-foreground)]">
                    No description
                  </p>
                )}
                <div className="flex flex-wrap gap-x-4 text-xs text-[var(--muted-foreground)]">
                  <span>Created {formatDate(req.created_at)}</span>
                  <span>Updated {formatDate(req.updated_at)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
