"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getUiScreen } from "@/lib/ui/screens/queries";
import { getApiEndpoint } from "@/lib/api/endpoints/queries";
import {
  UI_SCREEN_ENTITY_ROLES,
  type UiScreenEntityRole,
} from "@/lib/supabase/types";

async function assertScreenSameProject(screenId: string) {
  const screen = await getUiScreen(screenId);
  if (!screen) return { ok: false, error: "Screen not found." } as const;
  return { ok: true, projectId: screen.project_id } as const;
}

async function assertInteractionSameProject(interactionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ui_interactions")
    .select("screen_id, ui_screens!inner(project_id)")
    .eq("id", interactionId)
    .maybeSingle();
  const projectId = (data as { ui_screens: { project_id: string } | null } | null)?.ui_screens?.project_id;
  const screenId = (data as { screen_id: string } | null)?.screen_id;
  if (!projectId || !screenId) return { ok: false, error: "Interaction not found." } as const;
  return { ok: true, projectId, screenId } as const;
}

async function assertEndpointInProject(
  endpointId: string,
  projectId: string,
) {
  const endpoint = await getApiEndpoint(endpointId);
  if (!endpoint || endpoint.project_id !== projectId) {
    return { ok: false, error: "Selected endpoint is not part of this project." } as const;
  }
  return { ok: true } as const;
}

async function assertRequirementInProject(
  requirementId: string,
  projectId: string,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("requirements")
    .select("id, project_id")
    .eq("id", requirementId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!data) return { ok: false, error: "Requirement is not part of this project." } as const;
  return { ok: true } as const;
}

async function assertEntityInProject(entityId: string, projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("entities")
    .select("id, domains!inner(project_id)")
    .eq("id", entityId)
    .eq("domains.project_id", projectId)
    .maybeSingle();
  if (!data) return { ok: false, error: "Entity is not part of this project." } as const;
  return { ok: true } as const;
}

// UI Interaction ↔ API Endpoint
export async function attachEndpointToInteraction(formData: FormData) {
  const interactionId = formData.get("interactionId");
  const endpointId = formData.get("endpointId");
  if (typeof interactionId !== "string" || !interactionId)
    return { error: "Missing interaction reference" } as const;
  if (typeof endpointId !== "string" || !endpointId)
    return { error: "Missing endpoint reference" } as const;

  const ownership = await assertInteractionSameProject(interactionId);
  if (!ownership.ok) return { error: ownership.error } as const;

  const endpointOwnership = await assertEndpointInProject(
    endpointId,
    ownership.projectId,
  );
  if (!endpointOwnership.ok) return { error: endpointOwnership.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("ui_interaction_endpoints")
    .insert({ interaction_id: interactionId, endpoint_id: endpointId });
  if (error) {
    if (error.code === "23505") {
      return { error: "That endpoint is already linked." } as const;
    }
    return { error: error.message } as const;
  }

  revalidatePath(`/projects/${ownership.projectId}/ui/screens/${ownership.screenId}`);
  return { ok: true } as const;
}

export async function detachEndpointFromInteraction(formData: FormData) {
  const id = formData.get("id");
  const interactionId = formData.get("interactionId");
  if (typeof id !== "string" || !id)
    return { error: "Missing link reference" } as const;
  if (typeof interactionId !== "string" || !interactionId)
    return { error: "Missing interaction reference" } as const;
  const ownership = await assertInteractionSameProject(interactionId);
  if (!ownership.ok) return { error: ownership.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("ui_interaction_endpoints")
    .delete()
    .eq("id", id)
    .eq("interaction_id", interactionId);
  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/ui/screens/${ownership.screenId}`);
  return { ok: true } as const;
}

// UI Screen ↔ Requirement
export async function attachRequirementToScreen(formData: FormData) {
  const screenId = formData.get("screenId");
  const requirementId = formData.get("requirementId");
  if (typeof screenId !== "string" || !screenId)
    return { error: "Missing screen reference" } as const;
  if (typeof requirementId !== "string" || !requirementId)
    return { error: "Missing requirement reference" } as const;
  const ownership = await assertScreenSameProject(screenId);
  if (!ownership.ok) return { error: ownership.error } as const;
  const reqOwn = await assertRequirementInProject(requirementId, ownership.projectId);
  if (!reqOwn.ok) return { error: reqOwn.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("ui_screen_requirements")
    .insert({ screen_id: screenId, requirement_id: requirementId });
  if (error) {
    if (error.code === "23505") return { error: "That requirement is already linked." } as const;
    return { error: error.message } as const;
  }

  revalidatePath(`/projects/${ownership.projectId}/ui/screens/${screenId}`);
  redirect(`/projects/${ownership.projectId}/ui/screens/${screenId}`);
}

export async function detachRequirementFromScreen(formData: FormData) {
  const id = formData.get("id");
  const screenId = formData.get("screenId");
  if (typeof id !== "string" || !id)
    return { error: "Missing link reference" } as const;
  if (typeof screenId !== "string" || !screenId)
    return { error: "Missing screen reference" } as const;
  const ownership = await assertScreenSameProject(screenId);
  if (!ownership.ok) return { error: ownership.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("ui_screen_requirements")
    .delete()
    .eq("id", id)
    .eq("screen_id", screenId);
  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/ui/screens/${screenId}`);
  redirect(`/projects/${ownership.projectId}/ui/screens/${screenId}`);
}

// UI Screen ↔ Domain Entity
function readUiRole(value: FormDataEntryValue | null): UiScreenEntityRole | null {
  if (typeof value !== "string") return null;
  return (UI_SCREEN_ENTITY_ROLES as readonly string[]).includes(value)
    ? (value as UiScreenEntityRole)
    : null;
}

export async function attachEntityToScreen(formData: FormData) {
  const screenId = formData.get("screenId");
  const entityId = formData.get("entityId");
  const role = readUiRole(formData.get("role"));
  if (typeof screenId !== "string" || !screenId)
    return { error: "Missing screen reference" } as const;
  if (typeof entityId !== "string" || !entityId)
    return { error: "Missing entity reference" } as const;
  if (!role) return { error: "Role is required." } as const;

  const ownership = await assertScreenSameProject(screenId);
  if (!ownership.ok) return { error: ownership.error } as const;
  const entOwn = await assertEntityInProject(entityId, ownership.projectId);
  if (!entOwn.ok) return { error: entOwn.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("ui_screen_entities")
    .insert({ screen_id: screenId, entity_id: entityId, role });
  if (error) {
    if (error.code === "23505") return { error: "That entity is already linked with the same role." } as const;
    return { error: error.message } as const;
  }

  revalidatePath(`/projects/${ownership.projectId}/ui/screens/${screenId}`);
  redirect(`/projects/${ownership.projectId}/ui/screens/${screenId}`);
}

export async function detachEntityFromScreen(formData: FormData) {
  const id = formData.get("id");
  const screenId = formData.get("screenId");
  if (typeof id !== "string" || !id)
    return { error: "Missing link reference" } as const;
  if (typeof screenId !== "string" || !screenId)
    return { error: "Missing screen reference" } as const;
  const ownership = await assertScreenSameProject(screenId);
  if (!ownership.ok) return { error: ownership.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("ui_screen_entities")
    .delete()
    .eq("id", id)
    .eq("screen_id", screenId);
  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/ui/screens/${screenId}`);
  redirect(`/projects/${ownership.projectId}/ui/screens/${screenId}`);
}
