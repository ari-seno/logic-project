import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { RelationshipTypeBadge } from "@/components/projects/badges";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { getEntity } from "@/lib/entities/queries";
import { getRelationship } from "@/lib/relationships/queries";

import { RelationshipDetailActions } from "./relationship-detail-actions";

export default async function RelationshipDetailPage({
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

  const [source, target] = await Promise.all([
    getEntity(relationship.source_entity_id),
    getEntity(relationship.target_entity_id),
  ]);

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
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {relationship.name ?? "Relationship"}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {source?.name ?? "(missing)"} → {target?.name ?? "(missing)"}
            </p>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Updated {formatDate(relationship.updated_at)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <ButtonLink
              href={`/projects/${project.id}/domains/relationships/${relationship.id}/edit`}
              variant="secondary"
              size="sm"
            >
              Edit
            </ButtonLink>
            <RelationshipDetailActions
              projectId={project.id}
              relId={relationship.id}
            />
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
            Source
          </p>
          <p className="mt-1 font-semibold">{source?.name ?? "(missing)"}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
            Type
          </p>
          <p className="mt-2">
            <RelationshipTypeBadge type={relationship.relationship_type} />
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
            Target
          </p>
          <p className="mt-1 font-semibold">{target?.name ?? "(missing)"}</p>
        </div>
      </section>

      {relationship.description ? (
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Description
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm">
            {relationship.description}
          </p>
        </section>
      ) : null}
    </div>
  );
}
