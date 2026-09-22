import { createClient } from "@/lib/supabase/server";
import { listRequirements } from "@/lib/requirements/queries";
import { listDecisions } from "@/lib/decisions/queries";
import { listDomains } from "@/lib/domains/queries";
import { listEntitiesByProject } from "@/lib/entities/queries";
import {
  listAttributes,
  nextAttributePosition,
} from "@/lib/attributes/queries";
import { listRelationships } from "@/lib/relationships/queries";
import { listArchitectureComponentsByProject } from "@/lib/architecture/components/queries";
import { listArchitectureTechnologiesByProject } from "@/lib/architecture/technologies/queries";
import { listArchitectureDecisionsByProject } from "@/lib/architecture/decisions/queries";
import { listArchitectureComponentDependenciesByProject } from "@/lib/architecture/dependencies/queries";
import { requirementInputSchema } from "@/lib/validation/requirements";
import { decisionInputSchema } from "@/lib/validation/decisions";
import { domainInputSchema } from "@/lib/validation/domains";
import { entityInputSchema } from "@/lib/validation/entities";
import { attributeInputSchema } from "@/lib/validation/attributes";
import { relationshipInputSchema } from "@/lib/validation/relationships";
import { architectureComponentInputSchema } from "@/lib/validation/architecture/components";
import { architectureTechnologyInputSchema } from "@/lib/validation/architecture/technologies";
import { architectureDecisionInputSchema } from "@/lib/validation/architecture/decisions";
import { architectureComponentDependencyInputSchema } from "@/lib/validation/architecture/dependencies";
import type {
  AiArchitectureComponentItem,
  AiArchitectureDecisionItem,
  AiArchitectureDependencyItem,
  AiArchitectureItem,
  AiArchitectureTechnologyItem,
  AiDecisionItem,
  AiErdAttributeItem,
  AiErdDomainItem,
  AiErdRelationshipItem,
  AiRequirementItem,
} from "@/lib/ai/schema";
import type {
  ArchitectureComponentType,
  ArchitectureTechnologyCategory,
  EntityDataType,
  RelationshipType,
} from "@/lib/supabase/types";

export function normalizeRequirementType(
  type: AiRequirementItem["type"],
): "functional" | "non_functional" {
  if (type === "non_functional") {
    return "non_functional";
  }
  return "functional";
}

export function normalizePriority(
  priority: AiRequirementItem["priority"],
): "low" | "medium" | "high" | "critical" {
  switch (priority) {
    case "must":
      return "critical";
    case "should":
      return "high";
    case "could":
      return "medium";
    case "wont":
      return "low";
  }
}

export type ApplyItemOutcome =
  | { kind: "created"; index: number; id: string; title: string }
  | { kind: "skipped"; index: number; title: string; reason: "duplicate" | "invalid" }
  | { kind: "failed"; index: number; title: string; error: string };

export type ApplySummary = {
  created: ApplyItemOutcome[];
  skipped: ApplyItemOutcome[];
  failed: ApplyItemOutcome[];
};

export type ApplyRequirementsSummary = ApplySummary;

export type ApplyOptions = {
  projectId: string;
  userId: string;
  items: AiRequirementItem[];
  indices: number[];
};

export type ApplyDecisionsOptions = {
  projectId: string;
  userId: string;
  items: AiDecisionItem[];
  indices: number[];
};

export type DecisionInsertRow = {
  project_id: string;
  title: string;
  context: string | null;
  decision: string;
  rationale: string | null;
  status: "proposed";
};

export type DecisionInsertResult =
  | { ok: true; row: DecisionInsertRow }
  | { ok: false; reason: "invalid" };

export function buildDecisionInsert(
  item: AiDecisionItem,
  projectId: string,
): DecisionInsertResult {
  const parsed = decisionInputSchema.safeParse({
    title: item.title,
    context: item.context,
    decision: item.decision,
    rationale: item.rationale,
    status: "proposed",
  });

  if (!parsed.success) {
    return { ok: false, reason: "invalid" };
  }

  return {
    ok: true,
    row: {
      project_id: projectId,
      title: parsed.data.title,
      context: parsed.data.context ? parsed.data.context : null,
      decision: parsed.data.decision,
      rationale: parsed.data.rationale ? parsed.data.rationale : null,
      status: "proposed",
    },
  };
}

