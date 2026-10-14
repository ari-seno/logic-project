export const MAX_BULK_TASKS = 200;

export const TASK_BULK_STATUSES = [
  "todo",
  "ready",
  "in_progress",
  "blocked",
  "review",
  "done",
  "cancelled",
] as const;

export const TASK_BULK_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type TaskBulkStatus = (typeof TASK_BULK_STATUSES)[number];
export type TaskBulkPriority = (typeof TASK_BULK_PRIORITIES)[number];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeBulkIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  for (const value of raw) {
    if (typeof value !== "string") continue;
    if (!UUID_RE.test(value)) continue;
    seen.add(value);
    if (seen.size >= MAX_BULK_TASKS) break;
  }
  return [...seen];
}

export function isBulkStatus(value: unknown): value is TaskBulkStatus {
  return (
    typeof value === "string" &&
    (TASK_BULK_STATUSES as readonly string[]).includes(value)
  );
}

export function isBulkPriority(value: unknown): value is TaskBulkPriority {
  return (
    typeof value === "string" &&
    (TASK_BULK_PRIORITIES as readonly string[]).includes(value)
  );
}
