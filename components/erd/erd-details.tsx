import Link from "next/link";

import { RelationshipTypeBadge } from "@/components/projects/badges";
import type { ErdAttribute } from "@/lib/diagrams/mermaid";

type EntityDetail = {
  id: string;
  domainId: string;
  name: string;
  description: string | null;
  attributes: ErdAttribute[];
};

type RelationshipType = "one_to_one" | "one_to_many" | "many_to_one" | "many_to_many";

type RelationshipDetail = {
  id: string;
  name: string | null;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
};

export function ErdDetails({
  projectId,
  domains,
  entities,
  relationships,
  entityById,
}: {
  projectId: string;
  domains: { id: string; name: string; description: string | null }[];
  entities: EntityDetail[];
  relationships: RelationshipDetail[];
  entityById: Map<string, { id: string; name: string }>;
}) {
  return (
    <section className="card-glass p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Details</h2>
        <p className="text-xs text-[var(--muted-foreground)]">
          Full data dictionary for entities and relationships.
        </p>
      </header>

      {domains.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          No domains to display.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {domains.map((domain) => {
            const domainEntities = entities.filter(
              (e) => e.domainId === domain.id,
            );
            return (
              <div key={domain.id}>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  {domain.name}
                </h3>
                {domain.description ? (
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {domain.description}
                  </p>
                ) : null}

                {domainEntities.length === 0 ? (
                  <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                    No entities in this domain.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-4">
                    {domainEntities.map((entity) => (
                      <li
                        key={entity.id}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)]/60 p-4"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <Link
                            href={`/projects/${projectId}/domains/${domain.id}/entities/${entity.id}`}
                            className="text-sm font-semibold tracking-tight hover:underline"
                          >
                            {entity.name}
                          </Link>
                          {entity.description ? (
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {entity.description}
                            </p>
                          ) : null}
                        </div>

                        {entity.attributes.length === 0 ? (
                          <p className="mt-2 text-xs italic text-[var(--muted-foreground)]">
                            No attributes yet.
                          </p>
                        ) : (
                          <div className="mt-3 overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface-1)]">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-[var(--muted)] text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                                <tr>
                                  <th className="px-2.5 py-1.5 font-medium">
                                    Name
                                  </th>
                                  <th className="px-2.5 py-1.5 font-medium">
                                    Type
                                  </th>
                                  <th className="px-2.5 py-1.5 font-medium">
                                    Flags
                                  </th>
                                  <th className="px-2.5 py-1.5 font-medium">
                                    Default
                                  </th>
                                  <th className="px-2.5 py-1.5 font-medium">
                                    Description
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {entity.attributes.map((a) => (
                                  <tr
                                    key={a.id}
                                    className="border-t border-[var(--border)]"
                                  >
                                    <td className="px-2.5 py-1.5 font-mono">
                                      {a.name}
                                    </td>
                                    <td className="px-2.5 py-1.5 font-mono text-[var(--muted-foreground)]">
                                      {a.data_type}
                                      {a.is_required ? "*" : ""}
                                    </td>
                                    <td className="px-2.5 py-1.5">
                                      <span className="inline-flex flex-wrap gap-1">
                                        {a.is_primary_key ? (
                                          <span className="rounded bg-[var(--brand)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--brand)]">
                                            PK
                                          </span>
                                        ) : null}
                                        {a.is_required ? (
                                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                            NOT NULL
                                          </span>
                                        ) : null}
                                      </span>
                                    </td>
                                    <td className="px-2.5 py-1.5 font-mono text-[var(--muted-foreground)]">
                                      {a.default_value ?? (
                                        <span className="italic">—</span>
                                      )}
                                    </td>
                                    <td className="px-2.5 py-1.5 text-[var(--muted-foreground)]">
                                      {a.description ?? (
                                        <span className="italic">—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          {relationships.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Relationships
              </h3>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {relationships.map((rel) => {
                  const source = entityById.get(rel.source_entity_id);
                  const target = entityById.get(rel.target_entity_id);
                  return (
                    <li
                      key={rel.id}
                      className="flex flex-wrap items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-1)]/60 px-4 py-2"
                    >
                      <Link
                        href={`/projects/${projectId}/domains/relationships/${rel.id}`}
                        className="font-medium hover:underline"
                      >
                        {rel.name ?? "Relationship"}
                      </Link>
                      <span className="text-[var(--muted-foreground)]">
                        {source?.name ?? "(?)"}
                      </span>
                      <RelationshipTypeBadge
                        type={rel.relationship_type as RelationshipType}
                      />
                      <span className="text-[var(--muted-foreground)]">
                        → {target?.name ?? "(?)"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