export async function applyRequirementsToProject(
  options: ApplyOptions,
): Promise<ApplySummary> {
  const supabase = await createClient();
  const existing = await listRequirements({ projectId: options.projectId });
  const existingTitlesLower = new Set(
    existing.map((r) => r.title.trim().toLowerCase()),
  );

  const out: ApplyRequirementsSummary = {
    created: [],
    skipped: [],
    failed: [],
  };

  const chosen = [...new Set(options.indices)]
    .filter((n) => Number.isInteger(n) && n >= 0 && n < options.items.length)
    .sort((a, b) => a - b);

  for (const index of chosen) {
    const item = options.items[index];
    if (!item) {
      out.skipped.push({
        kind: "skipped",
        index,
        title: "",
        reason: "invalid",
      });
      continue;
    }

    const parsed = requirementInputSchema.safeParse({
      title: item.title,
      description: item.description,
      type: normalizeRequirementType(item.type),
      status: "draft",
      priority: normalizePriority(item.priority),
    });

    if (!parsed.success) {
      out.skipped.push({
        kind: "skipped",
        index,
        title: item.title,
        reason: "invalid",
      });
      continue;
    }

    const titleLower = parsed.data.title.trim().toLowerCase();
    if (existingTitlesLower.has(titleLower)) {
      out.skipped.push({
        kind: "skipped",
        index,
        title: parsed.data.title,
        reason: "duplicate",
      });
      continue;
    }

    const { data, error } = await supabase
      .from("requirements")
      .insert({
        project_id: options.projectId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        type: parsed.data.type,
        status: parsed.data.status,
        priority: parsed.data.priority,
      })
      .select("id, title")
      .single();

    if (error || !data) {
      out.failed.push({
        kind: "failed",
        index,
        title: parsed.data.title,
        error: error?.message ?? "Could not insert requirement.",
      });
      continue;
    }

    existingTitlesLower.add(titleLower);
    out.created.push({
      kind: "created",
      index,
      id: data.id,
      title: data.title,
    });
  }

  return out;
}

export async function applyDecisionsToProject(
  options: ApplyDecisionsOptions,
): Promise<ApplySummary> {
  const supabase = await createClient();
  const existing = await listDecisions({ projectId: options.projectId });
  const existingTitlesLower = new Set(
    existing.map((d) => d.title.trim().toLowerCase()),
  );

  const out: ApplySummary = {
    created: [],
    skipped: [],
    failed: [],
  };

  const chosen = [...new Set(options.indices)]
    .filter((n) => Number.isInteger(n) && n >= 0 && n < options.items.length)
    .sort((a, b) => a - b);

  for (const index of chosen) {
    const item = options.items[index];
    if (!item) {
      out.skipped.push({
        kind: "skipped",
        index,
        title: "",
        reason: "invalid",
      });
      continue;
    }

    const built = buildDecisionInsert(item, options.projectId);
    if (!built.ok) {
      out.skipped.push({
        kind: "skipped",
        index,
        title: item.title,
        reason: "invalid",
      });
      continue;
    }

    const titleLower = built.row.title.trim().toLowerCase();
    if (existingTitlesLower.has(titleLower)) {
      out.skipped.push({
        kind: "skipped",
        index,
        title: built.row.title,
        reason: "duplicate",
      });
      continue;
    }

    const { data, error } = await supabase
      .from("decisions")
      .insert({
        project_id: built.row.project_id,
        title: built.row.title,
        context: built.row.context,
        decision: built.row.decision,
        rationale: built.row.rationale,
        status: built.row.status,
      })
      .select("id, title")
      .single();

    if (error || !data) {
      out.failed.push({
        kind: "failed",
        index,
        title: built.row.title,
        error: error?.message ?? "Could not insert decision.",
      });
      continue;
    }

    existingTitlesLower.add(titleLower);
    out.created.push({
      kind: "created",
      index,
      id: data.id,
      title: data.title,
    });
  }

  return out;
}

