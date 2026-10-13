import { createClient } from "@/lib/supabase/server";
import { architectureComponentInputSchema } from "@/lib/validation/architecture/components";
import { architectureTechnologyInputSchema } from "@/lib/validation/architecture/technologies";
import { architectureDecisionInputSchema } from "@/lib/validation/architecture/decisions";
import { architectureComponentDependencyInputSchema } from "@/lib/validation/architecture/dependencies";
import type {
  ArchitectureComponentType,
  ArchitectureTechnologyCategory,
} from "@/lib/supabase/types";
import type {
  AiArchitectureComponentItem,
  AiArchitectureDecisionItem,
  AiArchitectureDependencyItem,
  AiArchitectureItem,
  AiArchitectureTechnologyItem,
} from "@/lib/ai/schema";
import type {
  ApplyItemOutcome,
  ApplySummary,
  ErdBundleResult,
} from "./shared";
import { optionalText } from "./shared";

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

  const rpc = supabase.rpc.bind(supabase) as unknown as (
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
