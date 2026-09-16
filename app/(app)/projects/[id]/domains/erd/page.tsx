import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectTabs } from "@/components/projects/project-tabs";
import { ButtonLink } from "@/components/ui/button";
import { MermaidDiagram } from "@/components/ui/mermaid-diagram";
import { RelationshipTypeBadge } from "@/components/projects/badges";
import { getProject } from "@/lib/projects/queries";
import { loadProjectErd } from "@/lib/domains/erd";
import {
  buildErdMermaid,
  type ErdAttribute,
  type ErdEntity,
  type ErdRelationship,
} from "@/lib/diagrams/mermaid";

export default async function ProjectErdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  const erd = await loadProjectErd(project.id);
  const allEntities = Object.values(erd.entitiesByDomain).flat();
  const entityCount = allEntities.length;
  const entityById = new Map(allEntities.map((e) => [e.id, e]));

  const diagramEntities: ErdEntity[] = allEntities.map((e) => ({
    id: e.id,
    name: e.name,
    description: e.description,
  }));
  const diagramAttributes: ErdAttribute[] = allEntities.flatMap(
    (entity) => erd.attributesByEntity[entity.id] ?? [],
  );
  const diagramRelationships: ErdRelationship[] = erd.relationships.map(
    (rel) => ({
      id: rel.id,
      name: rel.name,
      source_entity_id: rel.source_entity_id,
      target_entity_id: rel.target_entity_id,
      relationship_type: rel.relationship_type,
    }),
  );
  const mermaidChart = buildErdMermaid(
    diagramEntities,
    diagramAttributes,
    diagramRelationships,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/projects/${project.id}/domains`}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Back to domains
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">ERD</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {project.name}
            </p>
          </div>
          {entityCount >= 2 ? (
            <ButtonLink
              href={`/projects/${project.id}/domains/relationships/new`}
              size="sm"
            >
              New relationship
            </ButtonLink>
          ) : null}
        </div>
        <div className="mt-4">
          <ProjectTabs projectId={project.id} active="domain" />
        </div>
      </div>

      {erd.domains.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <h2 className="text-lg font-semibold">No domains yet</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Add a domain and entity first; the ERD is generated from them.
          </p>
          <div className="mt-4">
            <ButtonLink href={`/projects/${project.id}/domains/new`}>
              Add Domain
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {mermaidChart ? (
            <section className="card-glass p-6">
              <header className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold tracking-tight">
                  Diagram
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Auto-generated from entities and relationships.
                </p>
              </header>
              <MermaidDiagram
                chart={mermaidChart}
                ariaLabel="Entity-relationship diagram"
              />
            </section>
          ) : null}

          {erd.domains.map((domain) => {
            const entities = erd.entitiesByDomain[domain.id] ?? [];
            return (
              <section key={domain.id} className="card-glass p-6">
                <header className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight">
                      {domain.name}
                    </h2>
                    {domain.description ? (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {domain.description}
                      </p>
                    ) : null}
                  </div>
                </header>
                {entities.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No entities in this domain.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {entities.map((entity) => {
                      const attrs =
                        erd.attributesByEntity[entity.id] ?? [];
                      return (
                        <Link
                          key={entity.id}
                          href={`/projects/${project.id}/domains/${domain.id}/entities/${entity.id}`}
                          className="block rounded-xl border border-[var(--border)] bg-white/60 p-4 transition-all hover:border-[var(--brand)] hover:shadow-md"
                        >
                          <p className="text-sm font-semibold tracking-tight">
                            {entity.name}
                          </p>
                          {attrs.length > 0 ? (
                            <ul className="mt-3 space-y-1 font-mono text-[11px] text-[var(--muted-foreground)]">
                              {attrs.map((a) => (
                                <li
                                  key={a.id}
                                  className="flex items-center gap-2"
                                >
                                  <span className="w-3 shrink-0 text-center text-[10px] text-[var(--brand)]">
                                    {a.is_primary_key ? "PK" : ""}
                                  </span>
                                  <span className="flex-1 truncate">
                                    {a.name}
                                    <span className="text-[var(--muted-foreground)]/60">
                                      {" "}
                                      : {a.data_type}
                                      {a.is_required ? "*" : ""}
                                    </span>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-xs italic text-[var(--muted-foreground)]">
                              no attributes
                            </p>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}

          {erd.relationships.length > 0 ? (
            <section className="card-glass p-6">
              <h2 className="mb-3 text-base font-semibold tracking-tight">
                Relationships
              </h2>
              <ul className="flex flex-col gap-2 text-sm">
                {erd.relationships.map((rel) => {
                  const source = entityById.get(rel.source_entity_id);
                  const target = entityById.get(rel.target_entity_id);
                  return (
                    <li
                      key={rel.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] bg-white/60 px-4 py-2.5"
                    >
                      <Link
                        href={`/projects/${project.id}/domains/relationships/${rel.id}`}
                        className="font-medium hover:underline"
                      >
                        {rel.name ?? "Relationship"}
                      </Link>
                      <span className="text-[var(--muted-foreground)]">
                        {source?.name ?? "(?)"}
                      </span>
                      <RelationshipTypeBadge type={rel.relationship_type} />
                      <span className="text-[var(--muted-foreground)]">
                        → {target?.name ?? "(?)"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
