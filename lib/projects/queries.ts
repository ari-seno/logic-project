import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/supabase/types";

export type ListProjectsOptions = {
  limit?: number;
};

export async function listProjects(
  options: ListProjectsOptions = {},
): Promise<Project[]> {
  const supabase = await createClient();
  const { limit } = options;

  let query = supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listProjects failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getProject failed:", error.message);
    return null;
  }
  return data ?? null;
}
