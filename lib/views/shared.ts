export const VIEW_SCOPES = ["requirements", "tasks"] as const;

export type ViewScope = (typeof VIEW_SCOPES)[number];

export const VIEW_LABEL_MAX = 60;
export const VIEW_QUERY_MAX = 500;

export function isViewScope(value: unknown): value is ViewScope {
  return (
    typeof value === "string" &&
    (VIEW_SCOPES as readonly string[]).includes(value)
  );
}

export function normalizeViewLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, VIEW_LABEL_MAX);
}

export function normalizeViewQuery(value: string): string {
  return value.trim().replace(/^\?/, "").slice(0, VIEW_QUERY_MAX);
}

export function sectionPath(projectId: string, scope: ViewScope): string {
  return scope === "tasks"
    ? `/projects/${projectId}/tasks`
    : `/projects/${projectId}/requirements`;
}

export function viewHref(
  projectId: string,
  scope: ViewScope,
  query: string,
): string {
  const normalized = normalizeViewQuery(query);
  const base = sectionPath(projectId, scope);
  return normalized ? `${base}?${normalized}` : base;
}
