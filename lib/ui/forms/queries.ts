import { createClient } from "@/lib/supabase/server";
import type {
  UiForm,
  UiFormField,
  UiInteraction,
  UiState,
} from "@/lib/supabase/types";

export async function listUiFormsByScreen(
  screenId: string,
): Promise<UiForm[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_forms")
    .select("*")
    .eq("screen_id", screenId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function getUiForm(id: string): Promise<UiForm | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_forms")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function listUiFormFields(formId: string): Promise<UiFormField[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_form_fields")
    .select("*")
    .eq("form_id", formId)
    .order("position", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function getUiFormField(id: string): Promise<UiFormField | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_form_fields")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function nextUiFormFieldPosition(
  formId: string,
): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ui_form_fields")
    .select("position")
    .eq("form_id", formId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? -1) + 1;
}

export async function listUiStatesByScreen(
  screenId: string,
): Promise<UiState[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_states")
    .select("*")
    .eq("screen_id", screenId)
    .order("state_type", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function getUiState(id: string): Promise<UiState | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_states")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function listUiInteractionsByScreen(
  screenId: string,
): Promise<UiInteraction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_interactions")
    .select("*")
    .eq("screen_id", screenId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function getUiInteraction(id: string): Promise<UiInteraction | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ui_interactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function countUiFormsByProject(
  projectId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("ui_forms")
    .select("id, ui_screens!inner(project_id)", { count: "exact", head: true })
    .eq("ui_screens.project_id", projectId);
  if (error) return 0;
  return count ?? 0;
}

export async function countUiInteractionsByProject(
  projectId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("ui_interactions")
    .select("id, ui_screens!inner(project_id)", { count: "exact", head: true })
    .eq("ui_screens.project_id", projectId);
  if (error) return 0;
  return count ?? 0;
}
