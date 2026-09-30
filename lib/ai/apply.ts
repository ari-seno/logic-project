import { createClient } from "@/lib/supabase/server";
import { UI_COMPONENT_TYPES, UI_SCREEN_TYPES } from "@/lib/supabase/types";
import { listRequirements } from "@/lib/requirements/queries";
import { listDecisions } from "@/lib/decisions/queries";
import { listTasksByProject } from "@/lib/tasks/queries";
import { listDependenciesByProject } from "@/lib/tasks/dependencies/queries";
import { listAvailableArtifacts } from "@/lib/tasks/traceability/queries";
import { requirementInputSchema } from "@/lib/validation/requirements";
import { decisionInputSchema } from "@/lib/validation/decisions";
import { domainInputSchema } from "@/lib/validation/domains";
import { entityInputSchema } from "@/lib/validation/entities";
import { attributeInputSchema } from "@/lib/validation/attributes";
import { relationshipInputSchema } from "@/lib/validation/relationships";
import { taskDependencyInputSchema } from "@/lib/validation/tasks";
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
  AiTaskItem,
  AiTaskLinkItem,
  AiUiComponentItem,
  AiUiItem,
  AiUiPlacementItem,
  AiUiScreenItem,
} from "@/lib/ai/schema";
import type {
  ApiHttpMethod,
  ApiParameterDataType,
  ApiParameterLocation,
  ArchitectureComponentType,
  ArchitectureTechnologyCategory,
  EntityDataType,
  Json,
  RelationshipType,
  TaskDependencyType,
  TaskEffort,
  TaskPriority,
  TaskType,
  UiComponentType,
  UiScreenType,
} from "@/lib/supabase/types";
import {
  TASK_EFFORTS,
  TASK_PRIORITIES,
  TASK_TYPES,
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


// Normalised payload handed to the apply_erd_bundle function. Everything here
// has already passed the row builders above, so the SQL can trust the shapes.
type ErdBundleDomain = {
  index: number;
  name: string;
  description: string;
  entities: Array<{
    name: string;
    description: string;
    attributes: Array<{
      name: string;
      data_type: string;
      is_required: boolean;
      is_primary_key: boolean;
      description: string;
    }>;
    relationships: Array<{
      target_entity: string;
      relationship_type: string;
      name: string;
      description: string;
    }>;
  }>;
};

type ErdBundleResult = {
  created?: Array<{ index: number; id: string; title: string }>;
  skipped?: Array<{ index: number; title: string; reason: "duplicate" | "invalid" }>;
};

// Transactional variant: the whole bundle is applied inside a single database
// transaction by apply_erd_bundle, so a failure no longer leaves partial rows.
// Invalid entries become skipped entries rather than aborting the apply.
// Pure transformation from the selected suggestion items into the JSONB
// payload apply_erd_bundle consumes. Invalid entries are recorded as skipped
// results instead of aborting; the returned payload has passed the row
// builders so the SQL can trust every shape.
export function buildErdBundle(
  items: AiErdDomainItem[],
  indices: number[],
): { domains: ErdBundleDomain[]; skipped: ApplyItemOutcome[] } {
  const skipped: ApplyItemOutcome[] = [];

  const chosen = [...new Set(indices)]
    .filter((n) => Number.isInteger(n) && n >= 0 && n < items.length)
    .sort((a, b) => a - b);

  const domains: ErdBundleDomain[] = [];

  for (const index of chosen) {
    const item = items[index];
    if (!item) {
      skipped.push({ kind: "skipped", index, title: "", reason: "invalid" });
      continue;
    }

    const domainRow = buildDomainRow(item);
    if (!domainRow) {
      skipped.push({
        kind: "skipped",
        index,
        title: typeof item.name === "string" ? item.name : "",
        reason: "invalid",
      });
      continue;
    }

    const entities: ErdBundleDomain["entities"] = [];

    for (const entityItem of item.entities) {
      const entityRow = buildEntityRow(entityItem);
      if (!entityRow) {
        skipped.push({
          kind: "skipped",
          index,
          title: `${domainRow.name} / ${entityItem.name}`,
          reason: "invalid",
        });
        continue;
      }

      const attributes: ErdBundleDomain["entities"][number]["attributes"] = [];
      for (const attributeItem of entityItem.attributes) {
        const attributeRow = buildAttributeRow(attributeItem);
        if (!attributeRow) {
          skipped.push({
            kind: "skipped",
            index,
            title: `${domainRow.name} / ${entityRow.name} / ${attributeItem.name}`,
            reason: "invalid",
          });
          continue;
        }
        attributes.push({
          name: attributeRow.name,
          data_type: attributeRow.data_type,
          is_required: attributeRow.is_required,
          is_primary_key: attributeRow.is_primary_key,
          description: attributeRow.description ?? "",
        });
      }

      const relationships: ErdBundleDomain["entities"][number]["relationships"] =
        [];
      for (const relationshipItem of entityItem.relationships) {
        relationships.push({
          target_entity: relationshipItem.target_entity,
          relationship_type: relationshipItem.relationship_type,
          name: relationshipItem.name ?? "",
          description: relationshipItem.description ?? "",
        });
      }

      entities.push({
        name: entityRow.name,
        description: entityRow.description ?? "",
        attributes,
        relationships,
      });
    }

    domains.push({
      index,
      name: domainRow.name,
      description: domainRow.description ?? "",
      entities,
    });
  }

  return { domains, skipped };
}

// Transactional variant: the whole bundle is applied inside a single database
// transaction by apply_erd_bundle, so a failure no longer leaves partial rows.
// Invalid entries become skipped entries rather than aborting the apply.
export async function applyErdBundleToProject(
  options: ApplyErdOptions,
): Promise<ApplySummary> {
  const supabase = await createClient();
  const out: ApplySummary = { created: [], skipped: [], failed: [] };

  const { domains, skipped } = buildErdBundle(options.items, options.indices);
  out.skipped.push(...skipped);

  if (domains.length === 0) {
    return out;
  }

  // The generated Database type declares no functions, so the rpc call is
  // typed through a narrow local cast; the SQL contract lives in the
  // apply_erd_bundle migration.
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { data, error } = await rpc("apply_erd_bundle", {
    p_project_id: options.projectId,
    p_domains: domains,
  });

  if (error) {
    out.failed.push({
      kind: "failed",
      index: -1,
      title: "",
      error: error.message,
    });
    return out;
  }

  const result = (data ?? {}) as ErdBundleResult;

  for (const entry of result.created ?? []) {
    out.created.push({
      kind: "created",
      index: entry.index,
      id: entry.id,
      title: entry.title,
    });
  }
  for (const entry of result.skipped ?? []) {
    out.skipped.push({
      kind: "skipped",
      index: entry.index,
      title: entry.title,
      reason: entry.reason,
    });
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


// Normalised payloads handed to apply_architecture_bundle. Each entry carries
// its original flat index so the SQL can echo it back with created/skipped.
type ArchitectureComponentBundle = {
  index: number;
  name: string;
  type: string;
  description: string;
  depends_on: Array<{ target_component: string; description: string }>;
};
type ArchitectureTechnologyBundle = {
  index: number;
  name: string;
  category: string;
  description: string;
};
type ArchitectureDecisionBundle = {
  index: number;
  title: string;
  context: string;
  decision: string;
  rationale: string;
  status: string;
};

type ArchitectureBundleParts = {
  components: ArchitectureComponentBundle[];
  technologies: ArchitectureTechnologyBundle[];
  decisions: ArchitectureDecisionBundle[];
  skipped: ApplyItemOutcome[];
};

export function buildArchitectureBundle(
  items: AiArchitectureItem[],
  indices: number[],
): ArchitectureBundleParts {
  const chosen = [...new Set(indices)]
    .filter((n) => Number.isInteger(n) && n >= 0 && n < items.length)
    .sort((a, b) => a - b);

  const components: ArchitectureComponentBundle[] = [];
  const technologies: ArchitectureTechnologyBundle[] = [];
  const decisions: ArchitectureDecisionBundle[] = [];
  const skipped: ApplyItemOutcome[] = [];

  for (const index of chosen) {
    const item = items[index];
    if (!item) {
      skipped.push({ kind: "skipped", index, title: "", reason: "invalid" });
      continue;
    }

    if (item.kind === "component") {
      const row = buildArchitectureComponentRow(item);
      if (!row) {
        skipped.push({
          kind: "skipped",
          index,
          title: item.name,
          reason: "invalid",
        });
        continue;
      }
      components.push({
        index,
        name: row.name,
        type: row.type,
        description: row.description ?? "",
        depends_on: item.depends_on.map((dependency) => ({
          target_component: dependency.target_component,
          description: dependency.description ?? "",
        })),
      });
      continue;
    }

    if (item.kind === "technology") {
      const row = buildArchitectureTechnologyRow(item);
      if (!row) {
        skipped.push({
          kind: "skipped",
          index,
          title: item.name,
          reason: "invalid",
        });
        continue;
      }
      technologies.push({
        index,
        name: row.name,
        category: row.category,
        description: row.description ?? "",
      });
      continue;
    }

    const row = buildArchitectureDecisionRow(item);
    if (!row) {
      skipped.push({
        kind: "skipped",
        index,
        title: item.title,
        reason: "invalid",
      });
      continue;
    }
    decisions.push({
      index,
      title: row.title,
      context: row.context ?? "",
      decision: row.decision,
      rationale: row.rationale ?? "",
      status: row.status,
    });
  }

  return { components, technologies, decisions, skipped };
}

// Transactional variant: the whole bundle is applied inside a single database
// transaction by apply_architecture_bundle, so a failure no longer leaves
// partial rows.
export async function applyArchitectureBundleToProject(
  options: ApplyArchitectureOptions,
): Promise<ApplySummary> {
  const supabase = await createClient();
  const out: ApplySummary = { created: [], skipped: [], failed: [] };

  const { components, technologies, decisions, skipped } =
    buildArchitectureBundle(options.items, options.indices);
  out.skipped.push(...skipped);

  if (
    components.length === 0 &&
    technologies.length === 0 &&
    decisions.length === 0
  ) {
    return out;
  }

  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { data, error } = await rpc("apply_architecture_bundle", {
    p_project_id: options.projectId,
    p_components: components,
    p_technologies: technologies,
    p_decisions: decisions,
  });

  if (error) {
    out.failed.push({
      kind: "failed",
      index: -1,
      title: "",
      error: error.message,
    });
    return out;
  }

  const result = (data ?? {}) as ErdBundleResult;

  for (const entry of result.created ?? []) {
    out.created.push({
      kind: "created",
      index: entry.index,
      id: entry.id,
      title: entry.title,
    });
  }
  for (const entry of result.skipped ?? []) {
    out.skipped.push({
      kind: "skipped",
      index: entry.index,
      title: entry.title,
      reason: entry.reason,
    });
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







function toJson(value: unknown): Json | null {
  if (value === null || value === undefined) return null;
  return value as Json;
}


type ApiBundleGroup = {
  index: number;
  name: string;
  prefix: string;
  description: string;
};

type ApiBundleEndpoint = {
  index: number;
  group_name: string;
  name: string;
  method: string;
  path: string;
  summary: string;
  description: string;
  authentication_required: boolean;
  parameters: Array<{
    name: string;
    location: string;
    data_type: string;
    required: boolean;
    description: string;
    example: string;
  }>;
  request_body: {
    content_type: string;
    description: string;
    schema: Json | null;
    example: Json | null;
  } | null;
  responses: Array<{
    status_code: number;
    content_type: string;
    description: string;
    schema: Json | null;
    example: Json | null;
  }>;
  errors: Array<{
    code: string;
    message: string;
    http_status: number | null;
    description: string;
  }>;
  entities: Array<{ entity_name: string; role: string }>;
  requirement_titles: string[];
};

// Pure builder: filters and validates the model output into the JSONB shape the
// apply_api_bundle function consumes. Invalid entries are recorded as skipped.
export function buildApiBundle(
  items: AiApiItem[],
  indices: number[],
): {
  groups: ApiBundleGroup[];
  endpoints: ApiBundleEndpoint[];
  skipped: ApplyItemOutcome[];
} {
  const groups: ApiBundleGroup[] = [];
  const endpoints: ApiBundleEndpoint[] = [];
  const skipped: ApplyItemOutcome[] = [];

  const chosen = [...new Set(indices)]
    .filter((n) => Number.isInteger(n) && n >= 0 && n < items.length)
    .sort((a, b) => a - b);

  for (const index of chosen) {
    const item = items[index];
    if (!item) {
      skipped.push({ kind: "skipped", index, title: "", reason: "invalid" });
      continue;
    }

    if (item.kind === "group") {
      const row = buildApiGroupRow(item);
      if (!row) {
        skipped.push({
          kind: "skipped",
          index,
          title: item.name,
          reason: "invalid",
        });
        continue;
      }
      groups.push({
        index,
        name: row.name,
        prefix: row.prefix ?? "",
        description: row.description ?? "",
      });
      continue;
    }

    const label = `${item.method} ${item.path}`;
    const row = buildApiEndpointRow(item);
    if (!row) {
      skipped.push({ kind: "skipped", index, title: label, reason: "invalid" });
      continue;
    }

    const parameters: ApiBundleEndpoint["parameters"] = [];
    for (const parameterItem of item.parameters) {
      const parameterRow = buildApiParameterRow(parameterItem);
      if (!parameterRow) {
        skipped.push({
          kind: "skipped",
          index,
          title: `${label} → ${parameterItem.name}`,
          reason: "invalid",
        });
        continue;
      }
      parameters.push({
        name: parameterRow.name,
        location: parameterRow.location,
        data_type: parameterRow.data_type,
        required: parameterRow.required,
        description: parameterRow.description ?? "",
        example: parameterRow.example ?? "",
      });
    }

    let requestBody: ApiBundleEndpoint["request_body"] = null;
    if (item.request_body) {
      const bodyRow = buildApiRequestBodyRow(item.request_body);
      if (!bodyRow) {
        skipped.push({
          kind: "skipped",
          index,
          title: `${label} → request body`,
          reason: "invalid",
        });
      } else {
        requestBody = {
          content_type: bodyRow.content_type,
          description: bodyRow.description ?? "",
          schema: bodyRow.schema_definition,
          example: bodyRow.example,
        };
      }
    }

    const responses: ApiBundleEndpoint["responses"] = [];
    for (const responseItem of item.responses) {
      const responseRow = buildApiResponseRow(responseItem);
      if (!responseRow) {
        skipped.push({
          kind: "skipped",
          index,
          title: `${label} → ${responseItem.status_code}`,
          reason: "invalid",
        });
        continue;
      }
      responses.push({
        status_code: responseRow.status_code,
        content_type: responseRow.content_type ?? "",
        description: responseRow.description ?? "",
        schema: responseRow.schema_definition,
        example: responseRow.example,
      });
    }

    const errors: ApiBundleEndpoint["errors"] = [];
    for (const errorItem of item.errors) {
      const errorRow = buildApiErrorRow(errorItem);
      if (!errorRow) {
        skipped.push({
          kind: "skipped",
          index,
          title: `${label} → ${errorItem.code}`,
          reason: "invalid",
        });
        continue;
      }
      errors.push({
        code: errorRow.code,
        message: errorRow.message,
        http_status: errorRow.http_status,
        description: errorRow.description ?? "",
      });
    }

    endpoints.push({
      index,
      group_name: row.group_name,
      name: row.name,
      method: row.method,
      path: row.path,
      summary: row.summary ?? "",
      description: row.description ?? "",
      authentication_required: row.authentication_required,
      parameters,
      request_body: requestBody,
      responses,
      errors,
      entities: item.entities.map((link) => ({
        entity_name: link.entity_name,
        role: link.role,
      })),
      requirement_titles: item.requirement_titles,
    });
  }

  return { groups, endpoints, skipped };
}

export async function applyApiBundleToProject(
  options: ApplyApiOptions,
): Promise<ApplySummary> {
  const supabase = await createClient();
  const out: ApplySummary = { created: [], skipped: [], failed: [] };

  const built = buildApiBundle(options.items, options.indices);
  out.skipped.push(...built.skipped);

  if (built.groups.length === 0 && built.endpoints.length === 0) {
    return out;
  }

  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { data, error } = await rpc("apply_api_bundle", {
    p_project_id: options.projectId,
    p_groups: built.groups,
    p_endpoints: built.endpoints,
  });

  if (error) {
    out.failed.push({
      kind: "failed",
      index: -1,
      title: "",
      error: error.message,
    });
    return out;
  }

  const result = (data ?? {}) as ErdBundleResult;

  for (const entry of result.created ?? []) {
    out.created.push({
      kind: "created",
      index: entry.index,
      id: entry.id,
      title: entry.title,
    });
  }
  for (const entry of result.skipped ?? []) {
    out.skipped.push({
      kind: "skipped",
      index: entry.index,
      title: entry.title,
      reason: entry.reason,
    });
  }

  return out;
}

export type ApplyUiOptions = {
  projectId: string;
  userId: string;
  items: AiUiItem[];
  indices: number[];
};

export type UiScreenRow = {
  name: string;
  route: string | null;
  screen_type: UiScreenType;
  description: string | null;
  purpose: string | null;
  authentication_required: boolean;
};

export type UiComponentRow = {
  name: string;
  component_type: UiComponentType;
  description: string | null;
  purpose: string | null;
  technology: string | null;
};

export type UiPlacementRow = {
  screen_id: string;
  component_id: string;
  parent_id: string | null;
  label: string | null;
  description: string | null;
  required: boolean;
};

export function buildUiScreenRow(item: AiUiScreenItem): UiScreenRow | null {
  if (!UI_SCREEN_TYPES.includes(item.screen_type)) return null;
  const name = item.name.trim();
  if (name.length < 1 || name.length > 200) return null;
  const route = item.route.trim();
  if (route.length > 500) return null;
  const description = item.description.trim();
  if (description.length > 5000) return null;
  const purpose = item.purpose.trim();
  if (purpose.length > 2000) return null;
  return {
    name,
    route: optionalText(route),
    screen_type: item.screen_type,
    description: optionalText(description),
    purpose: optionalText(purpose),
    authentication_required: item.authentication_required,
  };
}

export function buildUiComponentRow(
  item: AiUiComponentItem,
): UiComponentRow | null {
  if (!UI_COMPONENT_TYPES.includes(item.component_type)) return null;
  const name = item.name.trim();
  if (name.length < 1 || name.length > 200) return null;
  const description = item.description.trim();
  if (description.length > 5000) return null;
  const purpose = item.purpose.trim();
  if (purpose.length > 2000) return null;
  const technology = item.technology.trim();
  if (technology.length > 200) return null;
  return {
    name,
    component_type: item.component_type,
    description: optionalText(description),
    purpose: optionalText(purpose),
    technology: optionalText(technology),
  };
}

export function buildUiPlacementRow(
  item: AiUiPlacementItem,
  screenId: string,
  componentId: string,
  parentId: string | null,
): UiPlacementRow | null {
  const label = item.label.trim();
  if (label.length > 200) return null;
  const description = item.description.trim();
  if (description.length > 5000) return null;
  if (label.length === 0 && description.length === 0) return null;
  return {
    screen_id: screenId,
    component_id: componentId,
    parent_id: parentId,
    label: optionalText(label),
    description: optionalText(description),
    required: item.required,
  };
}

export function uiComponentDedupeKey(name: string): string {
  return name.trim().toLowerCase();
}

export function uiScreenDedupeKey(name: string): string {
  return name.trim().toLowerCase();
}

export function uiScreenComponentDedupeKey(
  screenId: string,
  componentId: string,
  label: string,
): string {
  return `${screenId}|${componentId}|${label.trim().toLowerCase()}`;
}

export function uiScreenEntityLinkDedupeKey(
  screenId: string,
  entityId: string,
  role: string,
): string {
  return `${screenId}|${entityId}|${role}`;
}

export function uiScreenRequirementLinkDedupeKey(
  screenId: string,
  requirementId: string,
): string {
  return `${screenId}|${requirementId}`;
}

type UiBundleComponent = {
  index: number;
  name: string;
  component_type: string;
  description: string;
  purpose: string;
  technology: string;
};

type UiBundleScreen = {
  index: number;
  name: string;
  route: string;
  screen_type: string;
  description: string;
  purpose: string;
  authentication_required: boolean;
  placements: Array<{
    component_name: string;
    label: string;
    description: string;
    required: boolean;
    parent_label: string;
  }>;
  entities: Array<{ entity_name: string; role: string }>;
  requirement_titles: string[];
};

export type UiBundleParts = {
  components: UiBundleComponent[];
  screens: UiBundleScreen[];
  skipped: ApplyItemOutcome[];
};

export function buildUiBundle(
  items: AiUiItem[],
  indices: number[],
): UiBundleParts {
  const skipped: ApplyItemOutcome[] = [];
  const components: UiBundleComponent[] = [];
  const screens: UiBundleScreen[] = [];

  const chosen = [...new Set(indices)]
    .filter((n) => Number.isInteger(n) && n >= 0 && n < items.length)
    .sort((a, b) => a - b);

  for (const index of chosen) {
    const item = items[index];
    if (!item) {
      skipped.push({ kind: "skipped", index, title: "", reason: "invalid" });
      continue;
    }

    if (item.kind === "component") {
      const row = buildUiComponentRow(item);
      if (!row) {
        skipped.push({
          kind: "skipped",
          index,
          title: item.name,
          reason: "invalid",
        });
        continue;
      }
      components.push({
        index,
        name: row.name,
        component_type: row.component_type,
        description: row.description ?? "",
        purpose: row.purpose ?? "",
        technology: row.technology ?? "",
      });
      continue;
    }

    const row = buildUiScreenRow(item);
    if (!row) {
      skipped.push({
        kind: "skipped",
        index,
        title: item.name,
        reason: "invalid",
      });
      continue;
    }

    const placements = item.placements.map((placement) => ({
      component_name: placement.component_name,
      label: placement.label ?? "",
      description: placement.description ?? "",
      required: placement.required,
      parent_label: placement.parent_label ?? "",
    }));

    screens.push({
      index,
      name: row.name,
      route: row.route ?? "",
      screen_type: row.screen_type,
      description: row.description ?? "",
      purpose: row.purpose ?? "",
      authentication_required: row.authentication_required,
      placements,
      entities: item.entities.map((link) => ({
        entity_name: link.entity_name,
        role: link.role,
      })),
      requirement_titles: item.requirement_titles,
    });
  }

  return { components, screens, skipped };
}

// Transactional variant: components, screens, placements, and links are all
// applied inside a single database transaction by apply_ui_bundle.
export async function applyUiBundleToProject(
  options: ApplyUiOptions,
): Promise<ApplySummary> {
  const supabase = await createClient();
  const out: ApplySummary = { created: [], skipped: [], failed: [] };

  const { components, screens, skipped } = buildUiBundle(
    options.items,
    options.indices,
  );
  out.skipped.push(...skipped);

  if (components.length === 0 && screens.length === 0) {
    return out;
  }

  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { data, error } = await rpc("apply_ui_bundle", {
    p_project_id: options.projectId,
    p_components: components,
    p_screens: screens,
  });

  if (error) {
    out.failed.push({
      kind: "failed",
      index: -1,
      title: "",
      error: error.message,
    });
    return out;
  }

  const result = (data ?? {}) as ErdBundleResult;

  for (const entry of result.created ?? []) {
    out.created.push({
      kind: "created",
      index: entry.index,
      id: entry.id,
      title: entry.title,
    });
  }
  for (const entry of result.skipped ?? []) {
    out.skipped.push({
      kind: "skipped",
      index: entry.index,
      title: entry.title,
      reason: entry.reason,
    });
  }

  return out;
}

export type ApplyTasksOptions = {
  projectId: string;
  userId: string;
  items: AiTaskItem[];
  indices: number[];
};

export type TaskRow = {
  title: string;
  task_type: TaskType;
  priority: TaskPriority;
  estimated_effort: TaskEffort | null;
  description: string | null;
  acceptance_criteria: string | null;
  implementation_notes: string | null;
};

export type TaskDependencyRow = {
  task_id: string;
  depends_on_task_id: string;
  dependency_type: TaskDependencyType;
  description: string | null;
};

export function buildTaskRow(item: AiTaskItem): TaskRow | null {
  const title = item.title.trim();
  if (title.length < 1 || title.length > 200) return null;
  if (!TASK_TYPES.includes(item.task_type)) return null;
  if (!TASK_PRIORITIES.includes(item.priority)) return null;
  const estimatedEffort = item.estimated_effort ?? null;
  if (estimatedEffort !== null && !TASK_EFFORTS.includes(estimatedEffort)) {
    return null;
  }
  const description = item.description.trim();
  if (description.length > 5000) return null;
  const acceptanceCriteria = item.acceptance_criteria.trim();
  if (acceptanceCriteria.length > 10000) return null;
  const implementationNotes = item.implementation_notes.trim();
  if (implementationNotes.length > 10000) return null;

  return {
    title,
    task_type: item.task_type,
    priority: item.priority,
    estimated_effort: estimatedEffort,
    description: optionalText(description),
    acceptance_criteria: optionalText(acceptanceCriteria),
    implementation_notes: optionalText(implementationNotes),
  };
}

export function buildTaskDependencyRow(
  taskId: string,
  dependsOnTaskId: string,
  description: string,
): TaskDependencyRow | null {
  const parsed = taskDependencyInputSchema.safeParse({
    depends_on_task_id: dependsOnTaskId,
    dependency_type: "blocks",
    description,
  });
  if (!parsed.success) return null;
  if (parsed.data.depends_on_task_id === taskId) return null;

  return {
    task_id: taskId,
    depends_on_task_id: parsed.data.depends_on_task_id,
    dependency_type: "blocks",
    description: optionalText(parsed.data.description ?? ""),
  };
}

export function taskDependencyDedupeKey(
  taskId: string,
  dependsOnTaskId: string,
): string {
  return `${taskId}|${dependsOnTaskId}`;
}

type TaskArtifactIndex = {
  requirementIdByTitle: Map<string, string>;
  decisionIdByTitle: Map<string, string>;
  entityIdByName: Map<string, string>;
  componentIdByName: Map<string, string>;
  endpointIdByLabel: Map<string, string>;
  screenIdByName: Map<string, string>;
};

type TaskLinkTarget = {
  table: string;
  column: string;
  id: string;
};

function resolveTaskLink(
  link: AiTaskLinkItem,
  index: TaskArtifactIndex,
  endpointIdByLabel: Map<string, string>,
): TaskLinkTarget | null {
  const key = link.name.trim().toLowerCase();
  if (!key) return null;

  if (link.kind === "requirement") {
    const id = index.requirementIdByTitle.get(key);
    return id ? { table: "task_requirements", column: "requirement_id", id } : null;
  }
  if (link.kind === "decision") {
    const id = index.decisionIdByTitle.get(key);
    return id ? { table: "task_decisions", column: "decision_id", id } : null;
  }
  if (link.kind === "entity") {
    const id = index.entityIdByName.get(key);
    return id ? { table: "task_domains", column: "entity_id", id } : null;
  }
  if (link.kind === "component") {
    const id = index.componentIdByName.get(key);
    return id
      ? { table: "task_architecture_components", column: "component_id", id }
      : null;
  }
  if (link.kind === "endpoint") {
    const id = endpointIdByLabel.get(key);
    return id ? { table: "task_api_endpoints", column: "endpoint_id", id } : null;
  }
  const id = index.screenIdByName.get(key);
  return id ? { table: "task_ui_screens", column: "screen_id", id } : null;
}

export async function applyTasksToProject(
  options: ApplyTasksOptions,
): Promise<ApplySummary> {
  const supabase = await createClient();
  const out: ApplySummary = { created: [], skipped: [], failed: [] };

  const chosen = [...new Set(options.indices)]
    .filter((n) => Number.isInteger(n) && n >= 0 && n < options.items.length)
    .sort((a, b) => a - b);

  const [existingTasks, existingDependencies, artifacts] = await Promise.all([
    listTasksByProject({ projectId: options.projectId }),
    listDependenciesByProject({ projectId: options.projectId }),
    listAvailableArtifacts(options.projectId),
  ]);

  const taskIdByTitle = new Map<string, string>();
  let position = existingTasks.reduce(
    (max, task) => Math.max(max, task.position),
    -1,
  );
  position += 1;
  for (const task of existingTasks) {
    const key = task.title.trim().toLowerCase();
    if (!taskIdByTitle.has(key)) taskIdByTitle.set(key, task.id);
  }

  const dependencyKeys = new Set(
    existingDependencies.map((dependency) =>
      taskDependencyDedupeKey(
        dependency.task_id,
        dependency.depends_on_task_id,
      ),
    ),
  );

  const index: TaskArtifactIndex = {
    requirementIdByTitle: new Map(
      artifacts.requirements.map((row) => [row.title.trim().toLowerCase(), row.id]),
    ),
    decisionIdByTitle: new Map(
      artifacts.decisions.map((row) => [row.title.trim().toLowerCase(), row.id]),
    ),
    entityIdByName: new Map(
      artifacts.entities.map((row) => [row.name.trim().toLowerCase(), row.id]),
    ),
    componentIdByName: new Map(
      artifacts.architectureComponents.map((row) => [
        row.name.trim().toLowerCase(),
        row.id,
      ]),
    ),
    endpointIdByLabel: new Map(
      artifacts.apiEndpoints.map((row) => [
        `${row.method} ${row.path}`.trim().toLowerCase(),
        row.id,
      ]),
    ),
    screenIdByName: new Map(
      artifacts.uiScreens.map((row) => [row.name.trim().toLowerCase(), row.id]),
    ),
  };

  const createdByIndex = new Map<number, string>();
  const parentIndexByTaskIndex = new Map<number, number>();
  const dependencyQueue: Array<{ index: number; taskId: string; targetTitle: string }> =
    [];
  const linkQueue: Array<{ index: number; taskId: string; label: string; link: AiTaskLinkItem }> =
    [];
  const pendingParentUpdates: Array<{ index: number; taskId: string; parentTitle: string }> =
    [];

  const titleIndex = new Map<string, number>();
  for (const index of chosen) {
    const item = options.items[index];
    if (item) titleIndex.set(item.title.trim().toLowerCase(), index);
  }

  for (const index of chosen) {
    const item = options.items[index];
    if (!item) {
      out.skipped.push({ kind: "skipped", index, title: "", reason: "invalid" });
      continue;
    }

    const row = buildTaskRow(item);
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
    if (taskIdByTitle.has(key)) {
      const existingId = taskIdByTitle.get(key);
      if (existingId) createdByIndex.set(index, existingId);
      out.skipped.push({
        kind: "skipped",
        index,
        title: row.title,
        reason: "duplicate",
      });
    } else {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          project_id: options.projectId,
          title: row.title,
          description: row.description,
          task_type: row.task_type,
          status: "todo",
          priority: row.priority,
          estimated_effort: row.estimated_effort,
          acceptance_criteria: row.acceptance_criteria,
          implementation_notes: row.implementation_notes,
          position,
        })
        .select("id, title")
        .single();

      if (error || !data) {
        out.failed.push({
          kind: "failed",
          index,
          title: row.title,
          error: error?.message ?? "Could not insert task.",
        });
        continue;
      }

      taskIdByTitle.set(key, data.id);
      createdByIndex.set(index, data.id);
      position += 1;
      out.created.push({ kind: "created", index, id: data.id, title: data.title });
    }

    const parentTitle = item.parent_title.trim();
    if (parentTitle) {
      const parentKey = parentTitle.toLowerCase();
      const inlineIndex = titleIndex.get(parentKey);
      if (inlineIndex === undefined) {
        const existingParentId = taskIdByTitle.get(parentKey);
        if (existingParentId) {
          pendingParentUpdates.push({
            index,
            taskId: taskIdByTitle.get(key) ?? "",
            parentTitle,
          });
        }
      } else if (inlineIndex !== index) {
        parentIndexByTaskIndex.set(index, inlineIndex);
      }
    }

    for (const targetTitle of item.depends_on) {
      dependencyQueue.push({
        index,
        taskId: taskIdByTitle.get(key) ?? "",
        targetTitle,
      });
    }

    for (const link of item.links) {
      linkQueue.push({ index, taskId: taskIdByTitle.get(key) ?? "", label: link.name, link });
    }
  }

  for (const [childIndex, parentIndex] of parentIndexByTaskIndex) {
    const childId = createdByIndex.get(childIndex);
    const parentId = createdByIndex.get(parentIndex);
    if (!childId || !parentId || childId === parentId) {
      if (childId) {
        out.skipped.push({
          kind: "skipped",
          index: childIndex,
          title: "parent task",
          reason: "invalid",
        });
      }
      continue;
    }

    const { error } = await supabase
      .from("tasks")
      .update({ parent_task_id: parentId })
      .eq("id", childId);

    if (error) {
      out.failed.push({
        kind: "failed",
        index: childIndex,
        title: "parent task",
        error: error.message,
      });
    }
  }

  for (const entry of pendingParentUpdates) {
    if (!entry.taskId) continue;
    const parentId = taskIdByTitle.get(entry.parentTitle.toLowerCase());
    if (!parentId || parentId === entry.taskId) continue;

    const { error } = await supabase
      .from("tasks")
      .update({ parent_task_id: parentId })
      .eq("id", entry.taskId);

    if (error) {
      out.failed.push({
        kind: "failed",
        index: entry.index,
        title: "parent task",
        error: error.message,
      });
    }
  }

  for (const entry of dependencyQueue) {
    const label = `${options.items[entry.index]?.title ?? ""} → ${entry.targetTitle}`;
    if (!entry.taskId) continue;

    const targetId = taskIdByTitle.get(entry.targetTitle.trim().toLowerCase());
    if (!targetId || targetId === entry.taskId) {
      out.skipped.push({
        kind: "skipped",
        index: entry.index,
        title: label,
        reason: "invalid",
      });
      continue;
    }

    const row = buildTaskDependencyRow(entry.taskId, targetId, "");
    if (!row) {
      out.skipped.push({
        kind: "skipped",
        index: entry.index,
        title: label,
        reason: "invalid",
      });
      continue;
    }

    const key = taskDependencyDedupeKey(row.task_id, row.depends_on_task_id);
    if (dependencyKeys.has(key)) {
      out.skipped.push({
        kind: "skipped",
        index: entry.index,
        title: label,
        reason: "duplicate",
      });
      continue;
    }

    const { error } = await supabase.from("task_dependencies").insert({
      project_id: options.projectId,
      task_id: row.task_id,
      depends_on_task_id: row.depends_on_task_id,
      dependency_type: row.dependency_type,
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

  for (const entry of linkQueue) {
    if (!entry.taskId) continue;
    const label = `${options.items[entry.index]?.title ?? ""} → ${entry.label}`;

    const target = resolveTaskLink(entry.link, index, index.endpointIdByLabel);
    if (!target) {
      out.skipped.push({
        kind: "skipped",
        index: entry.index,
        title: label,
        reason: "invalid",
      });
      continue;
    }

    const linkInsert = {
      task_id: entry.taskId,
      [target.column]: target.id,
    };
    // The link tables are addressed dynamically, so the client's generated
    // insert types cannot be resolved statically here.
    const linksTable = supabase.from(
      target.table as "task_requirements",
    ) as unknown as {
      insert: (row: typeof linkInsert) => Promise<{ error: { code?: string; message: string } | null }>;
    };
    const { error } = await linksTable.insert(linkInsert);

    if (error) {
      if (error.code === "23505") {
        out.skipped.push({
          kind: "skipped",
          index: entry.index,
          title: label,
          reason: "duplicate",
        });
        continue;
      }
      out.failed.push({
        kind: "failed",
        index: entry.index,
        title: label,
        error: error.message,
      });
      continue;
    }
  }

  return out;
}
