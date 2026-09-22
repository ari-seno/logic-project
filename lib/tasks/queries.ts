import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/supabase/types";

export async function listTasksByProject({
  projectId,
}: {
  projectId: string;
}): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function countTasksByStatus(
  projectId: string,
  client?: SupabaseServerClient,
): Promise<{
  total: number;
  todo: number;
  ready: number;
  in_progress: number;
  blocked: number;
  review: number;
  done: number;
  cancelled: number;
}> {
  const supabase = client ?? (await createClient());
  const statuses = [
    "todo",
    "ready",
    "in_progress",
    "blocked",
    "review",
    "done",
    "cancelled",
  ] as const;

  const results = await Promise.all(
    statuses.map((status) =>
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("status", status),
    ),
  );

  const counts = {
    total: 0,
    todo: 0,
    ready: 0,
    in_progress: 0,
    blocked: 0,
    review: 0,
    done: 0,
    cancelled: 0,
  };

  statuses.forEach((status, index) => {
    const value = results[index]?.count ?? 0;
    counts[status] = value;
    counts.total += value;
  });

  return counts;
}

export async function getTask(id: string): Promise<Task | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function nextTaskPosition(projectId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? -1) + 1;
}

/**
 * Detect parent-child cycles in the task graph rooted at `startId`.
 * Walks upwards through parent_task_id links until either a cycle or root.
 * Returns true if adding parentId to startId would create a cycle.
 */
export async function wouldCreateParentCycle(
  startId: string,
  parentId: string,
): Promise<boolean> {
  if (startId === parentId) return true;
  const supabase = await createClient();
  let current: string | null = parentId;
  while (current) {
    if (current === startId) return true;
    const { data } = await supabase
      .from("tasks")
      .select("parent_task_id")
      .eq("id", current)
      .maybeSingle();
    current = (data?.parent_task_id ?? null) as string | null;
  }
  return false;
}
