// Pure helper for the task detail page: walks the "blocks" edges forward from a
// task and returns an indented chain of titles. Kept out of the page module so
// it can be unit tested without rendering.
export function buildDependencyChain(
  startId: string,
  allTasks: { id: string; title: string }[],
  allDeps: {
    task_id: string;
    depends_on_task_id: string;
    dependency_type: string;
  }[],
): string[] {
  // Simple downstream chain: walk forward (tasks blocked by startId or by ancestors).
  const byTitle = new Map(allTasks.map((t) => [t.id, t.title]));
  const successors = new Map<string, string[]>();
  for (const dep of allDeps) {
    if (dep.dependency_type !== "blocks") continue;
    const arr = successors.get(dep.depends_on_task_id) ?? [];
    arr.push(dep.task_id);
    successors.set(dep.depends_on_task_id, arr);
  }
  const out: string[] = [];
  const seen = new Set<string>();
  function walk(id: string, depth: number) {
    if (seen.has(id) || depth > 8) return;
    seen.add(id);
    const title = byTitle.get(id) ?? id;
    out.push(`${"  ".repeat(depth)}${title}`);
    for (const next of successors.get(id) ?? []) {
      walk(next, depth + 1);
    }
  }
  walk(startId, 0);
  return out;
}
