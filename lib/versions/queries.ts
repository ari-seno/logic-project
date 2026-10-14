import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";
import type { ProjectVersion } from "@/lib/supabase/types";

export type ProjectVersionSummary = {
  id: string;
  project_id: string;
  label: string;
  item_count: number;
  created_by: string | null;
  created_at: string;
};

export async function listProjectVersions(
  projectId: string,
  client?: SupabaseServerClient,
): Promise<ProjectVersionSummary[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("project_versions")
    .select("id, project_id, label, item_count, created_by, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listProjectVersions failed:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getProjectVersion(
  versionId: string,
  client?: SupabaseServerClient,
): Promise<ProjectVersion | null> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("project_versions")
    .select("*")
    .eq("id", versionId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}
