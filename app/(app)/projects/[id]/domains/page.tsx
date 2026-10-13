import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { Breadcrumb } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getProject } from "@/lib/projects/queries";
import { listDomains } from "@/lib/domains/queries";
import { listEntitiesByProject } from "@/lib/entities/queries";

export default async function DomainsListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const [domains, allEntities] = await Promise.all([
    listDomains({ projectId: project.id }),
    listEntitiesByProject(project.id),
  ]);

  const entitiesByDomain = new Map<string, number>();
  for (const e of allEntities) {
    entitiesByDomain.set(e.domain_id, (entitiesByDomain.get(e.domain_id) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Breadcrumb
          items={[
            { label: "Projects", href: "/projects" },
            { label: project.name, href: `/projects/${project.id}` },
            { label: "Domains" },
          ]}
        />
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Domains</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {project.name}
            </p>
          </div>
          <ButtonLink
            href={`/projects/${project.id}/domains/new`}
            variant="secondary"
          >
            New domain
          </ButtonLink>
        </div>
        <div className="mt-4">
          <ProjectTabs projectId={project.id} active="domain" />
        </div>
      </div>

      {domains.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <h2 className="text-lg font-semibold">No domains yet</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Organize the project into meaningful business domains.
          </p>
          <div className="mt-4">
            <ButtonLink href={`/projects/${project.id}/domains/new`}>
              Add Domain
            </ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {domains.map((domain) => {
            const entityCount = entitiesByDomain.get(domain.id) ?? 0;
            return (
              <li
                key={domain.id}
                className="card-glass p-5 transition-shadow hover:shadow-md"
              >
                <Link
                  href={`/projects/${project.id}/domains/${domain.id}`}
                  className="flex flex-col gap-2"
                >
                  <span className="text-base font-semibold tracking-tight">
                    {domain.name}
                  </span>
                  {domain.description ? (
                    <p className="line-clamp-3 text-sm text-[var(--muted-foreground)] leading-relaxed">
                      {domain.description}
                    </p>
                  ) : (
                    <p className="italic text-sm text-[var(--muted-foreground)]">
                      No description
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-[var(--muted-foreground)]">
                    <span>
                      {entityCount} {entityCount === 1 ? "entity" : "entities"}
                    </span>
                    <span>Updated {formatDate(domain.updated_at)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
