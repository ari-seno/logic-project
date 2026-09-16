import { createClient } from "@/lib/supabase/server";
import type { ArchitectureDecision } from "@/lib/supabase/types";

export type ListArchitectureDecisionsOptions = {
  projectId: string;
  limit?: number;
};

export async function listArchitectureDecisionsByProject(
  options: ListArchitectureDecisionsOptions,
): Promise<ArchitectureDecision[]> {
  const { projectId, limit } = options;
  const supabase = await createClient();
  let query = supabase
    .from("architecture_decisions")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listArchitectureDecisionsByProject failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function countArchitectureDecisionsByProject(
  projectId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("architecture_decisions")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (error) {
    return 0;
  }
  return count ?? 0;
}

export async function getArchitectureDecision(
  id: string,
): Promise<ArchitectureDecision | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("architecture_decisions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    return null;
  }
  return data ?? null;
}
