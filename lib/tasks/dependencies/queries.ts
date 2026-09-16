import { createClient } from "@/lib/supabase/server";
import type { TaskDependency } from "@/lib/supabase/types";

/**
 * Whether, after adding a `blocks` dependency `startId → dependsOnId`,
 * the blocks graph would contain a cycle.
 *
 * We walk the transitive closure of `dependsOnId` (nodes that `dependsOnId`
 * blocks) and check whether `startId` already depends on any of them via
 * the blocks graph. If so, completing those dependencies requires `startId`
 * — but `startId` itself must complete first: cycle.
 *
 * Implementation:
 * 1. Find the chain of nodes transitively blocked by `dependsOnId` (downstream).
 * 2. Find the chain of nodes that block `startId` (upstream).
 * 3. If the intersection is non-empty (i.e. exists X such that startId →blocks X
 *    and dependsOnId →blocks X), then `startId` is reachable downstream of
 *    `dependsOnId`: cycle.
 */
export async function wouldCreateDependencyCycle(
  startId: string,
  dependsOnId: string,
): Promise<boolean> {
  if (startId === dependsOnId) return true;
  const supabase = await createClient();

  // Chain of tasks that depend_on these (descendants in the blocks graph).
  // i.e. descendants of startId already (tasks that block startId) means
  // startId must complete first, which is fine. We need to know if
  // dependsOnId eventually depends on startId.

  // Walk upward from dependsOnId: predecessors of dependsOnId. If one of them
  // is startId (directly or transitively), we'd close a loop.
  type BlockDepRow = { task_id: string };

const visited = new Set<string>();
  let current: string | null = dependsOnId;
  while (current) {
    if (current === startId) return true;
    if (visited.has(current)) break;
    visited.add(current);
    const result: { data: BlockDepRow[] | null } = await supabase
      .from("task_dependencies")
      .select("task_id")
      .eq("depends_on_task_id", current)
      .eq("dependency_type", "blocks");
    const data = result.data;
    if (!data || data.length === 0) break;
    current = data[0].task_id;
  }
  return false;
}

export async function listDependenciesByProject({
  projectId,
}: {
  projectId: string;
}): Promise<TaskDependency[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_dependencies")
    .select("*")
    .eq("project_id", projectId);
  if (error) return [];
  return data ?? [];
}

export async function listDependenciesForTask(
  taskId: string,
): Promise<TaskDependency[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_dependencies")
    .select("*")
    .or(`task_id.eq.${taskId},depends_on_task_id.eq.${taskId}`);
  if (error) return [];
  return data ?? [];
}

/**
 * Derive whether the given task is "blocked" purely by inspection of its
 * `blocks` dependencies. A task is blocked-by-dependencies when it has at
 * least one blocks dependency on a task that is not done/cancelled.
 *
 * Returns the list of dependency task IDs that are blocking completion.
 */
export function deriveBlockedByDependency(
  taskId: string,
  allDeps: TaskDependency[],
  allTasks: { id: string; status: string }[],
): { blocked: boolean; blockerIds: string[] } {
  const blockers: string[] = [];
  const taskStatus = new Map(allTasks.map((t) => [t.id, t.status]));
  for (const dep of allDeps) {
    if (dep.task_id !== taskId) continue;
    if (dep.dependency_type !== "blocks") continue;
    const upstreamStatus = taskStatus.get(dep.depends_on_task_id);
    if (upstreamStatus && upstreamStatus !== "done" && upstreamStatus !== "cancelled") {
      blockers.push(dep.depends_on_task_id);
    }
  }
  return { blocked: blockers.length > 0, blockerIds: blockers };
}
