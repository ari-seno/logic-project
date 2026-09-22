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
import { loadProjectApiContract } from "@/lib/api/endpoints/queries";
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
  AiApiEndpointItem,
  AiApiErrorItem,
  AiApiGroupItem,
  AiApiItem,
  AiApiParameterItem,
  AiApiRequestBodyItem,
  AiApiResponseItem,
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
  ApiEndpointEntityRole,
  ApiHttpMethod,
  ApiParameterDataType,
  ApiParameterLocation,
  ArchitectureComponentType,
  ArchitectureTechnologyCategory,
  EntityDataType,
  Json,
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

export type ApplyApiOptions = {
  projectId: string;
  userId: string;
  items: AiApiItem[];
  indices: number[];
};

export type ApiGroupRow = {
  name: string;
  prefix: string | null;
  description: string | null;
};

export type ApiEndpointRow = {
  name: string;
  method: ApiHttpMethod;
  path: string;
  summary: string | null;
  description: string | null;
  authentication_required: boolean;
  group_name: string;
};

export type ApiParameterRow = {
  name: string;
  location: ApiParameterLocation;
  data_type: ApiParameterDataType;
  required: boolean;
  description: string | null;
  example: string | null;
};

export type ApiRequestBodyRow = {
  content_type: string;
  description: string | null;
  schema_definition: Json | null;
  example: Json | null;
};

export type ApiResponseRow = {
  status_code: number;
  content_type: string | null;
  description: string | null;
  schema_definition: Json | null;
  example: Json | null;
};

export type ApiErrorRow = {
  code: string;
  message: string;
  http_status: number | null;
  description: string | null;
};

export function buildApiGroupRow(item: AiApiGroupItem): ApiGroupRow | null {
  const name = item.name.trim();
  if (name.length < 1 || name.length > 200) return null;
  const prefix = item.prefix.trim();
  if (prefix.length > 200) return null;
  const description = item.description.trim();
  if (description.length > 5000) return null;
  return {
    name,
    prefix: optionalText(prefix),
    description: optionalText(description),
  };
}

export function buildApiEndpointRow(
  item: AiApiEndpointItem,
): ApiEndpointRow | null {
  const name = item.name.trim();
  if (name.length < 1 || name.length > 200) return null;
  const path = item.path.trim();
  if (path.length < 1 || path.length > 500) return null;
  if (!path.startsWith("/")) return null;
  const summary = item.summary.trim();
  if (summary.length > 500) return null;
  const description = item.description.trim();
  if (description.length > 5000) return null;
  const groupName = item.group_name.trim();
  if (groupName.length > 200) return null;
  return {
    name,
    method: item.method,
    path,
    summary: optionalText(summary),
    description: optionalText(description),
    authentication_required: item.authentication_required,
    group_name: groupName,
  };
}

export function buildApiParameterRow(
  item: AiApiParameterItem,
): ApiParameterRow | null {
  const name = item.name.trim();
  if (name.length < 1 || name.length > 200) return null;
  const description = item.description.trim();
  if (description.length > 2000) return null;
  const example = item.example.trim();
  if (example.length > 1000) return null;
  return {
    name,
    location: item.location,
    data_type: item.data_type,
    required: item.required,
    description: optionalText(description),
    example: optionalText(example),
  };
}

export function buildApiRequestBodyRow(
  item: AiApiRequestBodyItem,
): ApiRequestBodyRow | null {
  const contentType = item.content_type.trim();
  if (contentType.length < 1 || contentType.length > 200) return null;
  const description = item.description.trim();
  if (description.length > 2000) return null;
  return {
    content_type: contentType,
    description: optionalText(description),
    schema_definition: toJson(item.schema),
    example: toJson(item.example),
  };
}

export function buildApiResponseRow(
  item: AiApiResponseItem,
): ApiResponseRow | null {
  if (!Number.isInteger(item.status_code)) return null;
  if (item.status_code < 100 || item.status_code > 599) return null;
  const contentType = item.content_type.trim();
  if (contentType.length > 200) return null;
  const description = item.description.trim();
  if (description.length > 2000) return null;
  return {
    status_code: item.status_code,
    content_type: optionalText(contentType),
    description: optionalText(description),
    schema_definition: toJson(item.schema),
    example: toJson(item.example),
  };
}