export type ApplyErdOptions = {
  projectId: string;
  userId: string;
  items: AiErdDomainItem[];
  indices: number[];
};

export type ErdDomainRow = { name: string; description: string | null };
export type ErdEntityRow = { name: string; description: string | null };
export type ErdAttributeRow = {
  name: string;
  data_type: EntityDataType;
  is_required: boolean;
  is_primary_key: boolean;
  description: string | null;
};
export type ErdRelationshipRow = {
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: RelationshipType;
  name: string | null;
  description: string | null;
};

function optionalText(value: string): string | null {
  return value ? value : null;
}

export type ErdDomainInput = { name: string; description: string };
export type ErdEntityInput = { name: string; description: string };

export function buildDomainRow(item: ErdDomainInput): ErdDomainRow | null {
  const parsed = domainInputSchema.safeParse({
    name: item.name,
    description: item.description,
  });
  if (!parsed.success) return null;
  return {
    name: parsed.data.name,
    description: optionalText(parsed.data.description ?? ""),
  };
}

export function buildEntityRow(item: ErdEntityInput): ErdEntityRow | null {
  const parsed = entityInputSchema.safeParse({
    name: item.name,
    description: item.description,
  });
  if (!parsed.success) return null;
  return {
    name: parsed.data.name,
    description: optionalText(parsed.data.description ?? ""),
  };
}

export function buildAttributeRow(
  item: AiErdAttributeItem,
): ErdAttributeRow | null {
  const parsed = attributeInputSchema.safeParse({
    name: item.name,
    data_type: item.data_type,
    is_required: item.is_required,
    is_primary_key: item.is_primary_key,
    default_value: "",
    description: item.description,
  });
  if (!parsed.success) return null;
  return {
    name: parsed.data.name,
    data_type: parsed.data.data_type,
    is_required: parsed.data.is_required,
    is_primary_key: parsed.data.is_primary_key,
    description: optionalText(parsed.data.description ?? ""),
  };
}

export function buildRelationshipRow(
  item: AiErdRelationshipItem,
  sourceEntityId: string,
  targetEntityId: string,
): ErdRelationshipRow | null {
  const parsed = relationshipInputSchema.safeParse({
    source_entity_id: sourceEntityId,
    target_entity_id: targetEntityId,
    relationship_type: item.relationship_type,
    name: item.name,
    description: item.description,
  });
  if (!parsed.success) return null;
  return {
    source_entity_id: parsed.data.source_entity_id,
    target_entity_id: parsed.data.target_entity_id,
    relationship_type: parsed.data.relationship_type,
    name: optionalText(parsed.data.name ?? ""),
    description: optionalText(parsed.data.description ?? ""),
  };
}

export function relationshipDedupeKey(
  sourceEntityId: string,
  targetEntityId: string,
  relationshipType: RelationshipType,
): string {
  return `${sourceEntityId}|${targetEntityId}|${relationshipType}`;
}

type PendingRelationship = {
  index: number;
  label: string;
  sourceEntityId: string;
  item: AiErdRelationshipItem;
};

