"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/projects/queries";
import { getApiEndpoint } from "@/lib/api/endpoints/queries";
import type { ApiEndpointEntityRole } from "@/lib/supabase/types";

async function assertEndpointOwnsProject(endpointId: string): Promise<
  { ok: true; projectId: string } | { ok: false; error: string }
> {
  const endpoint = await getApiEndpoint(endpointId);
  if (!endpoint) return { ok: false, error: "Endpoint not found." };
  const project = await getProject(endpoint.project_id);
  if (!project) return { ok: false, error: "Project not found." };
  return { ok: true, projectId: endpoint.project_id };
}

async function assertEntityInProject(
  entityId: string,
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("entities")
    .select("id, domains!inner(project_id)")
    .eq("id", entityId)
    .eq("domains.project_id", projectId)
    .maybeSingle();
  if (!data) return { ok: false, error: "Entity does not belong to this project." };
  return { ok: true };
}

async function assertRequirementInProject(
  requirementId: string,
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("requirements")
    .select("id, project_id")
    .eq("id", requirementId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!data) return { ok: false, error: "Requirement does not belong to this project." };
  return { ok: true };
}

const ALLOWED_ROLES: ApiEndpointEntityRole[] = [
  "primary_resource",
  "request_resource",
  "response_resource",
  "related_resource",
];

function readRole(value: FormDataEntryValue | null): ApiEndpointEntityRole | null {
  if (typeof value !== "string") return null;
  return (ALLOWED_ROLES as string[]).includes(value)
    ? (value as ApiEndpointEntityRole)
    : null;
}

export async function attachEntityToEndpoint(formData: FormData) {
  const endpointId = formData.get("endpointId");
  const entityId = formData.get("entityId");
  const role = readRole(formData.get("role"));
  if (typeof endpointId !== "string" || !endpointId) {
    return { error: "Missing endpoint reference" } as const;
  }
  if (typeof entityId !== "string" || !entityId) {
    return { error: "Missing entity reference" } as const;
  }
  if (!role) {
    return { error: "Role is required" } as const;
  }

  const ownership = await assertEndpointOwnsProject(endpointId);
  if (!ownership.ok) return { error: ownership.error } as const;

  const entityOwnership = await assertEntityInProject(entityId, ownership.projectId);
  if (!entityOwnership.ok) return { error: entityOwnership.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_endpoint_entities")
    .insert({ endpoint_id: endpointId, entity_id: entityId, role });

  if (error) {
    if (error.code === "23505") {
      return { error: "That entity is already linked with the same role." } as const;
    }
    return { error: error.message } as const;
  }

  revalidatePath(`/projects/${ownership.projectId}/api/${endpointId}`);
  redirect(`/projects/${ownership.projectId}/api/${endpointId}`);
}

export async function detachEntityFromEndpoint(formData: FormData) {
  const id = formData.get("id");
  const endpointId = formData.get("endpointId");
  if (typeof endpointId !== "string" || !endpointId) {
    return { error: "Missing endpoint reference" } as const;
  }
  const ownership = await assertEndpointOwnsProject(endpointId);
  if (!ownership.ok) return { error: ownership.error } as const;

  if (typeof id !== "string" || !id) {
    return { error: "Missing link reference" } as const;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_endpoint_entities")
    .delete()
    .eq("id", id)
    .eq("endpoint_id", endpointId);

  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/api/${endpointId}`);
  redirect(`/projects/${ownership.projectId}/api/${endpointId}`);
}

export async function attachRequirementToEndpoint(formData: FormData) {
  const endpointId = formData.get("endpointId");
  const requirementId = formData.get("requirementId");
  if (typeof endpointId !== "string" || !endpointId) {
    return { error: "Missing endpoint reference" } as const;
  }
  if (typeof requirementId !== "string" || !requirementId) {
    return { error: "Missing requirement reference" } as const;
  }

  const ownership = await assertEndpointOwnsProject(endpointId);
  if (!ownership.ok) return { error: ownership.error } as const;

  const reqOwnership = await assertRequirementInProject(
    requirementId,
    ownership.projectId,
  );
  if (!reqOwnership.ok) return { error: reqOwnership.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_endpoint_requirements")
    .insert({ endpoint_id: endpointId, requirement_id: requirementId });

  if (error) {
    if (error.code === "23505") {
      return { error: "That requirement is already linked." } as const;
    }
    return { error: error.message } as const;
  }

  revalidatePath(`/projects/${ownership.projectId}/api/${endpointId}`);
  redirect(`/projects/${ownership.projectId}/api/${endpointId}`);
}

export async function detachRequirementFromEndpoint(formData: FormData) {
  const id = formData.get("id");
  const endpointId = formData.get("endpointId");
  if (typeof endpointId !== "string" || !endpointId) {
    return { error: "Missing endpoint reference" } as const;
  }
  const ownership = await assertEndpointOwnsProject(endpointId);
  if (!ownership.ok) return { error: ownership.error } as const;

  if (typeof id !== "string" || !id) {
    return { error: "Missing link reference" } as const;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_endpoint_requirements")
    .delete()
    .eq("id", id)
    .eq("endpoint_id", endpointId);

  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/api/${endpointId}`);
  redirect(`/projects/${ownership.projectId}/api/${endpointId}`);
}
