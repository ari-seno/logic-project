import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ButtonLink } from "@/components/ui/button";
import { CreateTaskFromArtifactButton } from "@/components/ui/tasks/create-task-from-artifact-button";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { getDomain } from "@/lib/domains/queries";
import { getEntity } from "@/lib/entities/queries";
import { listAttributes } from "@/lib/attributes/queries";

import { EntityDetailActions } from "./entity-detail-actions";
import { AttributeSection } from "./attribute-section";

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ id: string; domainId: string; entityId: string }>;
}) {
  const { id, domainId, entityId } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const domain = await getDomain(domainId);
  if (!domain || domain.project_id !== project.id) {
    notFound();
  }

  const entity = await getEntity(entityId);
  if (!entity || entity.domain_id !== domain.id) {
    notFound();
  }

  const attributes = await listAttributes({ entityId: entity.id });

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="domain" />

      <div>
        <Link
          href={`/projects/${project.id}/domains/${domain.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to {domain.name}
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              {domain.name}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {entity.name}
            </h1>
            {entity.description ? (
              <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">
                {entity.description}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Updated {formatDate(entity.updated_at)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <CreateTaskFromArtifactButton
              kind="entity"
              refId={entity.id}
              projectId={project.id}
            >
              Create task
            </CreateTaskFromArtifactButton>
            <ButtonLink
              href={`/projects/${project.id}/domains/${domain.id}/entities/${entity.id}/edit`}
              variant="secondary"
              size="sm"
            >
              Edit
            </ButtonLink>
            <EntityDetailActions
              projectId={project.id}
              domainId={domain.id}
              entityId={entity.id}
            />
          </div>
        </div>
      </div>

      <section>
        <header className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Attributes</h2>
          <span className="text-xs text-[var(--muted-foreground)]">
            {attributes.length}{" "}
            {attributes.length === 1 ? "attribute" : "attributes"}
          </span>
        </header>

        <AttributeSection
          projectId={project.id}
          domainId={domain.id}
          entityId={entity.id}
          attributes={attributes}
        />
      </section>
    </div>
  );
}
