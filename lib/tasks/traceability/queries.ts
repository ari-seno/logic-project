import { createClient } from "@/lib/supabase/server";

export type RequirementLink = { id: string; title: string; status: string; type: string; priority: string };
export type DecisionLink = { id: string; title: string; status: string };
export type DomainLink = { id: string; name: string; domain_name: string };
export type ArchitectureComponentLink = { id: string; name: string; type: string };
export type ApiEndpointLink = { id: string; method: string; path: string; name: string };
export type UiScreenLink = { id: string; name: string; screen_type: string };

export async function listTaskRequirements(
  taskId: string,
): Promise<RequirementLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_requirements")
    .select("id, requirements(title, status, type, priority)")
    .eq("task_id", taskId);
  if (error || !data) return [];
  return data.map((row) => {
    const r = row as { id: string; requirements: { title: string; status: string; type: string; priority: string } | null };
    return {
      id: r.id,
      title: r.requirements?.title ?? "(deleted)",
      status: r.requirements?.status ?? "draft",
      type: r.requirements?.type ?? "functional",
      priority: r.requirements?.priority ?? "medium",
    };
  });
}

export async function listTaskDecisions(
  taskId: string,
): Promise<DecisionLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_decisions")
    .select("id, decisions(title, status)")
    .eq("task_id", taskId);
  if (error || !data) return [];
  return data.map((row) => {
    const r = row as { id: string; decisions: { title: string; status: string } | null };
    return {
      id: r.id,
      title: r.decisions?.title ?? "(deleted)",
      status: r.decisions?.status ?? "proposed",
    };
  });
}

export async function listTaskDomains(taskId: string): Promise<DomainLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_domains")
    .select("id, entities(name, domains(name))")
    .eq("task_id", taskId);
  if (error || !data) return [];
  return data.map((row) => {
    const r = row as { id: string; entities: { name: string; domains: { name: string } | null } | null };
    return {
      id: r.id,
      name: r.entities?.name ?? "(deleted)",
      domain_name: r.entities?.domains?.name ?? "",
    };
  });
}

export async function listTaskArchitectureComponents(
  taskId: string,
): Promise<ArchitectureComponentLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_architecture_components")
    .select("id, architecture_components(name, type)")
    .eq("task_id", taskId);
  if (error || !data) return [];
  return data.map((row) => {
    const r = row as { id: string; architecture_components: { name: string; type: string } | null };
    return {
      id: r.id,
      name: r.architecture_components?.name ?? "(deleted)",
      type: r.architecture_components?.type ?? "other",
    };
  });
}

export async function listTaskApiEndpoints(
  taskId: string,
): Promise<ApiEndpointLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_api_endpoints")
    .select("id, api_endpoints(method, path, name)")
    .eq("task_id", taskId);
  if (error || !data) return [];
  return data.map((row) => {
    const r = row as { id: string; api_endpoints: { method: string; path: string; name: string } | null };
    return {
      id: r.id,
      method: r.api_endpoints?.method ?? "GET",
      path: r.api_endpoints?.path ?? "",
      name: r.api_endpoints?.name ?? "(deleted)",
    };
  });
}

export async function listTaskUiScreens(
  taskId: string,
): Promise<UiScreenLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_ui_screens")
    .select("id, ui_screens(name, screen_type)")
    .eq("task_id", taskId);
  if (error || !data) return [];
  return data.map((row) => {
    const r = row as { id: string; ui_screens: { name: string; screen_type: string } | null };
    return {
      id: r.id,
      name: r.ui_screens?.name ?? "(deleted)",
      screen_type: r.ui_screens?.screen_type ?? "page",
    };
  });
}

/**
 * Lists all artefacts in a project that can be linked to a task of this
 * project. Used by attach forms (excludes already-linked rows).
 */
export async function listAvailableArtifacts(projectId: string) {
  const supabase = await createClient();
  const [req, dec, ent, comp, eps, scr] = await Promise.all([
    supabase.from("requirements").select("id, title, status, type, priority").eq("project_id", projectId),
    supabase.from("decisions").select("id, title, status").eq("project_id", projectId),
    supabase.from("entities").select("id, name, domains!inner(project_id, name)").eq("domains.project_id", projectId),
    supabase.from("architecture_components").select("id, name, type").eq("project_id", projectId),
    supabase.from("api_endpoints").select("id, name, path, method").eq("project_id", projectId),
    supabase.from("ui_screens").select("id, name, screen_type").eq("project_id", projectId),
  ]);
  return {
    requirements: (req.data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      type: r.type,
      priority: r.priority,
    })),
    decisions: (dec.data ?? []).map((d) => ({
      id: d.id,
      title: d.title,
      status: d.status,
    })),
    entities: ((ent.data ?? []) as unknown as Array<{
      id: string; name: string; domains: { name: string };
    }>).map((e) => ({ id: e.id, name: e.name, domain_name: e.domains.name })),
    architectureComponents: (comp.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
    })),
    apiEndpoints: (eps.data ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      path: e.path,
      method: e.method,
    })),
    uiScreens: (scr.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      screen_type: s.screen_type,
    })),
  };
}
