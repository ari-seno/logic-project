const RELATIONSHIP_LABELS: Record<string, string> = {
  "one → to → one": "1 — 1",
  "one → to → many": "1 — N",
  "many → to → one": "N — 1",
  "many → to → many": "N — N",
};

const RELATIONSHIP_ARROWS: Record<string, string> = {
  "one → to → one": "||--||",
  "one → to → many": "||--o{",
  "many → to → one": "}o--||",
  "many → to → many": "}o--o{",
};

export type ErdEntity = {
  id: string;
  name: string;
  description: string | null;
};

export type ErdAttribute = {
  id: string;
  entity_id: string;
  name: string;
  data_type: string;
  is_primary_key: boolean | null;
  is_required: boolean | null;
  default_value?: string | null;
  description?: string | null;
};

export type ErdRelationship = {
  id: string;
  name: string | null;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
};

function escapeLabel(label: string): string {
  return label.replace(/"/g, '\\"');
}

export function buildErdMermaid(
  entities: ErdEntity[],
  attributes: ErdAttribute[],
  relationships: ErdRelationship[],
): string {
  if (entities.length === 0) return "";

  const lines: string[] = ["erDiagram"];
  const attrsByEntity = new Map<string, ErdAttribute[]>();
  for (const attr of attributes) {
    const list = attrsByEntity.get(attr.entity_id) ?? [];
    list.push(attr);
    attrsByEntity.set(attr.entity_id, list);
  }

  for (const entity of entities) {
    const attrs = attrsByEntity.get(entity.id) ?? [];
    if (attrs.length === 0) {
      lines.push(`    ${entity.name} {`);
      lines.push("    }");
    } else {
      lines.push(`    ${entity.name} {`);
      for (const attr of attrs) {
        const pk = attr.is_primary_key ? " PK" : "";
        const comment = attr.description
          ? ` "${escapeLabel(attr.description)}"`
          : "";
        lines.push(
          `        ${attr.data_type} ${attr.name}${pk}${comment}`,
        );
      }
      lines.push("    }");
    }
  }

  for (const rel of relationships) {
    const source = entities.find((e) => e.id === rel.source_entity_id);
    const target = entities.find((e) => e.id === rel.target_entity_id);
    if (!source || !target) continue;
    const arrow =
      RELATIONSHIP_ARROWS[rel.relationship_type] ?? "||--o{";
    const label = rel.name
      ? ` : "${escapeLabel(rel.name)}"`
      : ` : "${RELATIONSHIP_LABELS[rel.relationship_type] ?? rel.relationship_type}"`;
    lines.push(`    ${source.name} ${arrow} ${target.name}${label}`);
  }

  return lines.join("\n");
}

export type ArchitectureComponent = {
  id: string;
  name: string;
  type: string;
};

export type ArchitectureDependency = {
  id: string;
  source_component_id: string;
  target_component_id: string;
};

export function buildArchitectureMermaid(
  components: ArchitectureComponent[],
  dependencies: ArchitectureDependency[],
): string {
  if (components.length === 0) return "";

  const lines: string[] = ["flowchart LR"];
  const typeGroups = new Map<string, ArchitectureComponent[]>();
  for (const c of components) {
    const list = typeGroups.get(c.type) ?? [];
    list.push(c);
    typeGroups.set(c.type, list);
  }

  for (const [type, comps] of typeGroups) {
    lines.push(`    subgraph ${type.toUpperCase()}`);
    for (const c of comps) {
      const safeId = c.id.replace(/[^a-zA-Z0-9]/g, "_");
      lines.push(`        ${safeId}["${escapeLabel(c.name)}"]`);
    }
    lines.push("    end");
  }

  for (const dep of dependencies) {
    const src = components.find((c) => c.id === dep.source_component_id);
    const tgt = components.find((c) => c.id === dep.target_component_id);
    if (!src || !tgt) continue;
    const srcId = src.id.replace(/[^a-zA-Z0-9]/g, "_");
    const tgtId = tgt.id.replace(/[^a-zA-Z0-9]/g, "_");
    lines.push(`    ${srcId} --> ${tgtId}`);
  }

  return lines.join("\n");
}
