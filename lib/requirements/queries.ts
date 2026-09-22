import {
  createClient,
  type SupabaseServerClient,
} from "@/lib/supabase/server";
import type { Requirement } from "@/lib/supabase/types";

export type ListRequirementsOptions = {
  projectId: string;
  limit?: number;
  client?: SupabaseServerClient;
};

export async function listRequirements(
  options: ListRequirementsOptions,
): Promise<Requirement[]> {
  const { projectId, limit, client } = options;
  const supabase = client ?? (await createClient());

  let query = supabase
    .from("requirements")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listRequirements failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function countRequirements(
  projectId: string,
  client?: SupabaseServerClient,
): Promise<number> {
  const supabase = client ?? (await createClient());
  const { count, error } = await supabase
    .from("requirements")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (error) {
    console.error("countRequirements failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function getRequirement(
  id: string,
): Promise<Requirement | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requirements")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getRequirement failed:", error.message);
    return null;
  }
  return data ?? null;
}
