import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/supabase/types";

export type ListProjectsOptions = {
  limit?: number;
  client?: SupabaseServerClient;
};

export async function listProjects(
  options: ListProjectsOptions = {},
): Promise<Project[]> {
  const { limit, client } = options;
  const supabase = client ?? (await createClient());

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

export async function getProject(
  id: string,
  client?: SupabaseServerClient,
): Promise<Project | null> {
  const supabase = client ?? (await createClient());
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

export async function countProjects(
  client?: SupabaseServerClient,
): Promise<number> {
  const supabase = client ?? (await createClient());
  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("countProjects failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function countProjectsUpdatedWithinDays(
  days: number,
  client?: SupabaseServerClient,
): Promise<number> {
  const supabase = client ?? (await createClient());
  const since = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .gte("updated_at", since);

  if (error) {
    console.error("countProjectsUpdatedWithinDays failed:", error.message);
    return 0;
  }
  return count ?? 0;
}
