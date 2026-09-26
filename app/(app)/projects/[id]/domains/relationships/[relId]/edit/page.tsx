import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { RelationshipForm } from "@/components/relationships/relationship-form";
import { getProject } from "@/lib/projects/queries";
import { listEntitiesByProject } from "@/lib/entities/queries";
import { getRelationship } from "@/lib/relationships/queries";

export default async function EditRelationshipPage({
  params,
}: {
  params: Promise<{ id: string; relId: string }>;
}) {
  const { id, relId } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const relationship = await getRelationship(relId);
  if (!relationship || relationship.project_id !== project.id) {
    notFound();
  }

  const entities = await listEntitiesByProject(project.id);

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="domain" />

      <div>
        <Link
          href={`/projects/${project.id}/domains/relationships/${relationship.id}`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to relationship
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit relationship
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {project.name}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-6">
        <RelationshipForm
          projectId={project.id}
          entities={entities}
          relationship={relationship}
        />
      </div>
    </div>
  );
}
