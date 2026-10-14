import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";

export type ActivityKind =
  | "requirement"
  | "decision"
  | "domain"
  | "entity"
  | "component"
  | "technology"
  | "architecture_decision"
  | "endpoint"
  | "screen"
  | "task"
  | "ai";

export type ActivityAction = "created" | "updated" | "generated";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  action: ActivityAction;
  title: string;
  at: string;
  href: string;
}

type Row = Record<string, unknown>;

interface Source {
  table: string;
  kind: ActivityKind;
  nameColumn: string;
  title?: (row: Row) => string;
  href: (row: Row) => string;
}

const PER_TABLE_LIMIT = 6;
const MAX_ITEMS = 30;

const SOURCES: Source[] = [
  {
    table: "requirements",
    kind: "requirement",
    nameColumn: "title",
    href: (row) => `requirements/${row.id}`,
  },
  {
    table: "decisions",
    kind: "decision",
    nameColumn: "title",
    href: (row) => `decisions/${row.id}`,
  },
  {
    table: "domains",
    kind: "domain",
    nameColumn: "name",
    href: (row) => `domains/${row.id}`,
  },
  {
    table: "architecture_components",
    kind: "component",
    nameColumn: "name",
    href: (row) => `architecture/components/${row.id}`,
  },
  {
    table: "architecture_technologies",
    kind: "technology",
    nameColumn: "name",
    href: (row) => `architecture/technologies/${row.id}`,
  },
  {
    table: "architecture_decisions",
    kind: "architecture_decision",
    nameColumn: "title",
    href: (row) => `architecture/decisions/${row.id}`,
  },
  {
    table: "api_endpoints",
    kind: "endpoint",
    nameColumn: "path",
    title: (row) => `${row.method} ${row.path}`,
    href: (row) => `api/${row.id}`,
  },
  {
    table: "ui_screens",
    kind: "screen",
    nameColumn: "name",
    href: (row) => `ui/screens/${row.id}`,
  },
  {
    table: "tasks",
    kind: "task",
    nameColumn: "title",
    href: (row) => `tasks/${row.id}`,
  },
];

function actionFor(row: Row): ActivityAction {
  const created = typeof row.created_at === "string" ? Date.parse(row.created_at) : NaN;
  const updated = typeof row.updated_at === "string" ? Date.parse(row.updated_at) : NaN;
  if (Number.isNaN(created) || Number.isNaN(updated)) return "updated";
  return Math.abs(updated - created) < 2000 ? "created" : "updated";
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function toItem(row: Row, kind: ActivityKind, title: string, href: string): ActivityItem {
  return {
    id: `${kind}-${String(row.id)}`,
    kind,
    action: actionFor(row),
    title,
    at: text(row.updated_at ?? row.created_at, ""),
    href,
  };
}

// Most recent changes in a project, newest first. There is no audit table yet,
// so this reads the newest rows of every section plus the AI generations.
export async function listProjectActivity(
  projectId: string,
  client?: SupabaseServerClient,
): Promise<ActivityItem[]> {
  const supabase = client ?? (await createClient());

  const perSource = SOURCES.map(async (source) => {
    const query = supabase
      .from(source.table as "domains")
      .select(`id, ${source.nameColumn}, created_at, updated_at`)
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(PER_TABLE_LIMIT);

    const { data, error } = await query;
    if (error || !data) return [] as ActivityItem[];

    return (data as unknown as Row[]).map((row) => {
      const title = source.title ? source.title(row) : text(row[source.nameColumn], "(untitled)");
      return toItem(row, source.kind, title, source.href(row));
    });
  });

  const entities = (async () => {
    const { data, error } = await supabase
      .from("entities")
      .select("id, name, domain_id, created_at, updated_at, domains!inner(project_id)")
      .eq("domains.project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(PER_TABLE_LIMIT);

    if (error || !data) return [] as ActivityItem[];

    return (data as unknown as Row[]).map((row) =>
      toItem(row, "entity", text(row.name, "(untitled)"), `domains/${row.domain_id}/entities/${row.id}`),
    );
  })();

  const generations = (async () => {
    const { data, error } = await supabase
      .from("ai_suggestions")
      .select("id, stage, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(PER_TABLE_LIMIT);

    if (error || !data) return [] as ActivityItem[];

    return (data as unknown as Row[]).map((row) => ({
      id: `ai-${String(row.id)}`,
      kind: "ai" as const,
      action: "generated" as const,
      title: `Generated ${text(row.stage, "AI")} suggestions`,
      at: text(row.created_at, ""),
      href: "ai-history",
    }));
  })();

  const groups = await Promise.all([...perSource, entities, generations]);
  const items = groups.flat().filter((item) => item.at !== "");

  items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return items.slice(0, MAX_ITEMS);
}