export async function applyErdToProject(
  options: ApplyErdOptions,
): Promise<ApplySummary> {
  const supabase = await createClient();
  const out: ApplySummary = { created: [], skipped: [], failed: [] };

  const chosen = [...new Set(options.indices)]
    .filter((n) => Number.isInteger(n) && n >= 0 && n < options.items.length)
    .sort((a, b) => a - b);

  const [existingDomains, existingEntities, existingRelationships] =
    await Promise.all([
      listDomains({ projectId: options.projectId }),
      listEntitiesByProject(options.projectId),
      listRelationships({ projectId: options.projectId }),
    ]);

  const domainIdByKey = new Map<string, string>();
  const domainNameById = new Map<string, string>();
  for (const domain of existingDomains) {
    domainIdByKey.set(domain.name.trim().toLowerCase(), domain.id);
    domainNameById.set(domain.id, domain.name);
  }

  const entityIdByDomainKey = new Map<string, string>();
  const entityIdByName = new Map<string, string>();
  for (const entity of existingEntities) {
    entityIdByDomainKey.set(
      `${entity.domain_id}|${entity.name.trim().toLowerCase()}`,
      entity.id,
    );
    const nameKey = entity.name.trim().toLowerCase();
    if (!entityIdByName.has(nameKey)) {
      entityIdByName.set(nameKey, entity.id);
    }
  }

  const relationshipKeys = new Set(
    existingRelationships.map((rel) =>
      relationshipDedupeKey(
        rel.source_entity_id,
        rel.target_entity_id,
        rel.relationship_type,
      ),
    ),
  );

  const attributeNamesByEntity = new Map<string, Set<string>>();
  const nextPositionByEntity = new Map<string, number>();

  const attributeNamesFor = async (entityId: string): Promise<Set<string>> => {
    const cached = attributeNamesByEntity.get(entityId);
    if (cached) return cached;
    const rows = await listAttributes({ entityId });
    const names = new Set(rows.map((row) => row.name.trim().toLowerCase()));
    attributeNamesByEntity.set(entityId, names);
    return names;
  };

  const positionFor = async (entityId: string): Promise<number> => {
    const cached = nextPositionByEntity.get(entityId);
    if (typeof cached === "number") return cached;
    const position = await nextAttributePosition(entityId);
    nextPositionByEntity.set(entityId, position);
    return position;
  };

  const pending: PendingRelationship[] = [];

  for (const index of chosen) {
    const item = options.items[index];
    if (!item) {
      out.skipped.push({ kind: "skipped", index, title: "", reason: "invalid" });
      continue;
    }

    const domainRow = buildDomainRow(item);
    if (!domainRow) {
      out.skipped.push({
        kind: "skipped",
        index,
        title: typeof item.name === "string" ? item.name : "",
        reason: "invalid",
      });
      continue;
    }

    const domainKey = domainRow.name.toLowerCase();
    let domainId = domainIdByKey.get(domainKey) ?? null;
    let createdInItem = 0;

    if (!domainId) {
      const { data, error } = await supabase
        .from("domains")
        .insert({
          project_id: options.projectId,
          name: domainRow.name,
          description: domainRow.description,
        })
        .select("id, name")
        .single();

      if (error || !data) {
        out.failed.push({
          kind: "failed",
          index,
          title: domainRow.name,
          error: error?.message ?? "Could not insert domain.",
        });
        continue;
      }

      domainId = data.id;
      domainIdByKey.set(domainKey, data.id);
      domainNameById.set(data.id, data.name);
      createdInItem += 1;
    }

    for (const entityItem of item.entities) {
      const entityRow = buildEntityRow(entityItem);
      if (!entityRow) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: `${domainRow.name} / ${entityItem.name}`,
          reason: "invalid",
        });
        continue;
      }

      const entityKey = `${domainId}|${entityRow.name.toLowerCase()}`;
      let entityId = entityIdByDomainKey.get(entityKey) ?? null;

      if (!entityId) {
        const { data, error } = await supabase
          .from("entities")
          .insert({
            domain_id: domainId,
            name: entityRow.name,
            description: entityRow.description,
          })
          .select("id, name")
          .single();

        if (error || !data) {
          out.failed.push({
            kind: "failed",
            index,
            title: `${domainRow.name} / ${entityRow.name}`,
            error: error?.message ?? "Could not insert entity.",
          });
          continue;
        }

        entityId = data.id;
        entityIdByDomainKey.set(entityKey, data.id);
        createdInItem += 1;
      }

      const nameKey = entityRow.name.toLowerCase();
      if (!entityIdByName.has(nameKey)) {
        entityIdByName.set(nameKey, entityId);
      }

      const existingAttributeNames = await attributeNamesFor(entityId);

      for (const attributeItem of entityItem.attributes) {
        const attributeRow = buildAttributeRow(attributeItem);
        if (!attributeRow) {
          out.skipped.push({
            kind: "skipped",
            index,
            title: `${domainRow.name} / ${entityRow.name} / ${attributeItem.name}`,
            reason: "invalid",
          });
          continue;
        }

        const attributeKey = attributeRow.name.toLowerCase();
        if (existingAttributeNames.has(attributeKey)) {
          continue;
        }

        const position = await positionFor(entityId);
        const { error } = await supabase
          .from("entity_attributes")
          .insert({
            entity_id: entityId,
            name: attributeRow.name,
            data_type: attributeRow.data_type,
            is_required: attributeRow.is_required,
            is_primary_key: attributeRow.is_primary_key,
            default_value: null,
            description: attributeRow.description,
            position,
          });

        if (error) {
          out.failed.push({
            kind: "failed",
            index,
            title: `${domainRow.name} / ${entityRow.name} / ${attributeRow.name}`,
            error: error.message,
          });
          continue;
        }

        existingAttributeNames.add(attributeKey);
        nextPositionByEntity.set(entityId, position + 1);
        createdInItem += 1;
      }

      for (const relationshipItem of entityItem.relationships) {
        pending.push({
          index,
          label: `${domainRow.name} / ${entityRow.name}`,
          sourceEntityId: entityId,
          item: relationshipItem,
        });
      }
    }

    if (createdInItem > 0) {
      out.created.push({
        kind: "created",
        index,
        id: domainId,
        title: domainRow.name,
      });
    } else {
      out.skipped.push({
        kind: "skipped",
        index,
        title: domainRow.name,
        reason: "duplicate",
      });
    }
  }

  for (const entry of pending) {
    const label = `${entry.label} → ${entry.item.target_entity}`;
    const targetEntityId =
      entityIdByName.get(entry.item.target_entity.trim().toLowerCase()) ?? null;

    if (!targetEntityId || targetEntityId === entry.sourceEntityId) {
      out.skipped.push({
        kind: "skipped",
        index: entry.index,
        title: label,
        reason: "invalid",
      });
      continue;
    }

    const relationshipRow = buildRelationshipRow(
      entry.item,
      entry.sourceEntityId,
      targetEntityId,
    );
    if (!relationshipRow) {
      out.skipped.push({
        kind: "skipped",
        index: entry.index,
        title: label,
        reason: "invalid",
      });
      continue;
    }

    const key = relationshipDedupeKey(
      relationshipRow.source_entity_id,
      relationshipRow.target_entity_id,
      relationshipRow.relationship_type,
    );
    if (relationshipKeys.has(key)) {
      out.skipped.push({
        kind: "skipped",
        index: entry.index,
        title: label,
        reason: "duplicate",
      });
      continue;
    }

    const { error } = await supabase.from("entity_relationships").insert({
      project_id: options.projectId,
      source_entity_id: relationshipRow.source_entity_id,
      target_entity_id: relationshipRow.target_entity_id,
      relationship_type: relationshipRow.relationship_type,
      name: relationshipRow.name,
      description: relationshipRow.description,
    });

    if (error) {
      out.failed.push({
        kind: "failed",
        index: entry.index,
        title: label,
        error: error.message,
      });
      continue;
    }

    relationshipKeys.add(key);
  }

  return out;
}

