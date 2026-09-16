import { createClient } from "@/lib/supabase/server";
import type { ApiGroup } from "@/lib/supabase/types";

export type ApiGroupWithEndpointCount = ApiGroup & {
  endpoint_count: number;
};

export async function listApiGroupsByProject({
  projectId,
}: {
  projectId: string;
}): Promise<ApiGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_groups")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function listApiGroupsWithEndpointCount({
  projectId,
}: {
  projectId: string;
}): Promise<ApiGroupWithEndpointCount[]> {
  const supabase = await createClient();
  const { data: groups, error: groupsErr } = await supabase
    .from("api_groups")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (groupsErr || !groups) return [];
  const { data: endpoints } = await supabase
    .from("api_endpoints")
    .select("group_id")
    .eq("project_id", projectId);
  const counts = new Map<string, number>();
  for (const e of endpoints ?? []) {
    if (e.group_id) {
      counts.set(e.group_id, (counts.get(e.group_id) ?? 0) + 1);
    }
  }
  return groups.map((g) => ({
    ...g,
    endpoint_count: counts.get(g.id) ?? 0,
  }));
}

export async function countApiGroupsByProject(
  projectId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("api_groups")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (error) return 0;
  return count ?? 0;
}

export async function getApiGroup(id: string): Promise<ApiGroup | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_groups")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}
