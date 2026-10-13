import { createClient } from "@/lib/supabase/server";
import { UI_FIELD_TYPES, UI_STATE_TYPES } from "@/lib/supabase/types";
import type { UiFieldType, UiStateType } from "@/lib/supabase/types";
import type {
  AiUiDetailFieldItem,
  AiUiDetailFormItem,
  AiUiDetailInteractionItem,
  AiUiDetailItem,
  AiUiDetailNavigationItem,
  AiUiDetailStateItem,
} from "@/lib/ai/schema";
import type {
  ApplyItemOutcome,
  ApplySummary,
  ErdBundleResult,
} from "./shared";
import { optionalText } from "./shared";

export type ApplyUiDetailOptions = {
  projectId: string;
  userId: string;
  items: AiUiDetailItem[];
  indices: number[];
};

export type UiDetailFieldRow = {
  name: string;
  label: string;
  field_type: UiFieldType;
  required: boolean;
  placeholder: string | null;
  help_text: string | null;
  default_value: string | null;
};

export type UiDetailFormRow = {
  name: string;
  description: string | null;
  submit_label: string | null;
  success_behavior: string | null;
};

export type UiDetailStateRow = {
  name: string;
  state_type: UiStateType;
  description: string | null;
  behavior: string | null;
};

export type UiDetailInteractionRow = {
  name: string;
  trigger: string;
  action: string;
  description: string | null;
};

export type UiDetailNavigationRow = {
  name: string;
  label: string;
  route: string | null;
  description: string | null;
};

export function buildUiDetailFieldRow(
  item: AiUiDetailFieldItem,
): UiDetailFieldRow | null {
  if (!UI_FIELD_TYPES.includes(item.field_type)) return null;
  const name = item.name.trim();
  if (name.length < 1 || name.length > 200) return null;
  const label = item.label.trim();
  if (label.length < 1 || label.length > 200) return null;
  const placeholder = item.placeholder.trim();
  if (placeholder.length > 500) return null;
  const helpText = item.help_text.trim();
  if (helpText.length > 2000) return null;
  const defaultValue = item.default_value.trim();
  if (defaultValue.length > 2000) return null;
  return {
    name,
    label,
    field_type: item.field_type,
    required: item.required,
    placeholder: optionalText(placeholder),
    help_text: optionalText(helpText),
    default_value: optionalText(defaultValue),
  };
}

export function buildUiDetailFormRow(
  item: AiUiDetailFormItem,
): UiDetailFormRow | null {
  const name = item.name.trim();
  if (name.length < 1 || name.length > 200) return null;
  const description = item.description.trim();
  if (description.length > 5000) return null;
  const submitLabel = item.submit_label.trim();
  if (submitLabel.length > 100) return null;
  const successBehavior = item.success_behavior.trim();
  if (successBehavior.length > 2000) return null;
  return {
    name,
    description: optionalText(description),
    submit_label: optionalText(submitLabel),
    success_behavior: optionalText(successBehavior),
  };
}

export function buildUiDetailStateRow(
  item: AiUiDetailStateItem,
): UiDetailStateRow | null {
  if (!UI_STATE_TYPES.includes(item.state_type)) return null;
  const name = item.name.trim();
  if (name.length < 1 || name.length > 200) return null;
  const description = item.description.trim();
  if (description.length > 3000) return null;
  const behavior = item.behavior.trim();
  if (behavior.length > 5000) return null;
  return {
    name,
    state_type: item.state_type,
    description: optionalText(description),
    behavior: optionalText(behavior),
  };
}

export function buildUiDetailInteractionRow(
  item: AiUiDetailInteractionItem,
): UiDetailInteractionRow | null {
  const name = item.name.trim();
  if (name.length < 1 || name.length > 200) return null;
  const trigger = item.trigger.trim();
  if (trigger.length < 1 || trigger.length > 500) return null;
  const action = item.action.trim();
  if (action.length < 1 || action.length > 2000) return null;
  const description = item.description.trim();
  if (description.length > 5000) return null;
  return {
    name,
    trigger,
    action,
    description: optionalText(description),
  };
}

export function buildUiDetailNavigationRow(
  item: AiUiDetailNavigationItem,
): UiDetailNavigationRow | null {
  const name = item.name.trim();
  if (name.length < 1 || name.length > 200) return null;
  const label = item.label.trim();
  if (label.length < 1 || label.length > 200) return null;
  const route = item.route.trim();
  if (route.length > 500) return null;
  const description = item.description.trim();
  if (description.length > 5000) return null;
  return {
    name,
    label,
    route: optionalText(route),
    description: optionalText(description),
  };
}

type UiDetailBundleScreen = {
  index: number;
  screen_name: string;
  forms: Array<{
    name: string;
    description: string;
    submit_label: string;
    success_behavior: string;
    fields: Array<{
      name: string;
      label: string;
      field_type: string;
      required: boolean;
      placeholder: string;
      help_text: string;
      default_value: string;
    }>;
  }>;
  states: Array<{
    name: string;
    state_type: string;
    description: string;
    behavior: string;
  }>;
  interactions: Array<{
    name: string;
    trigger: string;
    action: string;
    description: string;
    endpoint_labels: string[];
  }>;
};

