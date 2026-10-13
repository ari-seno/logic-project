import { createClient } from "@/lib/supabase/server";
import { UI_COMPONENT_TYPES, UI_SCREEN_TYPES } from "@/lib/supabase/types";
import type { UiComponentType, UiScreenType } from "@/lib/supabase/types";
import type {
  AiUiComponentItem,
  AiUiItem,
  AiUiPlacementItem,
  AiUiScreenItem,
} from "@/lib/ai/schema";
import type {
  ApplyItemOutcome,
  ApplySummary,
  ErdBundleResult,
} from "./shared";
import { optionalText } from "./shared";

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

  const rpc = supabase.rpc.bind(supabase) as unknown as (
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
