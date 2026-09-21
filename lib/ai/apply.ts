import { createClient } from "@/lib/supabase/server";
import { listRequirements } from "@/lib/requirements/queries";
import { listDecisions } from "@/lib/decisions/queries";
import { requirementInputSchema } from "@/lib/validation/requirements";
import { decisionInputSchema } from "@/lib/validation/decisions";
import type { AiDecisionItem, AiRequirementItem } from "@/lib/ai/schema";

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
