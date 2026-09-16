"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  uiNavigationItemInputSchema,
  uiNavigationItemUpdateSchema,
  type UiNavigationItemActionState,
} from "@/lib/validation/ui";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/projects/queries";
import {
  getUiNavigationItem,
  listUiNavigationScreensByItem,
  nextUiNavigationItemPosition,
} from "./queries";

async function assertOwnsProject(projectId: string) {
  const project = await getProject(projectId);
  if (!project) return { ok: false, error: "Project not found." } as const;
  return { ok: true } as const;
}

async function assertSameProject(
  itemId: string,
): Promise<{ ok: true; projectId: string } | { ok: false; error: string }> {
  const item = await getUiNavigationItem(itemId);
  if (!item) return { ok: false, error: "Navigation item not found." };
  return { ok: true, projectId: item.project_id };
}

async function assertParentValid(
  parentId: string,
  projectId: string,
  selfId?: string,
) {
  if (selfId && parentId === selfId) {
    return { ok: false, error: "A navigation item cannot be its own parent." } as const;
  }
  const parent = await getUiNavigationItem(parentId);
  if (!parent || parent.project_id !== projectId) {
    return { ok: false, error: "Parent must belong to the same project." } as const;
  }
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

export async function createUiNavigationItem(
  _prev: UiNavigationItemActionState | null,
  formData: FormData,
): Promise<UiNavigationItemActionState> {
  const parsed = uiNavigationItemInputSchema.safeParse({
    name: formData.get("name"),
    label: formData.get("label"),
    route: normalizeOpt(formData.get("route")),
    parent_id: formData.get("parent_id") ?? "",
    description: normalizeOpt(formData.get("description")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as UiNavigationItemActionState["fieldErrors"],
    };
  }

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId) return { error: "Missing project reference." };
  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error };

  const parentId =
    typeof parsed.data.parent_id === "string" && parsed.data.parent_id.length > 0
      ? parsed.data.parent_id
      : null;
  if (parentId) {
    const parentCheck = await assertParentValid(parentId, projectId);
    if (!parentCheck.ok) return { error: parentCheck.error };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const position = await nextUiNavigationItemPosition(projectId);
  const { data, error } = await supabase
    .from("ui_navigation_items")
    .insert({
      project_id: projectId,
      name: parsed.data.name,
      label: parsed.data.label,
      route: normalizeText(formData.get("route")) ?? null,
      parent_id: parentId,
      position,
      description: normalizeText(formData.get("description")) ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Failed to create navigation item." };

  revalidatePath(`/projects/${projectId}/ui`);
  redirect(`/projects/${projectId}/ui`);
}

export async function updateUiNavigationItem(
  _prev: UiNavigationItemActionState | null,
  formData: FormData,
): Promise<UiNavigationItemActionState> {
  const parsed = uiNavigationItemUpdateSchema.safeParse({
    name: formData.get("name"),
    label: formData.get("label"),
    route: normalizeOpt(formData.get("route")),
    parent_id: formData.get("parent_id") ?? "",
    description: normalizeOpt(formData.get("description")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as UiNavigationItemActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing navigation item reference." };
  const ownership = await assertSameProject(id);
  if (!ownership.ok) return { error: ownership.error };

  const parentId =
    typeof parsed.data.parent_id === "string" && parsed.data.parent_id.length > 0
      ? parsed.data.parent_id
      : null;
  if (parentId) {
    const parentCheck = await assertParentValid(parentId, ownership.projectId, id);
    if (!parentCheck.ok) return { error: parentCheck.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ui_navigation_items")
    .update({
      name: parsed.data.name,
      label: parsed.data.label,
      route: normalizeText(formData.get("route")) ?? null,
      parent_id: parentId,
      description: normalizeText(formData.get("description")) ?? null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/ui`);
  redirect(`/projects/${ownership.projectId}/ui/navigation`);
}

export async function deleteUiNavigationItem(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Invalid navigation item reference" } as const;
  const ownership = await assertSameProject(id);
  if (!ownership.ok) return { error: ownership.error } as const;

  const supabase = await createClient();
  const { error } = await supabase.from("ui_navigation_items").delete().eq("id", id);
  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/ui`);
  redirect(`/projects/${ownership.projectId}/ui/navigation`);
}

export async function attachScreenToNavigation(formData: FormData) {
  const navigationItemId = formData.get("navigationItemId");
  const screenId = formData.get("screenId");
  if (typeof navigationItemId !== "string" || !navigationItemId)
    return { error: "Missing navigation item reference" } as const;
  if (typeof screenId !== "string" || !screenId)
    return { error: "Missing screen reference" } as const;

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("ui_navigation_items")
    .select("project_id")
    .eq("id", navigationItemId)
    .maybeSingle();
  const { data: screen } = await supabase
    .from("ui_screens")
    .select("project_id")
    .eq("id", screenId)
    .maybeSingle();
  if (!item || !screen || item.project_id !== screen.project_id)
    return { error: "Navigation item and screen must belong to the same project." } as const;

  const { error } = await supabase
    .from("ui_navigation_screens")
    .insert({ navigation_item_id: navigationItemId, screen_id: screenId });
  if (error) {
    if (error.code === "23505") {
      return { error: "That screen is already linked to this navigation item." } as const;
    }
    return { error: error.message } as const;
  }
  revalidatePath(`/projects/${item.project_id}/ui`);
  void listUiNavigationScreensByItem; // silence unused-import warning in some toolchains
  return { ok: true } as const;
}

export async function detachScreenFromNavigation(formData: FormData) {
  const id = formData.get("id");
  const navigationItemId = formData.get("navigationItemId");
  if (typeof id !== "string" || !id) return { error: "Invalid link reference" } as const;
  if (typeof navigationItemId !== "string" || !navigationItemId)
    return { error: "Missing navigation item reference" } as const;

  const supabase = await createClient();
  const ownership = await assertSameProject(navigationItemId);
  if (!ownership.ok) return { error: ownership.error } as const;

  const { error } = await supabase
    .from("ui_navigation_screens")
    .delete()
    .eq("id", id)
    .eq("navigation_item_id", navigationItemId);
  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/ui`);
  return { ok: true } as const;
}
