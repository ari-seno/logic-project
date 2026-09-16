"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  uiScreenInputSchema,
  uiScreenUpdateSchema,
  type UiScreenActionState,
} from "@/lib/validation/ui";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/projects/queries";
import {
  nextUiScreenPosition,
} from "./queries";

async function assertOwnsProject(
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const project = await getProject(projectId);
  if (!project) return { ok: false, error: "Project not found." };
  return { ok: true };
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

export async function createUiScreen(
  _prev: UiScreenActionState | null,
  formData: FormData,
): Promise<UiScreenActionState> {
  const parsed = uiScreenInputSchema.safeParse({
    name: formData.get("name"),
    route: normalizeOpt(formData.get("route")),
    screen_type: formData.get("screen_type"),
    description: normalizeOpt(formData.get("description")),
    purpose: normalizeOpt(formData.get("purpose")),
    authentication_required: formData.get("authentication_required") === "on",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as UiScreenActionState["fieldErrors"],
    };
  }

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId) {
    return { error: "Missing project reference." };
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const position = await nextUiScreenPosition(projectId);
  const { data, error } = await supabase
    .from("ui_screens")
    .insert({
      project_id: projectId,
      name: parsed.data.name,
      route: normalizeText(formData.get("route")) ?? null,
      screen_type: parsed.data.screen_type as never,
      description: normalizeText(formData.get("description")) ?? null,
      purpose: normalizeText(formData.get("purpose")) ?? null,
      authentication_required: parsed.data.authentication_required,
      position,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create screen." };

  revalidatePath(`/projects/${projectId}/ui`);
  redirect(`/projects/${projectId}/ui`);
}

export async function updateUiScreen(
  _prev: UiScreenActionState | null,
  formData: FormData,
): Promise<UiScreenActionState> {
  const parsed = uiScreenUpdateSchema.safeParse({
    name: formData.get("name"),
    route: normalizeOpt(formData.get("route")),
    screen_type: formData.get("screen_type"),
    description: normalizeOpt(formData.get("description")),
    purpose: normalizeOpt(formData.get("purpose")),
    authentication_required: formData.get("authentication_required") === "on",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as UiScreenActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Missing screen reference." };
  }
  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ui_screens")
    .update({
      name: parsed.data.name,
      route: normalizeText(formData.get("route")) ?? null,
      screen_type: parsed.data.screen_type as never,
      description: normalizeText(formData.get("description")) ?? null,
      purpose: normalizeText(formData.get("purpose")) ?? null,
      authentication_required: parsed.data.authentication_required,
    })
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/ui`);
  revalidatePath(`/projects/${projectId}/ui/${id}`);
  redirect(`/projects/${projectId}/ui`);
}

export async function deleteUiScreen(formData: FormData) {
  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Invalid screen reference" } as const;
  }
  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("ui_screens")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);
  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${projectId}/ui`);
  redirect(`/projects/${projectId}/ui`);
}
