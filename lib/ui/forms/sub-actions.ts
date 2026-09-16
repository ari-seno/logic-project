"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  uiFormInputSchema,
  uiFormUpdateSchema,
  uiFormFieldInputSchema,
  uiFormFieldUpdateSchema,
  uiStateInputSchema,
  uiStateUpdateSchema,
  uiInteractionInputSchema,
  uiInteractionUpdateSchema,
  type UiFormActionState,
  type UiFormFieldActionState,
  type UiStateActionState,
  type UiInteractionActionState,
} from "@/lib/validation/ui";
import { createClient } from "@/lib/supabase/server";
import { getUiScreen } from "@/lib/ui/screens/queries";
import {
  getUiForm,
  getUiFormField,
  nextUiFormFieldPosition,
} from "./queries";

async function assertScreenSameProject(screenId: string) {
  const screen = await getUiScreen(screenId);
  if (!screen) return { ok: false, error: "Screen not found." } as const;
  return { ok: true, projectId: screen.project_id } as const;
}

async function assertFormSameProject(formId: string) {
  const form = await getUiForm(formId);
  if (!form) return { ok: false, error: "Form not found." } as const;
  const screen = await getUiScreen(form.screen_id);
  if (!screen) return { ok: false, error: "Screen not found." } as const;
  return { ok: true, projectId: screen.project_id, screenId: form.screen_id } as const;
}

function normalizeText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeOpt(value: FormDataEntryValue | null): string | undefined {
  const norm = normalizeText(value);
  return norm === null ? undefined : norm;
}

function parseCheckbox(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true";
}

