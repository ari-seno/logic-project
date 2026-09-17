import { createClient } from "@/lib/supabase/server";
import { listRequirements } from "@/lib/requirements/queries";
import { requirementInputSchema } from "@/lib/validation/requirements";
import type { AiRequirementItem } from "@/lib/ai/schema";

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

export type ApplyRequirementsSummary = {
  created: ApplyItemOutcome[];
  skipped: ApplyItemOutcome[];
  failed: ApplyItemOutcome[];
};

export type ApplyOptions = {
  projectId: string;
  userId: string;
  items: AiRequirementItem[];
  indices: number[];
};

export async function applyRequirementsToProject(
  options: ApplyOptions,
): Promise<ApplyRequirementsSummary> {
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
