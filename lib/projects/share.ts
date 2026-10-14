import { randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";
import type {
  ApiHttpMethod,
  ArchitectureComponentType,
  DecisionStatus,
  RequirementPriority,
  RequirementStatus,
  RequirementType,
  TaskPriority,
  TaskStatus,
  UiScreenType,
} from "@/lib/supabase/types";

export type ProjectShareState = {
  enabled: boolean;
  token: string | null;
};

export type SharedProject = {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
};

export type SharedProjectSummary = {
  requirements: Array<{
    id: string;
    title: string;
    type: RequirementType;
    status: RequirementStatus;
    priority: RequirementPriority;
  }>;
  decisions: Array<{ id: string; title: string; status: DecisionStatus }>;
  domains: Array<{ id: string; name: string }>;
  entities: Array<{ id: string; name: string; domain_id: string }>;
  relationships: number;
  components: Array<{
    id: string;
    name: string;
    type: ArchitectureComponentType;
  }>;
  technologies: Array<{ id: string; name: string; category: string }>;
  endpoints: Array<{
    id: string;
    method: ApiHttpMethod;
    path: string;
    name: string | null;
  }>;
  screens: Array<{
    id: string;
    name: string;
    route: string | null;
    screen_type: UiScreenType;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  }>;
};

// 192 bits of entropy: unguessable and safe to put in a URL.
export function generateShareToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function getProjectShareState(
  projectId: string,
  client?: SupabaseServerClient,
): Promise<ProjectShareState | null> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("projects")
    .select("share_enabled, share_token")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !data) return null;

  return { enabled: data.share_enabled, token: data.share_token };
}

// Public lookup by capability token. Uses the admin client because anonymous
// visitors have no row level security access to projects.
export async function getSharedProject(
  token: string,
): Promise<SharedProject | null> {
  if (!token || token.length > 128) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("projects")
    .select("id, name, description, updated_at")
    .eq("share_token", token)
    .eq("share_enabled", true)
    .maybeSingle();

  if (error || !data) return null;

  return data;
}

export async function loadShareSummary(
  projectId: string,
): Promise<SharedProjectSummary> {
  const admin = createAdminClient();

  const [
    requirements,
    decisions,
    domains,
    relationships,
    components,
    technologies,
    endpoints,
    screens,
    tasks,
  ] = await Promise.all([
    admin
      .from("requirements")
      .select("id, title, type, status, priority")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    admin
      .from("decisions")
      .select("id, title, status")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    admin
      .from("domains")
      .select("id, name")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    admin
      .from("entity_relationships")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId),
    admin
      .from("architecture_components")
      .select("id, name, type")
      .eq("project_id", projectId)
      .order("position", { ascending: true }),
    admin
      .from("architecture_technologies")
      .select("id, name, category")
      .eq("project_id", projectId)
      .order("name", { ascending: true }),
    admin
      .from("api_endpoints")
      .select("id, method, path, name")
      .eq("project_id", projectId)
      .order("position", { ascending: true }),
    admin
      .from("ui_screens")
      .select("id, name, route, screen_type")
      .eq("project_id", projectId)
      .order("position", { ascending: true }),
    admin
      .from("tasks")
      .select("id, title, status, priority")
      .eq("project_id", projectId)
      .order("position", { ascending: true }),
  ]);

  const domainIds = (domains.data ?? []).map((domain) => domain.id);
  const entityRows = domainIds.length
    ? ((
        await admin
          .from("entities")
          .select("id, name, domain_id")
          .in("domain_id", domainIds)
      ).data ?? [])
    : [];

  return {
    requirements: requirements.data ?? [],
    decisions: decisions.data ?? [],
    domains: domains.data ?? [],
    entities: entityRows,
    relationships: relationships.count ?? 0,
    components: components.data ?? [],
    technologies: technologies.data ?? [],
    endpoints: endpoints.data ?? [],
    screens: screens.data ?? [],
    tasks: tasks.data ?? [],
  };
}
