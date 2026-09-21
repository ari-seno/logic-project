"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  uiComponentInputSchema,
  uiComponentUpdateSchema,
  type UiComponentActionState,
} from "@/lib/validation/ui";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/projects/queries";
import { nextUiComponentPosition } from "./queries";

async function assertOwnsProject(projectId: string) {
  const project = await getProject(projectId);
  if (!project) return { ok: false, error: "Project not found." } as const;
  return { ok: true } as const;
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

export async function createUiComponent(
  _prev: UiComponentActionState | null,
  formData: FormData,
): Promise<UiComponentActionState> {
  const parsed = uiComponentInputSchema.safeParse({
    name: formData.get("name"),
    component_type: formData.get("component_type"),
    description: normalizeOpt(formData.get("description")),
    purpose: normalizeOpt(formData.get("purpose")),
    technology: normalizeOpt(formData.get("technology")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as UiComponentActionState["fieldErrors"],
    };
  }

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId) return { error: "Missing project reference." };
  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const position = await nextUiComponentPosition(projectId);
  const { data, error } = await supabase
    .from("ui_components")
    .insert({
      project_id: projectId,
      name: parsed.data.name,
      component_type: parsed.data.component_type as never,
      description: normalizeText(formData.get("description")) ?? null,
      purpose: normalizeText(formData.get("purpose")) ?? null,
      technology: normalizeText(formData.get("technology")) ?? null,
      position,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Failed to create component." };

  revalidatePath(`/projects/${projectId}/ui`);
  redirect(`/projects/${projectId}/ui`);
}

export async function updateUiComponent(
  _prev: UiComponentActionState | null,
  formData: FormData,
): Promise<UiComponentActionState> {
  const parsed = uiComponentUpdateSchema.safeParse({
    name: formData.get("name"),
    component_type: formData.get("component_type"),
    description: normalizeOpt(formData.get("description")),
    purpose: normalizeOpt(formData.get("purpose")),
    technology: normalizeOpt(formData.get("technology")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as UiComponentActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Missing component reference." };
  }
  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ui_components")
    .update({
      name: parsed.data.name,
      component_type: parsed.data.component_type as never,
      description: normalizeText(formData.get("description")) ?? null,
      purpose: normalizeText(formData.get("purpose")) ?? null,
      technology: normalizeText(formData.get("technology")) ?? null,
    })
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/ui`);
  redirect(`/projects/${projectId}/ui`);
}

export async function deleteUiComponent(formData: FormData) {
  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Invalid component reference" } as const;
  }
  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("ui_components")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);
  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${projectId}/ui`);
  redirect(`/projects/${projectId}/ui`);
}
