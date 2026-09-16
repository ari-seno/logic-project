import { createClient } from "@/lib/supabase/server";
import type { UiNavigationItem } from "@/lib/supabase/types";

export async function listUiNavigationItemsByProject({
  projectId,
}: {
  projectId: string;
}): Promise<UiNavigationItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_navigation_items")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function getUiNavigationItem(
  id: string,
): Promise<UiNavigationItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_navigation_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function countUiNavigationItemsByProject(
  projectId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("ui_navigation_items")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (error) return 0;
  return count ?? 0;
}

export async function nextUiNavigationItemPosition(
  projectId: string,
): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ui_navigation_items")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? -1) + 1;
}

export async function listUiNavigationScreensByItem(
  itemId: string,
): Promise<{ id: string; screen_id: string; screen_name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_navigation_screens")
    .select("id, screen_id, ui_screens(name)")
    .eq("navigation_item_id", itemId);
  if (error || !data) return [];
  return data.map((row) => {
    const r = row as { id: string; screen_id: string; ui_screens: { name: string } | null };
    return {
      id: r.id,
      screen_id: r.screen_id,
      screen_name: r.ui_screens?.name ?? "(deleted)",
    };
  });
}