export function buildApiErrorRow(item: AiApiErrorItem): ApiErrorRow | null {
  const code = item.code.trim();
  if (code.length < 1 || code.length > 100) return null;
  const message = item.message.trim();
  if (message.length < 1 || message.length > 500) return null;
  const description = item.description.trim();
  if (description.length > 2000) return null;
  const httpStatus = item.http_status ?? null;
  if (
    httpStatus !== null &&
    (!Number.isInteger(httpStatus) || httpStatus < 100 || httpStatus > 599)
  ) {
    return null;
  }
  return {
    code,
    message,
    http_status: httpStatus,
    description: optionalText(description),
  };
}

export function apiEndpointDedupeKey(
  method: ApiHttpMethod,
  path: string,
): string {
  return `${method}|${path}`;
}

export function apiParameterDedupeKey(
  endpointId: string,
  location: ApiParameterLocation,
  name: string,
): string {
  return `${endpointId}|${location}|${name.trim().toLowerCase()}`;
}

export function apiResponseDedupeKey(
  endpointId: string,
  statusCode: number,
): string {
  return `${endpointId}|${statusCode}`;
}

export function apiErrorDedupeKey(endpointId: string, code: string): string {
  return `${endpointId}|${code.trim().toLowerCase()}`;
}

export function apiEntityLinkDedupeKey(
  endpointId: string,
  entityId: string,
  role: ApiEndpointEntityRole,
): string {
  return `${endpointId}|${entityId}|${role}`;
}

export function apiRequirementLinkDedupeKey(
  endpointId: string,
  requirementId: string,
): string {
  return `${endpointId}|${requirementId}`;
}

function toJson(value: unknown): Json | null {
  if (value === null || value === undefined) return null;
  return value as Json;
}

function nextPositionByParent(
  rows: Array<{ endpoint_id: string; position: number }>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(
      row.endpoint_id,
      Math.max(map.get(row.endpoint_id) ?? -1, row.position),
    );
  }
  for (const [key, value] of map) {
    map.set(key, value + 1);
  }
  return map;
}

