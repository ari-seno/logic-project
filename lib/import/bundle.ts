import { randomUUID } from "node:crypto";

import { BUNDLE_FORMAT } from "@/lib/export/bundle-json";
import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

export interface ImportBundle {
  project: Row;
  requirements: Row[];
  decisions: Row[];
  domains: Row[];
  entities: Row[];
  attributes: Row[];
  relationships: Row[];
  architecture: {
    components: Row[];
    technologies: Row[];
    decisions: Row[];
    dependencies: Row[];
  };
  api: {
    groups: Row[];
    endpoints: Row[];
    parameters: Row[];
    requestBodies: Row[];
    responses: Row[];
    errors: Row[];
    endpointEntities: Row[];
    endpointRequirements: Row[];
  };
  ui: {
    screens: Row[];
    components: Row[];
    screenComponents: Row[];
    forms: Row[];
    formFields: Row[];
    states: Row[];
    interactions: Row[];
    interactionEndpoints: Row[];
    screenRequirements: Row[];
    screenEntities: Row[];
    navigation: Row[];
  };
  tasks: Row[];
  taskDependencies: Row[];
  taskLinks: {
    requirements: Row[];
    decisions: Row[];
    domains: Row[];
    architectureComponents: Row[];
    apiEndpoints: Row[];
    uiScreens: Row[];
  };
}

export interface ImportBundleSuccess {
  ok: true;
  projectId: string;
  counts: Record<string, number>;
}

export interface ImportBundleFailure {
  ok: false;
  error: string;
}

export type ImportBundleOutcome = ImportBundleSuccess | ImportBundleFailure;

