import {
  createClient,
  type SupabaseServerClient,
} from "@/lib/supabase/server";
import type { ArchitectureTechnology } from "@/lib/supabase/types";

export type ListArchitectureTechnologiesOptions = {
  projectId: string;
  limit?: number;
};

export async function listArchitectureTechnologiesByProject(
  options: ListArchitectureTechnologiesOptions,
): Promise<ArchitectureTechnology[]> {
  const { projectId, limit } = options;
  const supabase = await createClient();
  let query = supabase
    .from("architecture_technologies")
    .select("*")
    .eq("project_id", projectId)
    .order("name", { ascending: true });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listArchitectureTechnologiesByProject failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function countArchitectureTechnologiesByProject(
  projectId: string,
  client?: SupabaseServerClient,
): Promise<number> {
  const supabase = client ?? (await createClient());
  const { count, error } = await supabase
    .from("architecture_technologies")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (error) {
    return 0;
  }
  return count ?? 0;
}

export async function getArchitectureTechnology(
  id: string,
): Promise<ArchitectureTechnology | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("architecture_technologies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    return null;
  }
  return data ?? null;
}
