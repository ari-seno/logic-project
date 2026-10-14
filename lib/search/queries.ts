import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";
import {
  SEARCH_LIMIT_PER_KIND,
  SEARCH_MIN_LENGTH,
  sanitizeSearchQuery,
  type SearchResult,
} from "@/lib/search/shared";

export type { SearchResult } from "@/lib/search/shared";
export { sanitizeSearchQuery, SEARCH_MIN_LENGTH } from "@/lib/search/shared";

function cursor(rows: { id: string }[] | null): { id: string }[] {
  return (rows ?? []) as { id: string }[];
}

export async function searchProjectArtifacts(
  projectId: string,
  rawQuery: string,
  client?: SupabaseServerClient,
): Promise<SearchResult[]> {
  const query = sanitizeSearchQuery(rawQuery);
  if (query.length < SEARCH_MIN_LENGTH) {
    return [];
  }

  const supabase = client ?? (await createClient());
  const like = `%${query}%`;
  const limit = SEARCH_LIMIT_PER_KIND;

  const [
    requirements,
    decisions,
    domains,
    entities,
    components,
    technologies,
    endpoints,
    screens,
    tasks,
  ] = await Promise.all([
    supabase
      .from("requirements")
      .select("id, title, type, status")
      .eq("project_id", projectId)
      .ilike("title", like)
      .limit(limit),
    supabase
      .from("decisions")
      .select("id, title, status")
      .eq("project_id", projectId)
      .ilike("title", like)
      .limit(limit),
    supabase
      .from("domains")
      .select("id, name")
      .eq("project_id", projectId)
      .ilike("name", like)
      .limit(limit),
    supabase
      .from("entities")
      .select("id, name, domain_id, domains!inner(project_id)")
      .eq("domains.project_id", projectId)
      .ilike("name", like)
      .limit(limit),
    supabase
      .from("architecture_components")
      .select("id, name, type")
      .eq("project_id", projectId)
      .ilike("name", like)
      .limit(limit),
    supabase
      .from("architecture_technologies")
      .select("id, name, category")
      .eq("project_id", projectId)
      .ilike("name", like)
      .limit(limit),
    supabase
      .from("api_endpoints")
      .select("id, name, method, path")
      .eq("project_id", projectId)
      .or(`name.ilike.${like},path.ilike.${like}`)
      .limit(limit),
    supabase
      .from("ui_screens")
      .select("id, name, screen_type")
      .eq("project_id", projectId)
      .ilike("name", like)
      .limit(limit),
    supabase
      .from("tasks")
      .select("id, title, status")
      .eq("project_id", projectId)
      .ilike("title", like)
      .limit(limit),
  ]);

  const base = `/projects/${projectId}`;
  const results: SearchResult[] = [];

  for (const row of cursor(requirements.data)) {
    const item = row as unknown as {
      id: string;
      title: string;
      type: string;
      status: string;
    };
    results.push({
      kind: "requirement",
      id: item.id,
      title: item.title,
      subtitle: `${item.type.replace("_", " ")} · ${item.status}`,
      href: `${base}/requirements/${item.id}`,
    });
  }

  for (const row of cursor(decisions.data)) {
    const item = row as unknown as { id: string; title: string; status: string };
    results.push({
      kind: "decision",
      id: item.id,
      title: item.title,
      subtitle: item.status,
      href: `${base}/decisions/${item.id}`,
    });
  }

  for (const row of cursor(domains.data)) {
    const item = row as unknown as { id: string; name: string };
    results.push({
      kind: "domain",
      id: item.id,
      title: item.name,
      subtitle: "Domain",
      href: `${base}/domains/${item.id}`,
    });
  }

  for (const row of cursor(entities.data)) {
    const item = row as unknown as { id: string; name: string; domain_id: string };
    results.push({
      kind: "entity",
      id: item.id,
      title: item.name,
      subtitle: "Entity",
      href: `${base}/domains/${item.domain_id}/entities/${item.id}`,
    });
  }

  for (const row of cursor(components.data)) {
    const item = row as unknown as { id: string; name: string; type: string };
    results.push({
      kind: "component",
      id: item.id,
      title: item.name,
      subtitle: `Component · ${item.type.replace("_", " ")}`,
      href: `${base}/architecture/components/${item.id}`,
    });
  }

  for (const row of cursor(technologies.data)) {
    const item = row as unknown as { id: string; name: string; category: string };
    results.push({
      kind: "technology",
      id: item.id,
      title: item.name,
      subtitle: `Technology · ${item.category.replace("_", " ")}`,
      href: `${base}/architecture/technologies/${item.id}`,
    });
  }

  for (const row of cursor(endpoints.data)) {
    const item = row as unknown as {
      id: string;
      name: string;
      method: string;
      path: string;
    };
    results.push({
      kind: "endpoint",
      id: item.id,
      title: `${item.method} ${item.path}`,
      subtitle: item.name,
      href: `${base}/api/${item.id}`,
    });
  }

  for (const row of cursor(screens.data)) {
    const item = row as unknown as { id: string; name: string; screen_type: string };
    results.push({
      kind: "screen",
      id: item.id,
      title: item.name,
      subtitle: `Screen · ${item.screen_type.replace("_", " ")}`,
      href: `${base}/ui/screens/${item.id}`,
    });
  }

  for (const row of cursor(tasks.data)) {
    const item = row as unknown as { id: string; title: string; status: string };
    results.push({
      kind: "task",
      id: item.id,
      title: item.title,
      subtitle: item.status.replace("_", " "),
      href: `${base}/tasks/${item.id}`,
    });
  }

  return results;
}
