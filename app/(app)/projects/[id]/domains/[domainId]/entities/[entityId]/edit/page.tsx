import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { EntityForm } from "@/components/entities/entity-form";
import { getProject } from "@/lib/projects/queries";
import { getDomain } from "@/lib/domains/queries";
import { getEntity } from "@/lib/entities/queries";

export default async function EditEntityPage({
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

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="domain" />

      <div>
        <Link
          href={`/projects/${project.id}/domains/${domain.id}/entities/${entity.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to entity
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit entity
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {domain.name} · {entity.name}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-6">
        <EntityForm domainId={domain.id} entity={entity} />
      </div>
    </div>
  );
}
