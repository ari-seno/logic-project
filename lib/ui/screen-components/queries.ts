import { createClient } from "@/lib/supabase/server";
import type { UiScreenComponent } from "@/lib/supabase/types";

export type ScreenComponentWithComponent = UiScreenComponent & {
  component_name: string;
  component_type: string;
};

export async function listScreenComponents(
  screenId: string,
): Promise<ScreenComponentWithComponent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_screen_components")
    .select("*, ui_components(name, component_type)")
    .eq("screen_id", screenId)
    .order("position", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => {
    const r = row as UiScreenComponent & {
      ui_components: { name: string; component_type: string } | null;
    };
    return {
      id: r.id,
      screen_id: r.screen_id,
      component_id: r.component_id,
      parent_id: r.parent_id,
      label: r.label,
      description: r.description,
      position: r.position,
      required: r.required,
      created_at: r.created_at,
      updated_at: r.updated_at,
      component_name: r.ui_components?.name ?? "(deleted)",
      component_type: r.ui_components?.component_type ?? "other",
    };
  });
}

export async function getScreenComponent(
  id: string,
): Promise<UiScreenComponent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_screen_components")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function nextScreenComponentPosition(
  screenId: string,
): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ui_screen_components")
    .select("position")
    .eq("screen_id", screenId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? -1) + 1;
}