export type ApplyArchitectureOptions = {
  projectId: string;
  userId: string;
  items: AiArchitectureItem[];
  indices: number[];
};

export type ArchitectureComponentRow = {
  name: string;
  type: ArchitectureComponentType;
  description: string | null;
};
export type ArchitectureTechnologyRow = {
  name: string;
  category: ArchitectureTechnologyCategory;
  description: string | null;
};
export type ArchitectureDecisionRow = {
  title: string;
  context: string | null;
  decision: string;
  rationale: string | null;
  status: "proposed";
};
export type ArchitectureDependencyRow = {
  source_component_id: string;
  target_component_id: string;
  description: string | null;
};

export function buildArchitectureComponentRow(
  item: AiArchitectureComponentItem,
): ArchitectureComponentRow | null {
  const parsed = architectureComponentInputSchema.safeParse({
    name: item.name,
    type: item.type,
    description: item.description,
  });
  if (!parsed.success) return null;
  return {
    name: parsed.data.name,
    type: parsed.data.type,
    description: optionalText(parsed.data.description ?? ""),
  };
}

export function buildArchitectureTechnologyRow(
  item: AiArchitectureTechnologyItem,
): ArchitectureTechnologyRow | null {
  const parsed = architectureTechnologyInputSchema.safeParse({
    name: item.name,
    category: item.category,
    description: item.description,
  });
  if (!parsed.success) return null;
  return {
    name: parsed.data.name,
    category: parsed.data.category,
    description: optionalText(parsed.data.description ?? ""),
  };
}

