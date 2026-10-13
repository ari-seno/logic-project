import { createClient } from "@/lib/supabase/server";
import { taskDependencyInputSchema } from "@/lib/validation/tasks";
import {
  TASK_EFFORTS,
  TASK_PRIORITIES,
  TASK_TYPES,
} from "@/lib/supabase/types";
import type {
  TaskDependencyType,
  TaskEffort,
  TaskPriority,
  TaskType,
} from "@/lib/supabase/types";
import type { AiTaskItem } from "@/lib/ai/schema";
import type {
  ApplyItemOutcome,
  ApplySummary,
  ErdBundleResult,
} from "./shared";
import { optionalText } from "./shared";

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

type TaskBundleTask = {
  index: number;
  title: string;
  task_type: string;
  priority: string;
  estimated_effort: string;
  description: string;
  acceptance_criteria: string;
  implementation_notes: string;
  parent_title: string;
  depends_on: string[];
  links: Array<{ kind: string; name: string }>;
};

// Pure builder: turns the selected items into the payload the SQL function
// expects. Invalid tasks/links are recorded as skipped rather than aborting.
export function buildTasksBundle(
  items: AiTaskItem[],
  indices: number[],
): { tasks: TaskBundleTask[]; skipped: ApplyItemOutcome[] } {
  const skipped: ApplyItemOutcome[] = [];
  const tasks: TaskBundleTask[] = [];

  const chosen = [...new Set(indices)]
    .filter((n) => Number.isInteger(n) && n >= 0 && n < items.length)
    .sort((a, b) => a - b);

  for (const index of chosen) {
    const item = items[index];
    if (!item) {
      skipped.push({ kind: "skipped", index, title: "", reason: "invalid" });
      continue;
    }

    const row = buildTaskRow(item);
    if (!row) {
      skipped.push({
        kind: "skipped",
        index,
        title: item.title,
        reason: "invalid",
      });
      continue;
    }

    tasks.push({
      index,
      title: row.title,
      task_type: row.task_type,
      priority: row.priority,
      estimated_effort: row.estimated_effort ?? "",
      description: row.description ?? "",
      acceptance_criteria: row.acceptance_criteria ?? "",
      implementation_notes: row.implementation_notes ?? "",
      parent_title: item.parent_title.trim(),
      depends_on: item.depends_on.map((title) => title.trim()).filter(Boolean),
      links: item.links.map((link) => ({ kind: link.kind, name: link.name })),
    });
  }

  return { tasks, skipped };
}

export async function applyTasksBundleToProject(
  options: ApplyTasksOptions,
): Promise<ApplySummary> {
  const supabase = await createClient();
  const out: ApplySummary = { created: [], skipped: [], failed: [] };

  const bundle = buildTasksBundle(options.items, options.indices);
  out.skipped.push(...bundle.skipped);

  if (bundle.tasks.length === 0) {
    return out;
  }

  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { data, error } = await rpc("apply_tasks_bundle", {
    p_project_id: options.projectId,
    p_tasks: bundle.tasks,
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
