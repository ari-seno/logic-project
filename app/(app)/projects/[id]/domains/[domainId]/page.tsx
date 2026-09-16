import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { getDomain } from "@/lib/domains/queries";
import { listEntities } from "@/lib/entities/queries";

import { DomainDetailActions } from "./domain-detail-actions";

export default async function DomainDetailPage({
  params,
}: {
  params: Promise<{ id: string; domainId: string }>;
}) {
  const { id, domainId } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const domain = await getDomain(domainId);
  if (!domain || domain.project_id !== project.id) {
    notFound();
  }

  const entities = await listEntities({ domainId: domain.id });

  return (
    <div className="flex flex-col gap-6">
      <ProjectTabs projectId={project.id} active="domain" />

      <div>
        <Link
          href={`/projects/${project.id}/domains`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to domains
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {domain.name}
            </h1>
            {domain.description ? (
              <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">
                {domain.description}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Updated {formatDate(domain.updated_at)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <ButtonLink
              href={`/projects/${project.id}/domains/${domain.id}/edit`}
              variant="secondary"
              size="sm"
            >
              Edit
            </ButtonLink>
            <DomainDetailActions
              projectId={project.id}
              domainId={domain.id}
            />
          </div>
        </div>
      </div>

      <section>
        <header className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Entities</h2>
          <ButtonLink
            href={`/projects/${project.id}/domains/${domain.id}/entities/new`}
            size="sm"
          >
            Add entity
          </ButtonLink>
        </header>

        {entities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-white p-8 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              No entities in this domain yet.
            </p>
            <div className="mt-3">
              <ButtonLink
                href={`/projects/${project.id}/domains/${domain.id}/entities/new`}
                size="sm"
              >
                Add entity
              </ButtonLink>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {entities.map((entity) => (
              <li
                key={entity.id}
                className="rounded-lg border border-[var(--border)] bg-white p-4"
              >
                <Link
                  href={`/projects/${project.id}/domains/${domain.id}/entities/${entity.id}`}
                  className="flex flex-col gap-1 hover:underline"
                >
                  <span className="text-base font-semibold">{entity.name}</span>
                  {entity.description ? (
                    <p className="line-clamp-2 text-sm text-[var(--muted-foreground)]">
                      {entity.description}
                    </p>
                  ) : null}
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Updated {formatDate(entity.updated_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