export async function applyApiToProject(
  options: ApplyApiOptions,
): Promise<ApplySummary> {
  const supabase = await createClient();
  const out: ApplySummary = { created: [], skipped: [], failed: [] };

  const chosen = [...new Set(options.indices)]
    .filter((n) => Number.isInteger(n) && n >= 0 && n < options.items.length)
    .sort((a, b) => a - b);

  const [contract, entities, requirements] = await Promise.all([
    loadProjectApiContract(options.projectId),
    listEntitiesByProject(options.projectId),
    listRequirements({ projectId: options.projectId }),
  ]);

  const groupIdByKey = new Map<string, string>();
  let groupPosition =
    contract.groups.reduce((max, group) => Math.max(max, group.position), -1) + 1;
  for (const group of contract.groups) {
    groupIdByKey.set(group.name.trim().toLowerCase(), group.id);
  }

  const endpointIdByKey = new Map<string, string>();
  let endpointPosition =
    contract.endpoints.reduce(
      (max, endpoint) => Math.max(max, endpoint.position),
      -1,
    ) + 1;
  for (const endpoint of contract.endpoints) {
    endpointIdByKey.set(
      apiEndpointDedupeKey(endpoint.method, endpoint.path),
      endpoint.id,
    );
  }

  const parameterKeys = new Set(
    contract.parameters.map((parameter) =>
      apiParameterDedupeKey(
        parameter.endpoint_id,
        parameter.location,
        parameter.name,
      ),
    ),
  );
  const parameterPosition = nextPositionByParent(contract.parameters);

  const requestBodyEndpointIds = new Set(
    contract.requestBodies.map((body) => body.endpoint_id),
  );

  const responseKeys = new Set(
    contract.responses.map((response) =>
      apiResponseDedupeKey(response.endpoint_id, response.status_code),
    ),
  );
  const responsePosition = nextPositionByParent(contract.responses);

  const errorKeys = new Set(
    contract.errors.map((error) =>
      apiErrorDedupeKey(error.endpoint_id, error.code),
    ),
  );

  const entityLinkKeys = new Set(
    contract.endpointEntities.map((link) =>
      apiEntityLinkDedupeKey(link.endpoint_id, link.entity_id, link.role),
    ),
  );
  const requirementLinkKeys = new Set(
    contract.endpointRequirements.map((link) =>
      apiRequirementLinkDedupeKey(link.endpoint_id, link.requirement_id),
    ),
  );

  const entityIdByName = new Map<string, string>();
  for (const entity of entities) {
    const key = entity.name.trim().toLowerCase();
    if (!entityIdByName.has(key)) entityIdByName.set(key, entity.id);
  }

  const requirementIdByTitle = new Map<string, string>();
  for (const requirement of requirements) {
    const key = requirement.title.trim().toLowerCase();
    if (!requirementIdByTitle.has(key)) {
      requirementIdByTitle.set(key, requirement.id);
    }
  }

  for (const index of chosen) {
    const item = options.items[index];
    if (!item) {
      out.skipped.push({ kind: "skipped", index, title: "", reason: "invalid" });
      continue;
    }

    if (item.kind === "group") {
      const row = buildApiGroupRow(item);
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
      if (groupIdByKey.has(key)) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: row.name,
          reason: "duplicate",
        });
        continue;
      }

      const { data, error } = await supabase
        .from("api_groups")
        .insert({
          project_id: options.projectId,
          name: row.name,
          prefix: row.prefix,
          description: row.description,
          position: groupPosition,
        })
        .select("id, name")
        .single();

      if (error || !data) {
        out.failed.push({
          kind: "failed",
          index,
          title: row.name,
          error: error?.message ?? "Could not insert API group.",
        });
        continue;
      }

      groupIdByKey.set(key, data.id);
      groupPosition += 1;
      out.created.push({ kind: "created", index, id: data.id, title: data.name });
      continue;
    }

    const label = `${item.method} ${item.path}`;
    const row = buildApiEndpointRow(item);
    if (!row) {
      out.skipped.push({ kind: "skipped", index, title: label, reason: "invalid" });
      continue;
    }

    const endpointKey = apiEndpointDedupeKey(row.method, row.path);
    let endpointId = endpointIdByKey.get(endpointKey) ?? null;
    let createdEndpoint = false;

    if (!endpointId) {
      let groupId: string | null = null;

      if (row.group_name) {
        const groupKey = row.group_name.toLowerCase();
        groupId = groupIdByKey.get(groupKey) ?? null;

        if (!groupId) {
          const { data: group, error: groupError } = await supabase
            .from("api_groups")
            .insert({
              project_id: options.projectId,
              name: row.group_name,
              position: groupPosition,
            })
            .select("id")
            .single();

          if (groupError || !group) {
            out.failed.push({
              kind: "failed",
              index,
              title: label,
              error: groupError?.message ?? "Could not insert API group.",
            });
            continue;
          }

          groupId = group.id;
          groupIdByKey.set(groupKey, group.id);
          groupPosition += 1;
        }
      }

      const { data, error } = await supabase
        .from("api_endpoints")
        .insert({
          project_id: options.projectId,
          group_id: groupId,
          name: row.name,
          method: row.method,
          path: row.path,
          summary: row.summary,
          description: row.description,
          authentication_required: row.authentication_required,
          position: endpointPosition,
        })
        .select("id, path")
        .single();

      if (error || !data) {
        out.failed.push({
          kind: "failed",
          index,
          title: label,
          error: error?.message ?? "Could not insert API endpoint.",
        });
        continue;
      }

      endpointId = data.id;
      endpointIdByKey.set(endpointKey, data.id);
      endpointPosition += 1;
      createdEndpoint = true;
    }

    for (const parameterItem of item.parameters) {
      const parameterLabel = `${label} → ${parameterItem.name}`;
      const parameterRow = buildApiParameterRow(parameterItem);
      if (!parameterRow) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: parameterLabel,
          reason: "invalid",
        });
        continue;
      }

      const key = apiParameterDedupeKey(
        endpointId,
        parameterRow.location,
        parameterRow.name,
      );
      if (parameterKeys.has(key)) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: parameterLabel,
          reason: "duplicate",
        });
        continue;
      }

      const position = parameterPosition.get(endpointId) ?? 0;
      const { error } = await supabase.from("api_parameters").insert({
        endpoint_id: endpointId,
        name: parameterRow.name,
        location: parameterRow.location,
        data_type: parameterRow.data_type,
        required: parameterRow.required,
        description: parameterRow.description,
        example: parameterRow.example,
        position,
      });

      if (error) {
        out.failed.push({
          kind: "failed",
          index,
          title: parameterLabel,
          error: error.message,
        });
        continue;
      }

      parameterKeys.add(key);
      parameterPosition.set(endpointId, position + 1);
    }

    if (item.request_body) {
      const bodyLabel = `${label} → request body`;
      const bodyRow = buildApiRequestBodyRow(item.request_body);

      if (!bodyRow) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: bodyLabel,
          reason: "invalid",
        });
      } else if (requestBodyEndpointIds.has(endpointId)) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: bodyLabel,
          reason: "duplicate",
        });
      } else {
        const { error } = await supabase.from("api_request_bodies").insert({
          endpoint_id: endpointId,
          content_type: bodyRow.content_type,
          description: bodyRow.description,
          schema_definition: bodyRow.schema_definition,
          example: bodyRow.example,
        });

        if (error) {
          out.failed.push({
            kind: "failed",
            index,
            title: bodyLabel,
            error: error.message,
          });
        } else {
          requestBodyEndpointIds.add(endpointId);
        }
      }
    }

    for (const responseItem of item.responses) {
      const responseLabel = `${label} → ${responseItem.status_code}`;
      const responseRow = buildApiResponseRow(responseItem);
      if (!responseRow) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: responseLabel,
          reason: "invalid",
        });
        continue;
      }

      const key = apiResponseDedupeKey(endpointId, responseRow.status_code);
      if (responseKeys.has(key)) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: responseLabel,
          reason: "duplicate",
        });
        continue;
      }

      const position = responsePosition.get(endpointId) ?? 0;
      const { error } = await supabase.from("api_responses").insert({
        endpoint_id: endpointId,
        status_code: responseRow.status_code,
        content_type: responseRow.content_type,
        description: responseRow.description,
        schema_definition: responseRow.schema_definition,
        example: responseRow.example,
        position,
      });

      if (error) {
        out.failed.push({
          kind: "failed",
          index,
          title: responseLabel,
          error: error.message,
        });
        continue;
      }

      responseKeys.add(key);
      responsePosition.set(endpointId, position + 1);
    }

    for (const errorItem of item.errors) {
      const errorLabel = `${label} → ${errorItem.code}`;
      const errorRow = buildApiErrorRow(errorItem);
      if (!errorRow) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: errorLabel,
          reason: "invalid",
        });
        continue;
      }

      const key = apiErrorDedupeKey(endpointId, errorRow.code);
      if (errorKeys.has(key)) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: errorLabel,
          reason: "duplicate",
        });
        continue;
      }

      const { error } = await supabase.from("api_errors").insert({
        endpoint_id: endpointId,
        code: errorRow.code,
        message: errorRow.message,
        description: errorRow.description,
        http_status: errorRow.http_status,
      });

      if (error) {
        out.failed.push({
          kind: "failed",
          index,
          title: errorLabel,
          error: error.message,
        });
        continue;
      }

      errorKeys.add(key);
    }

    for (const link of item.entities) {
      const linkLabel = `${label} → ${link.entity_name}`;
      const entityId =
        entityIdByName.get(link.entity_name.trim().toLowerCase()) ?? null;

      if (!entityId) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: linkLabel,
          reason: "invalid",
        });
        continue;
      }

      const key = apiEntityLinkDedupeKey(endpointId, entityId, link.role);
      if (entityLinkKeys.has(key)) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: linkLabel,
          reason: "duplicate",
        });
        continue;
      }

      const { error } = await supabase.from("api_endpoint_entities").insert({
        endpoint_id: endpointId,
        entity_id: entityId,
        role: link.role,
      });

      if (error) {
        out.failed.push({
          kind: "failed",
          index,
          title: linkLabel,
          error: error.message,
        });
        continue;
      }

      entityLinkKeys.add(key);
    }

    for (const requirementTitle of item.requirement_titles) {
      const linkLabel = `${label} → ${requirementTitle}`;
      const requirementId =
        requirementIdByTitle.get(requirementTitle.trim().toLowerCase()) ?? null;

      if (!requirementId) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: linkLabel,
          reason: "invalid",
        });
        continue;
      }

      const key = apiRequirementLinkDedupeKey(endpointId, requirementId);
      if (requirementLinkKeys.has(key)) {
        out.skipped.push({
          kind: "skipped",
          index,
          title: linkLabel,
          reason: "duplicate",
        });
        continue;
      }

      const { error } = await supabase.from("api_endpoint_requirements").insert({
        endpoint_id: endpointId,
        requirement_id: requirementId,
      });

      if (error) {
        out.failed.push({
          kind: "failed",
          index,
          title: linkLabel,
          error: error.message,
        });
        continue;
      }

      requirementLinkKeys.add(key);
    }

    if (createdEndpoint) {
      out.created.push({ kind: "created", index, id: endpointId, title: label });
    } else {
      out.skipped.push({
        kind: "skipped",
        index,
        title: label,
        reason: "duplicate",
      });
    }
  }

  return out;
}
