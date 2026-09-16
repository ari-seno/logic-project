"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  uiScreenComponentInputSchema,
  uiScreenComponentUpdateSchema,
  type UiScreenComponentActionState,
} from "@/lib/validation/ui";
import { createClient } from "@/lib/supabase/server";
import { getUiComponent } from "@/lib/ui/components/queries";
import { getUiScreen } from "@/lib/ui/screens/queries";
import { getScreenComponent, nextScreenComponentPosition } from "./queries";

async function assertScreenSameProject(
  screenId: string,
): Promise<{ ok: true; projectId: string } | { ok: false; error: string }> {
  const screen = await getUiScreen(screenId);
  if (!screen) return { ok: false, error: "Screen not found." };
  return { ok: true, projectId: screen.project_id };
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

async function assertComponentInProject(
  componentId: string,
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = await getUiComponent(componentId);
  if (!c || c.project_id !== projectId) {
    return { ok: false, error: "Selected component is not part of this project." };
  }
  return { ok: true };
}

async function assertParentInScreen(
  parentId: string,
  screenId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sc = await getScreenComponent(parentId);
  if (!sc || sc.screen_id !== screenId) {
    return { ok: false, error: "Parent placement must belong to the same screen." };
  }
  return { ok: true };
}

export async function addScreenComponent(
  _prev: UiScreenComponentActionState | null,
  formData: FormData,
): Promise<UiScreenComponentActionState> {
  const parsed = uiScreenComponentInputSchema.safeParse({
    component_id: formData.get("component_id"),
    parent_id: formData.get("parent_id") ?? "",
    label: normalizeOpt(formData.get("label")),
    description: normalizeOpt(formData.get("description")),
    required: formData.get("required") ?? "",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as UiScreenComponentActionState["fieldErrors"],
    };
  }

  const screenId = formData.get("screenId");
  if (typeof screenId !== "string" || !screenId) {
    return { error: "Missing screen reference." };
  }
  const ownership = await assertScreenSameProject(screenId);
  if (!ownership.ok) return { error: ownership.error };

  const compOwnership = await assertComponentInProject(
    parsed.data.component_id,
    ownership.projectId,
  );
  if (!compOwnership.ok) return { error: compOwnership.error };

  if (typeof parsed.data.parent_id === "string" && parsed.data.parent_id.length > 0) {
    const parentOwnership = await assertParentInScreen(
      parsed.data.parent_id,
      screenId,
    );
    if (!parentOwnership.ok) return { error: parentOwnership.error };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const position = await nextScreenComponentPosition(screenId);
  const parentId = typeof parsed.data.parent_id === "string" && parsed.data.parent_id.length > 0
    ? parsed.data.parent_id
    : null;

  const { error } = await supabase
    .from("ui_screen_components")
    .insert({
      screen_id: screenId,
      component_id: parsed.data.component_id,
      parent_id: parentId,
      label: normalizeText(formData.get("label")) ?? null,
      description: normalizeText(formData.get("description")) ?? null,
      position,
      required: parseCheckbox(formData.get("required")),
    });
  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/ui/${screenId}`);
  redirect(`/projects/${ownership.projectId}/ui/${screenId}`);
}

export async function updateScreenComponent(
  _prev: UiScreenComponentActionState | null,
  formData: FormData,
): Promise<UiScreenComponentActionState> {
  const parsed = uiScreenComponentUpdateSchema.safeParse({
    component_id: formData.get("component_id"),
    parent_id: formData.get("parent_id") ?? "",
    label: normalizeOpt(formData.get("label")),
    description: normalizeOpt(formData.get("description")),
    required: formData.get("required") ?? "",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as UiScreenComponentActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  const screenId = formData.get("screenId");
  if (typeof id !== "string" || !id || typeof screenId !== "string" || !screenId) {
    return { error: "Missing placement reference." };
  }
  const ownership = await assertScreenSameProject(screenId);
  if (!ownership.ok) return { error: ownership.error };

  const compOwnership = await assertComponentInProject(
    parsed.data.component_id,
    ownership.projectId,
  );
  if (!compOwnership.ok) return { error: compOwnership.error };

  if (typeof parsed.data.parent_id === "string" && parsed.data.parent_id.length > 0) {
    if (parsed.data.parent_id === id) {
      return { error: "A placement cannot be its own parent." };
    }
    const parentOwnership = await assertParentInScreen(
      parsed.data.parent_id,
      screenId,
    );
    if (!parentOwnership.ok) return { error: parentOwnership.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ui_screen_components")
    .update({
      component_id: parsed.data.component_id,
      parent_id:
        typeof parsed.data.parent_id === "string" && parsed.data.parent_id.length > 0
          ? parsed.data.parent_id
          : null,
      label: normalizeText(formData.get("label")) ?? null,
      description: normalizeText(formData.get("description")) ?? null,
      required: parseCheckbox(formData.get("required")),
    })
    .eq("id", id)
    .eq("screen_id", screenId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/ui/${screenId}`);
  redirect(`/projects/${ownership.projectId}/ui/${screenId}`);
}

export async function removeScreenComponent(formData: FormData) {
  const id = formData.get("id");
  const screenId = formData.get("screenId");
  if (typeof id !== "string" || !id || typeof screenId !== "string" || !screenId) {
    return { error: "Invalid placement reference" } as const;
  }
  const ownership = await assertScreenSameProject(screenId);
  if (!ownership.ok) return { error: ownership.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("ui_screen_components")
    .delete()
    .eq("id", id)
    .eq("screen_id", screenId);
  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/ui/${screenId}`);
  redirect(`/projects/${ownership.projectId}/ui/${screenId}`);
}