type UiDetailBundleNavigation = {
  index: number;
  name: string;
  label: string;
  route: string;
  description: string;
  parent_label: string;
  screen_names: string[];
};

export type UiDetailBundleParts = {
  screens: UiDetailBundleScreen[];
  navigation: UiDetailBundleNavigation[];
  skipped: ApplyItemOutcome[];
};

export function buildUiDetailBundle(
  items: AiUiDetailItem[],
  indices: number[],
): UiDetailBundleParts {
  const skipped: ApplyItemOutcome[] = [];
  const screens: UiDetailBundleScreen[] = [];
  const navigation: UiDetailBundleNavigation[] = [];

  const chosen = [...new Set(indices)]
    .filter((n) => Number.isInteger(n) && n >= 0 && n < items.length)
    .sort((a, b) => a - b);

  for (const index of chosen) {
    const item = items[index];
    if (!item) {
      skipped.push({ kind: "skipped", index, title: "", reason: "invalid" });
      continue;
    }

    if (item.kind === "navigation") {
      const row = buildUiDetailNavigationRow(item);
      if (!row) {
        skipped.push({
          kind: "skipped",
          index,
          title: item.name,
          reason: "invalid",
        });
        continue;
      }
      navigation.push({
        index,
        name: row.name,
        label: row.label,
        route: row.route ?? "",
        description: row.description ?? "",
        parent_label: item.parent_label ?? "",
        screen_names: item.screen_names,
      });
      continue;
    }

    const screenName = item.screen_name.trim();
    if (screenName.length < 1 || screenName.length > 120) {
      skipped.push({
        kind: "skipped",
        index,
        title: item.screen_name,
        reason: "invalid",
      });
      continue;
    }

    const forms: UiDetailBundleScreen["forms"] = [];
    let invalidChild = false;
    for (const form of item.forms) {
      const formRow = buildUiDetailFormRow(form);
      if (!formRow) {
        invalidChild = true;
        skipped.push({
          kind: "skipped",
          index,
          title: `${screenName} / ${form.name}`,
          reason: "invalid",
        });
        continue;
      }
      const fields: UiDetailBundleScreen["forms"][number]["fields"] = [];
      for (const field of form.fields) {
        const fieldRow = buildUiDetailFieldRow(field);
        if (!fieldRow) {
          invalidChild = true;
          skipped.push({
            kind: "skipped",
            index,
            title: `${screenName} / ${form.name} / ${field.name}`,
            reason: "invalid",
          });
          continue;
        }
        fields.push({
          name: fieldRow.name,
          label: fieldRow.label,
          field_type: fieldRow.field_type,
          required: fieldRow.required,
          placeholder: fieldRow.placeholder ?? "",
          help_text: fieldRow.help_text ?? "",
          default_value: fieldRow.default_value ?? "",
        });
      }
      forms.push({
        name: formRow.name,
        description: formRow.description ?? "",
        submit_label: formRow.submit_label ?? "",
        success_behavior: formRow.success_behavior ?? "",
        fields,
      });
    }

    const states: UiDetailBundleScreen["states"] = [];
    for (const state of item.states) {
      const stateRow = buildUiDetailStateRow(state);
      if (!stateRow) {
        invalidChild = true;
        skipped.push({
          kind: "skipped",
          index,
          title: `${screenName} / ${state.name}`,
          reason: "invalid",
        });
        continue;
      }
      states.push({
        name: stateRow.name,
        state_type: stateRow.state_type,
        description: stateRow.description ?? "",
        behavior: stateRow.behavior ?? "",
      });
    }

    const interactions: UiDetailBundleScreen["interactions"] = [];
    for (const interaction of item.interactions) {
      const interactionRow = buildUiDetailInteractionRow(interaction);
      if (!interactionRow) {
        invalidChild = true;
        skipped.push({
          kind: "skipped",
          index,
          title: `${screenName} / ${interaction.name}`,
          reason: "invalid",
        });
        continue;
      }
      interactions.push({
        name: interactionRow.name,
        trigger: interactionRow.trigger,
        action: interactionRow.action,
        description: interactionRow.description ?? "",
        endpoint_labels: interaction.endpoint_labels,
      });
    }

    if (invalidChild && forms.length === 0 && states.length === 0 && interactions.length === 0) {
      skipped.push({
        kind: "skipped",
        index,
        title: screenName,
        reason: "invalid",
      });
      continue;
    }

    screens.push({
      index,
      screen_name: screenName,
      forms,
      states,
      interactions,
    });
  }

  return { screens, navigation, skipped };
}

// Transactional variant: screen detail and navigation are all applied inside a
// single database transaction by apply_ui_detail_bundle.
export async function applyUiDetailBundleToProject(
  options: ApplyUiDetailOptions,
): Promise<ApplySummary> {
  const supabase = await createClient();
  const out: ApplySummary = { created: [], skipped: [], failed: [] };

  const { screens, navigation, skipped } = buildUiDetailBundle(
    options.items,
    options.indices,
  );
  out.skipped.push(...skipped);

  if (screens.length === 0 && navigation.length === 0) {
    return out;
  }

  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { data, error } = await rpc("apply_ui_detail_bundle", {
    p_project_id: options.projectId,
    p_screens: screens,
    p_navigation: navigation,
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
