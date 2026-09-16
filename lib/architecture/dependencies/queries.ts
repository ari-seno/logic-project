import { createClient } from "@/lib/supabase/server";
import type { ArchitectureComponentDependency } from "@/lib/supabase/types";

export type ListArchitectureComponentDependenciesOptions = {
  projectId: string;
};

export async function listArchitectureComponentDependenciesByProject(
  options: ListArchitectureComponentDependenciesOptions,
): Promise<ArchitectureComponentDependency[]> {
  const { projectId } = options;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("architecture_component_dependencies")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("listArchitectureComponentDependenciesByProject failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function countArchitectureComponentDependenciesByProject(
  projectId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("architecture_component_dependencies")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (error) {
    return 0;
  }
  return count ?? 0;
}

export async function getArchitectureComponentDependency(
  id: string,
): Promise<ArchitectureComponentDependency | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("architecture_component_dependencies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    return null;
  }
  return data ?? null;
}