// ============================================================================
// Forms
// ============================================================================
export async function createUiForm(
  _prev: UiFormActionState | null,
  formData: FormData,
): Promise<UiFormActionState> {
  const parsed = uiFormInputSchema.safeParse({
    name: formData.get("name"),
    description: normalizeOpt(formData.get("description")),
    submit_label: normalizeOpt(formData.get("submit_label")),
    success_behavior: normalizeOpt(formData.get("success_behavior")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as UiFormActionState["fieldErrors"],
    };
  }

  const screenId = formData.get("screenId");
  if (typeof screenId !== "string" || !screenId) {
    return { error: "Missing screen reference." };
  }
  const ownership = await assertScreenSameProject(screenId);
  if (!ownership.ok) return { error: ownership.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("ui_forms").insert({
    screen_id: screenId,
    name: parsed.data.name,
    description: normalizeText(formData.get("description")) ?? null,
    submit_label: normalizeText(formData.get("submit_label")) ?? null,
    success_behavior: normalizeText(formData.get("success_behavior")) ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/ui/${screenId}`);
  redirect(`/projects/${ownership.projectId}/ui/${screenId}`);
}

export async function updateUiForm(
  _prev: UiFormActionState | null,
  formData: FormData,
): Promise<UiFormActionState> {
  const parsed = uiFormUpdateSchema.safeParse({
    name: formData.get("name"),
    description: normalizeOpt(formData.get("description")),
    submit_label: normalizeOpt(formData.get("submit_label")),
    success_behavior: normalizeOpt(formData.get("success_behavior")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as UiFormActionState["fieldErrors"],
    };
  }
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing form reference." };
  const ownership = await assertFormSameProject(id);
  if (!ownership.ok) return { error: ownership.error };

  const supabase = await createClient();
  const { error } = await supabase.from("ui_forms").update({
    name: parsed.data.name,
    description: normalizeText(formData.get("description")) ?? null,
    submit_label: normalizeText(formData.get("submit_label")) ?? null,
    success_behavior: normalizeText(formData.get("success_behavior")) ?? null,
  }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/ui/${ownership.screenId}`);
  redirect(`/projects/${ownership.projectId}/ui/${ownership.screenId}`);
}

export async function deleteUiForm(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Invalid form reference" } as const;
  const ownership = await assertFormSameProject(id);
  if (!ownership.ok) return { error: ownership.error } as const;

  const supabase = await createClient();
  const { error } = await supabase.from("ui_forms").delete().eq("id", id);
  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/ui/${ownership.screenId}`);
  redirect(`/projects/${ownership.projectId}/ui/${ownership.screenId}`);
}

// ============================================================================
// Form Fields
// ============================================================================
async function assertFieldSameProject(fieldId: string) {
  const field = await getUiFormField(fieldId);
  if (!field) return { ok: false, error: "Field not found." } as const;
  const ownership = await assertFormSameProject(field.form_id);
  if (!ownership.ok) return { ok: false, error: ownership.error } as const;
  return { ok: true, projectId: ownership.projectId, screenId: ownership.screenId } as const;
}

export async function createUiFormField(
  _prev: UiFormFieldActionState | null,
  formData: FormData,
): Promise<UiFormFieldActionState> {
  const parsed = uiFormFieldInputSchema.safeParse({
    name: formData.get("name"),
    label: formData.get("label"),
    field_type: formData.get("field_type"),
    required: formData.get("required") ?? "",
    placeholder: normalizeOpt(formData.get("placeholder")),
    help_text: normalizeOpt(formData.get("help_text")),
    default_value: normalizeOpt(formData.get("default_value")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as UiFormFieldActionState["fieldErrors"],
    };
  }

  const formId = formData.get("formId");
  if (typeof formId !== "string" || !formId) return { error: "Missing form reference." };
  const ownership = await assertFormSameProject(formId);
  if (!ownership.ok) return { error: ownership.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const position = await nextUiFormFieldPosition(formId);
  const { error } = await supabase.from("ui_form_fields").insert({
    form_id: formId,
    name: parsed.data.name,
    label: parsed.data.label,
    field_type: parsed.data.field_type as never,
    required: parseCheckbox(formData.get("required")),
    placeholder: normalizeText(formData.get("placeholder")) ?? null,
    help_text: normalizeText(formData.get("help_text")) ?? null,
    default_value: normalizeText(formData.get("default_value")) ?? null,
    position,
  });
  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/ui/${ownership.screenId}`);
  redirect(`/projects/${ownership.projectId}/ui/${ownership.screenId}`);
}

export async function updateUiFormField(
  _prev: UiFormFieldActionState | null,
  formData: FormData,
): Promise<UiFormFieldActionState> {
  const parsed = uiFormFieldUpdateSchema.safeParse({
    name: formData.get("name"),
    label: formData.get("label"),
    field_type: formData.get("field_type"),
    required: formData.get("required") ?? "",
    placeholder: normalizeOpt(formData.get("placeholder")),
    help_text: normalizeOpt(formData.get("help_text")),
    default_value: normalizeOpt(formData.get("default_value")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as UiFormFieldActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing field reference." };
  const ownership = await assertFieldSameProject(id);
  if (!ownership.ok) return { error: ownership.error };

  const supabase = await createClient();
  const { error } = await supabase.from("ui_form_fields").update({
    name: parsed.data.name,
    label: parsed.data.label,
    field_type: parsed.data.field_type as never,
    required: parseCheckbox(formData.get("required")),
    placeholder: normalizeText(formData.get("placeholder")) ?? null,
    help_text: normalizeText(formData.get("help_text")) ?? null,
    default_value: normalizeText(formData.get("default_value")) ?? null,
  }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/ui/${ownership.screenId}`);
  redirect(`/projects/${ownership.projectId}/ui/${ownership.screenId}`);
}

export async function deleteUiFormField(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Invalid field reference" } as const;
  const ownership = await assertFieldSameProject(id);
  if (!ownership.ok) return { error: ownership.error } as const;

  const supabase = await createClient();
  const { error } = await supabase.from("ui_form_fields").delete().eq("id", id);
  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/ui/${ownership.screenId}`);
  redirect(`/projects/${ownership.projectId}/ui/${ownership.screenId}`);
}

// ============================================================================
// States
// ============================================================================
export async function createUiState(
  _prev: UiStateActionState | null,
  formData: FormData,
): Promise<UiStateActionState> {
  const parsed = uiStateInputSchema.safeParse({
    name: formData.get("name"),
    state_type: formData.get("state_type"),
    description: normalizeOpt(formData.get("description")),
    behavior: normalizeOpt(formData.get("behavior")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as UiStateActionState["fieldErrors"],
    };
  }
  const screenId = formData.get("screenId");
  if (typeof screenId !== "string" || !screenId) return { error: "Missing screen reference." };
  const ownership = await assertScreenSameProject(screenId);
  if (!ownership.ok) return { error: ownership.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("ui_states").insert({
    screen_id: screenId,
    name: parsed.data.name,
    state_type: parsed.data.state_type as never,
    description: normalizeText(formData.get("description")) ?? null,
    behavior: normalizeText(formData.get("behavior")) ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/ui/${screenId}`);
  redirect(`/projects/${ownership.projectId}/ui/${screenId}`);
}

export async function updateUiState(
  _prev: UiStateActionState | null,
  formData: FormData,
): Promise<UiStateActionState> {
  const parsed = uiStateUpdateSchema.safeParse({
    name: formData.get("name"),
    state_type: formData.get("state_type"),
    description: normalizeOpt(formData.get("description")),
    behavior: normalizeOpt(formData.get("behavior")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as UiStateActionState["fieldErrors"],
    };
  }
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing state reference." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("ui_states")
    .select("screen_id, ui_screens!inner(project_id)")
    .eq("id", id)
    .maybeSingle();
  const projectId = (existing as { ui_screens: { project_id: string } | null } | null)?.ui_screens?.project_id;
  const screenId = (existing as { screen_id: string } | null)?.screen_id;
  if (!projectId || !screenId) return { error: "State not found." };

  const ownership = await assertScreenSameProject(screenId);
  if (!ownership.ok) return { error: ownership.error };

  const { error } = await supabase.from("ui_states").update({
    name: parsed.data.name,
    state_type: parsed.data.state_type as never,
    description: normalizeText(formData.get("description")) ?? null,
    behavior: normalizeText(formData.get("behavior")) ?? null,
  }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/ui/${screenId}`);
  redirect(`/projects/${ownership.projectId}/ui/${screenId}`);
}

export async function deleteUiState(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Invalid state reference" } as const;
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("ui_states")
    .select("screen_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { error: "State not found." } as const;
  const ownership = await assertScreenSameProject(existing.screen_id);
  if (!ownership.ok) return { error: ownership.error } as const;

  const { error } = await supabase.from("ui_states").delete().eq("id", id);
  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/ui/${ownership.projectId ? existing.screen_id : existing.screen_id}`);
  redirect(`/projects/${ownership.projectId}/ui/${existing.screen_id}`);
}

// ============================================================================
// Interactions
// ============================================================================
export async function createUiInteraction(
  _prev: UiInteractionActionState | null,
  formData: FormData,
): Promise<UiInteractionActionState> {
  const parsed = uiInteractionInputSchema.safeParse({
    name: formData.get("name"),
    trigger: formData.get("trigger"),
    action: formData.get("action"),
    description: normalizeOpt(formData.get("description")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as UiInteractionActionState["fieldErrors"],
    };
  }
  const screenId = formData.get("screenId");
  if (typeof screenId !== "string" || !screenId) return { error: "Missing screen reference." };
  const ownership = await assertScreenSameProject(screenId);
  if (!ownership.ok) return { error: ownership.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("ui_interactions").insert({
    screen_id: screenId,
    name: parsed.data.name,
    trigger: parsed.data.trigger,
    action: parsed.data.action,
    description: normalizeText(formData.get("description")) ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/ui/${screenId}`);
  redirect(`/projects/${ownership.projectId}/ui/${screenId}`);
}

export async function updateUiInteraction(
  _prev: UiInteractionActionState | null,
  formData: FormData,
): Promise<UiInteractionActionState> {
  const parsed = uiInteractionUpdateSchema.safeParse({
    name: formData.get("name"),
    trigger: formData.get("trigger"),
    action: formData.get("action"),
    description: normalizeOpt(formData.get("description")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as UiInteractionActionState["fieldErrors"],
    };
  }
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing interaction reference." };
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("ui_interactions")
    .select("screen_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { error: "Interaction not found." };
  const ownership = await assertScreenSameProject(existing.screen_id);
  if (!ownership.ok) return { error: ownership.error };

  const { error } = await supabase.from("ui_interactions").update({
    name: parsed.data.name,
    trigger: parsed.data.trigger,
    action: parsed.data.action,
    description: normalizeText(formData.get("description")) ?? null,
  }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/ui/${existing.screen_id}`);
  redirect(`/projects/${ownership.projectId}/ui/${existing.screen_id}`);
}

export async function deleteUiInteraction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Invalid interaction reference" } as const;
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("ui_interactions")
    .select("screen_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { error: "Interaction not found." } as const;
  const ownership = await assertScreenSameProject(existing.screen_id);
  if (!ownership.ok) return { error: ownership.error } as const;

  const { error } = await supabase.from("ui_interactions").delete().eq("id", id);
  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/ui/${existing.screen_id}`);
  redirect(`/projects/${ownership.projectId}/ui/${existing.screen_id}`);
}
