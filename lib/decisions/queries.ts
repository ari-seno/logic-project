import { createClient } from "@/lib/supabase/server";
import type { Decision } from "@/lib/supabase/types";

export type ListDecisionsOptions = {
  projectId: string;
  limit?: number;
};

export async function listDecisions(
  options: ListDecisionsOptions,
): Promise<Decision[]> {
  const { projectId, limit } = options;
  const supabase = await createClient();

  let query = supabase
    .from("decisions")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listDecisions failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function countDecisions(projectId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("decisions")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (error) {
    console.error("countDecisions failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function getDecision(id: string): Promise<Decision | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("decisions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getDecision failed:", error.message);
    return null;
  }
  return data ?? null;
}
