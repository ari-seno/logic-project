import { createClient } from "@/lib/supabase/server";
import type { ArchitectureComponent } from "@/lib/supabase/types";

export type ListArchitectureComponentsOptions = {
  projectId: string;
  limit?: number;
};

export async function listArchitectureComponentsByProject(
  options: ListArchitectureComponentsOptions,
): Promise<ArchitectureComponent[]> {
  const { projectId, limit } = options;
  const supabase = await createClient();
  let query = supabase
    .from("architecture_components")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listArchitectureComponentsByProject failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function countArchitectureComponentsByProject(
  projectId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("architecture_components")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (error) {
    return 0;
  }
  return count ?? 0;
}

export async function getArchitectureComponent(
  id: string,
): Promise<ArchitectureComponent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("architecture_components")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    return null;
  }
  return data ?? null;
}

export async function nextArchitectureComponentPosition(
  projectId: string,
): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("architecture_components")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? -1) + 1;
}
