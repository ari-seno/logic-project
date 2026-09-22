import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";
import type { UiComponent } from "@/lib/supabase/types";

export async function listUiComponentsByProject({
  projectId,
}: {
  projectId: string;
}): Promise<UiComponent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_components")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function countUiComponentsByProject(
  projectId: string,
  client?: SupabaseServerClient,
): Promise<number> {
  const supabase = client ?? (await createClient());
  const { count, error } = await supabase
    .from("ui_components")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (error) return 0;
  return count ?? 0;
}

export async function getUiComponent(id: string): Promise<UiComponent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_components")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function nextUiComponentPosition(
  projectId: string,
): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ui_components")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? -1) + 1;
}
