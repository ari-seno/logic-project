import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import {
  PriorityBadge,
  RequirementStatusBadge,
  TypeBadge,
} from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { formatDateTime } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { getRequirement } from "@/lib/requirements/queries";
import { deleteRequirement } from "@/lib/requirements/actions";

export default async function RequirementDetailPage({
  params,
}: {
  params: Promise<{ id: string; reqId: string }>;
}) {
  const { id, reqId } = await params;

  const [project, requirement] = await Promise.all([
    getProject(id),
    getRequirement(reqId),
  ]);

  if (!project || !requirement || requirement.project_id !== project.id) {
    notFound();
  }

  async function handleDelete() {
    "use server";
    const formData = new FormData();
    formData.set("id", reqId);
    formData.set("projectId", id);
    return deleteRequirement(formData);
  }

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="requirements" />

      <div>
        <Link
          href={`/projects/${project.id}/requirements`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to requirements
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {requirement.title}
            </h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <TypeBadge type={requirement.type} />
              <RequirementStatusBadge status={requirement.status} />
              <PriorityBadge priority={requirement.priority} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
              <span>Created {formatDateTime(requirement.created_at)}</span>
              <span>Updated {formatDateTime(requirement.updated_at)}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <ButtonLink
              href={`/projects/${project.id}/requirements/${requirement.id}/edit`}
              size="sm"
              variant="secondary"
            >
              Edit
            </ButtonLink>
            <DeleteEntityButton
              action={handleDelete}
              entityLabel={`requirement "${requirement.title}"`}
            />
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Description
        </h2>
        {requirement.description ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
            {requirement.description}
          </p>
        ) : (
          <p className="mt-2 italic text-sm text-[var(--muted-foreground)]">
            No description provided.
          </p>
        )}
      </section>
    </div>
  );
}