export function buildArchitectureDecisionRow(
  item: AiArchitectureDecisionItem,
): ArchitectureDecisionRow | null {
  const parsed = architectureDecisionInputSchema.safeParse({
    title: item.title,
    context: item.context,
    decision: item.decision,
    rationale: item.rationale,
    status: "proposed",
  });
  if (!parsed.success) return null;
  return {
    title: parsed.data.title,
    context: optionalText(parsed.data.context ?? ""),
    decision: parsed.data.decision,
    rationale: optionalText(parsed.data.rationale ?? ""),
    status: "proposed",
  };
}

export function buildArchitectureDependencyRow(
  item: AiArchitectureDependencyItem,
  sourceComponentId: string,
  targetComponentId: string,
): ArchitectureDependencyRow | null {
  const parsed = architectureComponentDependencyInputSchema.safeParse({
    source_component_id: sourceComponentId,
    target_component_id: targetComponentId,
    description: item.description,
  });
  if (!parsed.success) return null;
  return {
    source_component_id: parsed.data.source_component_id,
    target_component_id: parsed.data.target_component_id,
    description: optionalText(parsed.data.description ?? ""),
  };
}

export function architectureDependencyDedupeKey(
  sourceComponentId: string,
  targetComponentId: string,
): string {
  return `${sourceComponentId}|${targetComponentId}`;
}

type PendingArchitectureDependency = {
  index: number;
  label: string;
  sourceComponentId: string;
  item: AiArchitectureDependencyItem;
};

