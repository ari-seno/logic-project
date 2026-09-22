import {
  createClient,
  type SupabaseServerClient,
} from "@/lib/supabase/server";
import type { Entity } from "@/lib/supabase/types";

export type ListEntitiesOptions = {
  domainId?: string;
  limit?: number;
};

export async function listEntities(
  options: ListEntitiesOptions,
): Promise<Entity[]> {
  const { domainId, limit } = options;
  const supabase = await createClient();

  let query = supabase
    .from("entities")
    .select("*")
    .order("updated_at", { ascending: false });

  if (domainId) {
    query = query.eq("domain_id", domainId);
  }
  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listEntities failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function listEntitiesByProject(
  projectId: string,
): Promise<Entity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entities")
    .select("*, domains!inner(project_id)")
    .eq("domains.project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("listEntitiesByProject failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => {
    const entity = row as Entity & { domains: { project_id: string } };
    const { domains: _drop, ...rest } = entity;
    void _drop;
    return rest;
  });
}

export async function countEntitiesByProject(
  projectId: string,
  client?: SupabaseServerClient,
): Promise<number> {
  const supabase = client ?? (await createClient());
  const { count, error } = await supabase
    .from("entities")
    .select("*, domains!inner(project_id)", { count: "exact", head: true })
    .eq("domains.project_id", projectId);

  if (error) {
    console.error("countEntitiesByProject failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function getEntity(id: string): Promise<Entity | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getEntity failed:", error.message);
    return null;
  }
  return data ?? null;
}

export async function getEntityWithProject(
  id: string,
): Promise<{ entity: Entity; projectId: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entities")
    .select("*, domains!inner(project_id)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  const { domains, ...entity } = data as Entity & {
    domains: { project_id: string };
  };
  return { entity, projectId: domains.project_id };
}
