import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";

export type ProjectViewSummary = {
  id: string;
  project_id: string;
  scope: string;
  label: string;
  query: string;
  created_at: string;
};

export async function listProjectViews(
  projectId: string,
  scope: string,
  client?: SupabaseServerClient,
): Promise<ProjectViewSummary[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("project_views")
    .select("id, project_id, scope, label, query, created_at")
    .eq("project_id", projectId)
    .eq("scope", scope)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("listProjectViews failed:", error.message);
    return [];
  }

  return data ?? [];
}
