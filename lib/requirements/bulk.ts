export const MAX_BULK_REQUIREMENTS = 200;

export const REQUIREMENT_BULK_STATUSES = [
  "draft",
  "approved",
  "rejected",
  "implemented",
] as const;

export const REQUIREMENT_BULK_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type RequirementBulkStatus = (typeof REQUIREMENT_BULK_STATUSES)[number];
export type RequirementBulkPriority =
  (typeof REQUIREMENT_BULK_PRIORITIES)[number];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeBulkRequirementIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  for (const value of raw) {
    if (typeof value !== "string") continue;
    if (!UUID_RE.test(value)) continue;
    seen.add(value);
    if (seen.size >= MAX_BULK_REQUIREMENTS) break;
  }
  return [...seen];
}

export function isRequirementBulkStatus(
  value: unknown,
): value is RequirementBulkStatus {
  return (
    typeof value === "string" &&
    (REQUIREMENT_BULK_STATUSES as readonly string[]).includes(value)
  );
}

export function isRequirementBulkPriority(
  value: unknown,
): value is RequirementBulkPriority {
  return (
    typeof value === "string" &&
    (REQUIREMENT_BULK_PRIORITIES as readonly string[]).includes(value)
  );
}
