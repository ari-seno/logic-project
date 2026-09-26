import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { RelationshipForm } from "@/components/relationships/relationship-form";
import { getProject } from "@/lib/projects/queries";
import { listEntitiesByProject } from "@/lib/entities/queries";

export default async function NewRelationshipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const entities = await listEntitiesByProject(project.id);

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="domain" />

      <div>
        <Link
          href={`/projects/${project.id}/domains/erd`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to ERD
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          New relationship
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {project.name}
        </p>
      </div>

      {entities.length < 2 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-1)] p-8 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            You need at least two entities in this project to create a
            relationship.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-6">
          <RelationshipForm
            projectId={project.id}
            entities={entities}
          />
        </div>
      )}
    </div>
  );
}