function isRecord(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function asId(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Accepts the `logic-project/bundle` envelope produced by
 * `serializeBundleJson` and tolerates a bare bundle object too. Anything that
 * is not shaped like a bundle is rejected with a readable message.
 */
export function parseImportBundle(
  raw: unknown,
): { ok: true; bundle: ImportBundle } | ImportBundleFailure {
  if (!isRecord(raw)) {
    return { ok: false, error: "That file is not a JSON object." };
  }

  if (typeof raw.format === "string" && raw.format !== BUNDLE_FORMAT) {
    return {
      ok: false,
      error: `Unsupported bundle format "${raw.format}". Export a project bundle first.`,
    };
  }

  const candidate = isRecord(raw.bundle) ? raw.bundle : raw;

  if (!isRecord(candidate.project)) {
    return { ok: false, error: 'The bundle is missing its "project" section.' };
  }

  const name = candidate.project.name;
  if (typeof name !== "string" || name.trim().length === 0) {
    return { ok: false, error: "The bundle's project has no name." };
  }

  const architecture = isRecord(candidate.architecture) ? candidate.architecture : {};
  const api = isRecord(candidate.api) ? candidate.api : {};
  const ui = isRecord(candidate.ui) ? candidate.ui : {};
  const taskLinks = isRecord(candidate.taskLinks) ? candidate.taskLinks : {};

  return {
    ok: true,
    bundle: {
      project: candidate.project,
      requirements: asArray(candidate.requirements),
      decisions: asArray(candidate.decisions),
      domains: asArray(candidate.domains),
      entities: asArray(candidate.entities),
      attributes: asArray(candidate.attributes),
      relationships: asArray(candidate.relationships),
      architecture: {
        components: asArray(architecture.components),
        technologies: asArray(architecture.technologies),
        decisions: asArray(architecture.decisions),
        dependencies: asArray(architecture.dependencies),
      },
      api: {
        groups: asArray(api.groups),
        endpoints: asArray(api.endpoints),
        parameters: asArray(api.parameters),
        requestBodies: asArray(api.requestBodies),
        responses: asArray(api.responses),
        errors: asArray(api.errors),
        endpointEntities: asArray(api.endpointEntities),
        endpointRequirements: asArray(api.endpointRequirements),
      },
      ui: {
        screens: asArray(ui.screens),
        components: asArray(ui.components),
        screenComponents: asArray(ui.screenComponents),
        forms: asArray(ui.forms),
        formFields: asArray(ui.formFields),
        states: asArray(ui.states),
        interactions: asArray(ui.interactions),
        interactionEndpoints: asArray(ui.interactionEndpoints),
        screenRequirements: asArray(ui.screenRequirements),
        screenEntities: asArray(ui.screenEntities),
        navigation: asArray(ui.navigation),
      },
      tasks: asArray(candidate.tasks),
      taskDependencies: asArray(candidate.taskDependencies),
      taskLinks: {
        requirements: asArray(taskLinks.requirements),
        decisions: asArray(taskLinks.decisions),
        domains: asArray(taskLinks.domains),
        architectureComponents: asArray(taskLinks.architectureComponents),
        apiEndpoints: asArray(taskLinks.apiEndpoints),
        uiScreens: asArray(taskLinks.uiScreens),
      },
    },
  };
}

const DROPPED_COLUMNS = new Set(["id", "created_at", "updated_at"]);

/**
 * Columns that only exist on the export's joined rows, not on the table. They
 * are dropped so the insert payload matches the real schema.
 */
const JOIN_ONLY_COLUMNS: Record<string, string[]> = {
  api_endpoint_entities: ["domain_id", "domain_name", "entity_name"],
};

type IdMap = Map<string, string>;

interface InsertContext {
  supabase: SupabaseServerClient;
  counts: Record<string, number>;
}

/**
 * Inserts rows with freshly generated ids (so the same bundle can be imported
 * many times) and records the old-id -> new-id mapping for child rows. Foreign
 * keys are resolved through the maps built by earlier inserts.
 */
async function insertRows(
  ctx: InsertContext,
  table: string,
  rows: Row[],
  map: IdMap,
  patch: (row: Row) => Row,
): Promise<void> {
  if (rows.length === 0) return;

  const omit = new Set([...DROPPED_COLUMNS, ...(JOIN_ONLY_COLUMNS[table] ?? [])]);

  const payload = rows.map((row) => {
    const newId = randomUUID();
    const oldId = asId(row.id);
    if (oldId) map.set(oldId, newId);

    const out: Row = { id: newId };
    for (const [key, value] of Object.entries(row)) {
      if (omit.has(key)) continue;
      out[key] = value;
    }
    return { ...out, ...patch(row) };
  });

  const client = ctx.supabase.from(table as "domains") as unknown as {
    insert: (values: Row[]) => Promise<{ error: { message: string } | null }>;
  };
  const { error } = await client.insert(payload);
  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }

  ctx.counts[table] = (ctx.counts[table] ?? 0) + payload.length;
}

function mapped(map: IdMap, value: unknown): string | null {
  const id = asId(value);
  if (!id) return null;
  return map.get(id) ?? null;
}

async function linkParents(
  supabase: SupabaseServerClient,
  table: string,
  pairs: Array<{ id: string; parentId: string }>,
): Promise<void> {
  const client = supabase.from(table as "ui_screen_components") as unknown as {
    update: (values: Row) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
  };

  for (const pair of pairs) {
    const { error } = await client
      .update({ parent_id: pair.parentId })
      .eq("id", pair.id);
    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }
  }
}

