import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { DecisionStatusBadge } from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { DeleteEntityButton } from "@/components/ui/delete-entity-button";
import { CreateTaskFromArtifactButton } from "@/components/ui/tasks/create-task-from-artifact-button";
import { formatDateTime } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { getDecision } from "@/lib/decisions/queries";
import { deleteDecision } from "@/lib/decisions/actions";

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string; decId: string }>;
}) {
  const { id, decId } = await params;

  const [project, decision] = await Promise.all([
    getProject(id),
    getDecision(decId),
  ]);

  if (!project || !decision || decision.project_id !== project.id) {
    notFound();
  }

  async function handleDelete() {
    "use server";
    const formData = new FormData();
    formData.set("id", decId);
    formData.set("projectId", id);
    return deleteDecision(formData);
  }

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="decisions" />

      <div>
        <Link
          href={`/projects/${project.id}/decisions`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to decisions
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {decision.title}
            </h1>
            <div className="mt-2">
              <DecisionStatusBadge status={decision.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
              <span>Created {formatDateTime(decision.created_at)}</span>
              <span>Updated {formatDateTime(decision.updated_at)}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <CreateTaskFromArtifactButton
              kind="decision"
              refId={decision.id}
              projectId={project.id}
            >
              Create task
            </CreateTaskFromArtifactButton>
            <ButtonLink
              href={`/projects/${project.id}/decisions/${decision.id}/edit`}
              size="sm"
              variant="secondary"
            >
              Edit
            </ButtonLink>
            <DeleteEntityButton
              action={handleDelete}
              entityLabel={decision.title}
              description="This will permanently delete this decision and unlink any tasks or trace links that reference it."
            />
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Context
        </h2>
        {decision.context ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
            {decision.context}
          </p>
        ) : (
          <p className="mt-2 italic text-sm text-[var(--muted-foreground)]">
            No context provided.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Decision
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
          {decision.decision}
        </p>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Rationale
        </h2>
        {decision.rationale ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
            {decision.rationale}
          </p>
        ) : (
          <p className="mt-2 italic text-sm text-[var(--muted-foreground)]">
            No rationale recorded.
          </p>
        )}
      </section>
    </div>
  );
}
