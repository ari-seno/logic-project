import { createClient } from "@/lib/supabase/server";
import type { UiScreen } from "@/lib/supabase/types";

export async function listUiScreensByProject({
  projectId,
  limit,
}: {
  projectId: string;
  limit?: number;
}): Promise<UiScreen[]> {
  const supabase = await createClient();
  let q = supabase
    .from("ui_screens")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) return [];
  return data ?? [];
}

export async function countUiScreensByProject(
  projectId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("ui_screens")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (error) return 0;
  return count ?? 0;
}

export async function getUiScreen(id: string): Promise<UiScreen | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_screens")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function getUiScreenWithProject(
  id: string,
): Promise<UiScreen | null> {
  return getUiScreen(id);
}

export async function nextUiScreenPosition(
  projectId: string,
): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ui_screens")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? -1) + 1;
}