async function writeBundle(
  supabase: SupabaseServerClient,
  projectId: string,
  bundle: ImportBundle,
): Promise<Record<string, number>> {
  const ctx: InsertContext = { supabase, counts: {} };

  const requirements: IdMap = new Map();
  const decisions: IdMap = new Map();
  const domains: IdMap = new Map();
  const entities: IdMap = new Map();
  const components: IdMap = new Map();
  const apiGroups: IdMap = new Map();
  const endpoints: IdMap = new Map();
  const screens: IdMap = new Map();
  const uiComponents: IdMap = new Map();
  const screenComponents: IdMap = new Map();
  const forms: IdMap = new Map();
  const interactions: IdMap = new Map();
  const tasks: IdMap = new Map();
  const navigation: IdMap = new Map();

  const withProject = () => ({ project_id: projectId });

  await insertRows(ctx, "requirements", bundle.requirements, requirements, withProject);
  await insertRows(ctx, "decisions", bundle.decisions, decisions, withProject);

  await insertRows(ctx, "domains", bundle.domains, domains, withProject);
  await insertRows(ctx, "entities", bundle.entities, entities, (row) => ({
    domain_id: mapped(domains, row.domain_id),
  }));
  await insertRows(ctx, "entity_attributes", bundle.attributes, new Map(), (row) => ({
    entity_id: mapped(entities, row.entity_id),
  }));
  await insertRows(ctx, "entity_relationships", bundle.relationships, new Map(), (row) => ({
    ...withProject(),
    source_entity_id: mapped(entities, row.source_entity_id),
    target_entity_id: mapped(entities, row.target_entity_id),
  }));

  await insertRows(
    ctx,
    "architecture_components",
    bundle.architecture.components,
    components,
    withProject,
  );
  await insertRows(
    ctx,
    "architecture_technologies",
    bundle.architecture.technologies,
    new Map(),
    withProject,
  );
  await insertRows(
    ctx,
    "architecture_decisions",
    bundle.architecture.decisions,
    new Map(),
    withProject,
  );
  await insertRows(
    ctx,
    "architecture_component_dependencies",
    bundle.architecture.dependencies,
    new Map(),
    (row) => ({
      ...withProject(),
      source_component_id: mapped(components, row.source_component_id),
      target_component_id: mapped(components, row.target_component_id),
    }),
  );

  await insertRows(ctx, "api_groups", bundle.api.groups, apiGroups, withProject);
  await insertRows(ctx, "api_endpoints", bundle.api.endpoints, endpoints, (row) => ({
    ...withProject(),
    group_id: mapped(apiGroups, row.group_id),
  }));
  await insertRows(ctx, "api_parameters", bundle.api.parameters, new Map(), (row) => ({
    endpoint_id: mapped(endpoints, row.endpoint_id),
  }));
  await insertRows(ctx, "api_request_bodies", bundle.api.requestBodies, new Map(), (row) => ({
    endpoint_id: mapped(endpoints, row.endpoint_id),
  }));
  await insertRows(ctx, "api_responses", bundle.api.responses, new Map(), (row) => ({
    endpoint_id: mapped(endpoints, row.endpoint_id),
  }));
  await insertRows(ctx, "api_errors", bundle.api.errors, new Map(), (row) => ({
    endpoint_id: mapped(endpoints, row.endpoint_id),
  }));
  await insertRows(
    ctx,
    "api_endpoint_entities",
    bundle.api.endpointEntities,
    new Map(),
    (row) => ({
      endpoint_id: mapped(endpoints, row.endpoint_id),
      entity_id: mapped(entities, row.entity_id),
    }),
  );
  await insertRows(
    ctx,
    "api_endpoint_requirements",
    bundle.api.endpointRequirements,
    new Map(),
    (row) => ({
      endpoint_id: mapped(endpoints, row.endpoint_id),
      requirement_id: mapped(requirements, row.requirement_id),
    }),
  );

  await insertRows(ctx, "ui_screens", bundle.ui.screens, screens, withProject);
  await insertRows(
    ctx,
    "ui_components",
    bundle.ui.components,
    uiComponents,
    withProject,
  );
  await insertRows(
    ctx,
    "ui_screen_components",
    bundle.ui.screenComponents,
    screenComponents,
    (row) => ({
      screen_id: mapped(screens, row.screen_id),
      component_id: mapped(uiComponents, row.component_id),
      parent_id: null,
    }),
  );
  await insertRows(ctx, "ui_forms", bundle.ui.forms, forms, (row) => ({
    screen_id: mapped(screens, row.screen_id),
  }));
  await insertRows(ctx, "ui_form_fields", bundle.ui.formFields, new Map(), (row) => ({
    form_id: mapped(forms, row.form_id),
  }));
  await insertRows(ctx, "ui_states", bundle.ui.states, new Map(), (row) => ({
    screen_id: mapped(screens, row.screen_id),
  }));
  await insertRows(ctx, "ui_interactions", bundle.ui.interactions, interactions, (row) => ({
    screen_id: mapped(screens, row.screen_id),
  }));
  await insertRows(
    ctx,
    "ui_interaction_endpoints",
    bundle.ui.interactionEndpoints,
    new Map(),
    (row) => ({
      interaction_id: mapped(interactions, row.interaction_id),
      endpoint_id: mapped(endpoints, row.endpoint_id),
    }),
  );
  await insertRows(
    ctx,
    "ui_screen_requirements",
    bundle.ui.screenRequirements,
    new Map(),
    (row) => ({
      screen_id: mapped(screens, row.screen_id),
      requirement_id: mapped(requirements, row.requirement_id),
    }),
  );
  await insertRows(
    ctx,
    "ui_screen_entities",
    bundle.ui.screenEntities,
    new Map(),
    (row) => ({
      screen_id: mapped(screens, row.screen_id),
      entity_id: mapped(entities, row.entity_id),
    }),
  );
  await insertRows(
    ctx,
    "ui_navigation_items",
    bundle.ui.navigation,
    navigation,
    () => ({ ...withProject(), parent_id: null }),
  );

  await insertRows(ctx, "tasks", bundle.tasks, tasks, () => ({
    ...withProject(),
    parent_task_id: null,
  }));
  await insertRows(
    ctx,
    "task_dependencies",
    bundle.taskDependencies,
    new Map(),
    (row) => ({
      ...withProject(),
      task_id: mapped(tasks, row.task_id),
      depends_on_task_id: mapped(tasks, row.depends_on_task_id),
    }),
  );
  await insertRows(
    ctx,
    "task_requirements",
    bundle.taskLinks.requirements,
    new Map(),
    (row) => ({
      task_id: mapped(tasks, row.task_id),
      requirement_id: mapped(requirements, row.requirement_id),
    }),
  );
  await insertRows(ctx, "task_decisions", bundle.taskLinks.decisions, new Map(), (row) => ({
    task_id: mapped(tasks, row.task_id),
    decision_id: mapped(decisions, row.decision_id),
  }));
  await insertRows(ctx, "task_domains", bundle.taskLinks.domains, new Map(), (row) => ({
    task_id: mapped(tasks, row.task_id),
    entity_id: mapped(entities, row.entity_id),
  }));
  await insertRows(
    ctx,
    "task_architecture_components",
    bundle.taskLinks.architectureComponents,
    new Map(),
    (row) => ({
      task_id: mapped(tasks, row.task_id),
      component_id: mapped(components, row.component_id),
    }),
  );
  await insertRows(
    ctx,
    "task_api_endpoints",
    bundle.taskLinks.apiEndpoints,
    new Map(),
    (row) => ({
      task_id: mapped(tasks, row.task_id),
      endpoint_id: mapped(endpoints, row.endpoint_id),
    }),
  );
  await insertRows(
    ctx,
    "task_ui_screens",
    bundle.taskLinks.uiScreens,
    new Map(),
    (row) => ({
      task_id: mapped(tasks, row.task_id),
      screen_id: mapped(screens, row.screen_id),
    }),
  );

  // Nesting has to wait until every sibling exists.
  await linkParents(
    supabase,
    "ui_screen_components",
    bundle.ui.screenComponents.flatMap((row) => {
      const id = mapped(screenComponents, row.id);
      const parentId = mapped(screenComponents, row.parent_id);
      return id && parentId ? [{ id, parentId }] : [];
    }),
  );
  await linkParents(
    supabase,
    "ui_navigation_items",
    bundle.ui.navigation.flatMap((row) => {
      const id = mapped(navigation, row.id);
      const parentId = mapped(navigation, row.parent_id);
      return id && parentId ? [{ id, parentId }] : [];
    }),
  );
  await linkParents(
    supabase,
    "tasks",
    bundle.tasks.flatMap((row) => {
      const id = mapped(tasks, row.id);
      const parentId = mapped(tasks, row.parent_task_id);
      return id && parentId ? [{ id, parentId }] : [];
    }),
  );

  return ctx.counts;
}