export async function applyArchitectureToProject(
  options: ApplyArchitectureOptions,
): Promise<ApplySummary> {
  const supabase = await createClient();
  const out: ApplySummary = { created: [], skipped: [], failed: [] };

  const chosen = [...new Set(options.indices)]
    .filter((n) => Number.isInteger(n) && n >= 0 && n < options.items.length)
    .sort((a, b) => a - b);

  const [components, technologies, decisions, dependencies] = await Promise.all([
    listArchitectureComponentsByProject({ projectId: options.projectId }),
    listArchitectureTechnologiesByProject({ projectId: options.projectId }),
    listArchitectureDecisionsByProject({ projectId: options.projectId }),
    listArchitectureComponentDependenciesByProject({
      projectId: options.projectId,
    }),
  ]);

  const componentIdByKey = new Map<string, string>();
  const componentIdByName = new Map<string, string>();
  let position = components.reduce(
    (max, component) => Math.max(max, component.position),
    -1,
  );
  position += 1;
  for (const component of components) {
    const key = component.name.trim().toLowerCase();
    componentIdByKey.set(key, component.id);
    if (!componentIdByName.has(key)) {
      componentIdByName.set(key, component.id);
    }
  }

  const technologyNames = new Set(
    technologies.map((technology) => technology.name.trim().toLowerCase()),
  );
  const decisionTitles = new Set(
    decisions.map((decision) => decision.title.trim().toLowerCase()),
  );
  const dependencyKeys = new Set(
    dependencies.map((dependency) =>
      architectureDependencyDedupeKey(
        dependency.source_component_id,
        dependency.target_component_id,
      ),
    ),
  );

  const pending: PendingArchitectureDependency[] = [];

  for (const index of chosen) {
    const item = options.items[index];
    if (!item) {
      out.skipped.push({ kind: "skipped", index, title: "", reason: "invalid" });
      continue;
    }

    if (item.kind === "component") {
      const row = buildArchitectureComponentRow(item);
      if (!row) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: item.name,
          reason: "invalid",
        });
        continue;
      }

      const key = row.name.toLowerCase();
      let componentId = componentIdByKey.get(key) ?? null;

      if (!componentId) {
        const { data, error } = await supabase
          .from("architecture_components")
          .insert({
            project_id: options.projectId,
            name: row.name,
            description: row.description,
            type: row.type,
            position,
          })
          .select("id, name")
          .single();

        if (error || !data) {
          out.failed.push({
            kind: "failed",
            index,
            title: row.name,
            error: error?.message ?? "Could not insert component.",
          });
          continue;
        }

        componentId = data.id;
        componentIdByKey.set(key, data.id);
        position += 1;
        out.created.push({
          kind: "created",
          index,
          id: data.id,
          title: data.name,
        });
      } else {
        out.skipped.push({
          kind: "skipped",
          index,
          title: row.name,
          reason: "duplicate",
        });
      }

      if (!componentIdByName.has(key)) {
        componentIdByName.set(key, componentId);
      }

      for (const dependencyItem of item.depends_on) {
        pending.push({
          index,
          label: row.name,
          sourceComponentId: componentId,
          item: dependencyItem,
        });
      }
      continue;
    }

    if (item.kind === "technology") {
      const row = buildArchitectureTechnologyRow(item);
      if (!row) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: item.name,
          reason: "invalid",
        });
        continue;
      }

      const key = row.name.toLowerCase();
      if (technologyNames.has(key)) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: row.name,
          reason: "duplicate",
        });
        continue;
      }

      const { data, error } = await supabase
        .from("architecture_technologies")
        .insert({
          project_id: options.projectId,
          name: row.name,
          category: row.category,
          description: row.description,
        })
        .select("id, name")
        .single();

      if (error || !data) {
        out.failed.push({
          kind: "failed",
          index,
          title: row.name,
          error: error?.message ?? "Could not insert technology.",
        });
        continue;
      }

      technologyNames.add(key);
      out.created.push({
        kind: "created",
        index,
        id: data.id,
        title: data.name,
      });
      continue;
    }

    const row = buildArchitectureDecisionRow(item);
    if (!row) {
      out.skipped.push({
        kind: "skipped",
        index,
        title: item.title,
        reason: "invalid",
      });
      continue;
    }

    const key = row.title.toLowerCase();
    if (decisionTitles.has(key)) {
      out.skipped.push({
        kind: "skipped",
        index,
        title: row.title,
        reason: "duplicate",
      });
      continue;
    }

    const { data, error } = await supabase
      .from("architecture_decisions")
      .insert({
        project_id: options.projectId,
        title: row.title,
        context: row.context,
        decision: row.decision,
        rationale: row.rationale,
        status: row.status,
      })
      .select("id, title")
      .single();

    if (error || !data) {
      out.failed.push({
        kind: "failed",
        index,
        title: row.title,
        error: error?.message ?? "Could not insert architecture decision.",
      });
      continue;
    }

    decisionTitles.add(key);
    out.created.push({ kind: "created", index, id: data.id, title: data.title });
  }

  for (const entry of pending) {
    const label = `${entry.label} → ${entry.item.target_component}`;
    const targetComponentId =
      componentIdByName.get(entry.item.target_component.trim().toLowerCase()) ??
      null;

    if (!targetComponentId || targetComponentId === entry.sourceComponentId) {
      out.skipped.push({
        kind: "skipped",
        index: entry.index,
        title: label,
        reason: "invalid",
      });
      continue;
    }

    const row = buildArchitectureDependencyRow(
      entry.item,
      entry.sourceComponentId,
      targetComponentId,
    );
    if (!row) {
      out.skipped.push({
        kind: "skipped",
        index: entry.index,
        title: label,
        reason: "invalid",
      });
      continue;
    }

    const key = architectureDependencyDedupeKey(
      row.source_component_id,
      row.target_component_id,
    );
    if (dependencyKeys.has(key)) {
      out.skipped.push({
        kind: "skipped",
        index: entry.index,
        title: label,
        reason: "duplicate",
      });
      continue;
    }

    const { error } = await supabase
      .from("architecture_component_dependencies")
      .insert({
        project_id: options.projectId,
        source_component_id: row.source_component_id,
        target_component_id: row.target_component_id,
        description: row.description,
      });

    if (error) {
      out.failed.push({
        kind: "failed",
        index: entry.index,
        title: label,
        error: error.message,
      });
      continue;
    }

    dependencyKeys.add(key);
  }

  return out;
}