/**
 * Imports a bundle as a brand new project owned by `ownerId`. Every id is
 * regenerated so the same file can be imported repeatedly. If any insert fails
 * the whole project is deleted, which cascades to every row we created.
 */
export async function importProjectBundle(
  raw: unknown,
  ownerId: string,
  options: { nameSuffix?: string } = {},
): Promise<ImportBundleOutcome> {
  const parsed = parseImportBundle(raw);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const nameSuffix = options.nameSuffix ?? " (imported)";

  const { data: created, error: projectError } = await supabase
    .from("projects")
    .insert({
      owner_id: ownerId,
      name: `${parsed.bundle.project.name}${nameSuffix}`.slice(0, 200),
      description:
        typeof parsed.bundle.project.description === "string"
          ? parsed.bundle.project.description
          : null,
    })
    .select("id")
    .single();

  if (projectError || !created) {
    return {
      ok: false,
      error: projectError?.message ?? "Could not create the imported project.",
    };
  }

  try {
    const counts = await writeBundle(supabase, created.id, parsed.bundle);
    return { ok: true, projectId: created.id, counts };
  } catch (cause) {
    await supabase.from("projects").delete().eq("id", created.id);
    return {
      ok: false,
      error: cause instanceof Error ? cause.message : "The import failed.",
    };
  }
}
