"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  apiEndpointInputSchema,
  apiEndpointUpdateSchema,
  type ApiEndpointActionState,
} from "@/lib/validation/api";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/projects/queries";
import { getApiGroup } from "@/lib/api/groups/queries";

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

function normalizeGroupId(value: FormDataEntryValue | null): string | null {
  const norm = normalizeText(value);
  return norm === null ? null : norm;
}

async function getCurrentPosition(projectId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("api_endpoints")
    .select("position")
    .eq("project_id", projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? -1) + 1;
}

export async function createApiEndpoint(
  _prev: ApiEndpointActionState | null,
  formData: FormData,
): Promise<ApiEndpointActionState> {
  const groupIdRaw = normalizeGroupId(formData.get("group_id"));
  const parsed = apiEndpointInputSchema.safeParse({
    name: formData.get("name"),
    method: formData.get("method"),
    path: formData.get("path"),
    summary: normalizeOpt(formData.get("summary")),
    description: normalizeOpt(formData.get("description")),
    authentication_required: formData.get("authentication_required") === "on",
    group_id: groupIdRaw ?? "",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ApiEndpointActionState["fieldErrors"],
    };
  }

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId) {
    return { error: "Missing project reference." };
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error };

  if (groupIdRaw) {
    const group = await getApiGroup(groupIdRaw);
    if (!group || group.project_id !== projectId) {
      return { error: "Selected group is not part of this project." };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const position = await getCurrentPosition(projectId);

  const { data, error } = await supabase
    .from("api_endpoints")
    .insert({
      project_id: projectId,
      group_id: groupIdRaw,
      name: parsed.data.name,
      method: parsed.data.method as
        | "GET"
        | "POST"
        | "PUT"
        | "PATCH"
        | "DELETE",
      path: parsed.data.path,
      summary: normalizeText(formData.get("summary")) ?? null,
      description: normalizeText(formData.get("description")) ?? null,
      authentication_required: parsed.data.authentication_required,
      position,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create endpoint." };
  }

  revalidatePath(`/projects/${projectId}/api`);
  redirect(`/projects/${projectId}/api/${data.id}`);
}

export async function updateApiEndpoint(
  _prev: ApiEndpointActionState | null,
  formData: FormData,
): Promise<ApiEndpointActionState> {
  const groupIdRaw = normalizeGroupId(formData.get("group_id"));
  const parsed = apiEndpointUpdateSchema.safeParse({
    name: formData.get("name"),
    method: formData.get("method"),
    path: formData.get("path"),
    summary: normalizeOpt(formData.get("summary")),
    description: normalizeOpt(formData.get("description")),
    authentication_required: formData.get("authentication_required") === "on",
    group_id: groupIdRaw ?? "",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ApiEndpointActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Missing endpoint reference." };
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error };

  if (groupIdRaw) {
    const group = await getApiGroup(groupIdRaw);
    if (!group || group.project_id !== projectId) {
      return { error: "Selected group is not part of this project." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_endpoints")
    .update({
      name: parsed.data.name,
      method: parsed.data.method as
        | "GET"
        | "POST"
        | "PUT"
        | "PATCH"
        | "DELETE",
      path: parsed.data.path,
      summary: normalizeText(formData.get("summary")) ?? null,
      description: normalizeText(formData.get("description")) ?? null,
      authentication_required: parsed.data.authentication_required,
      group_id: groupIdRaw,
    })
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/api`);
  revalidatePath(`/projects/${projectId}/api/${id}`);
  redirect(`/projects/${projectId}/api/${id}`);
}

export async function deleteApiEndpoint(formData: FormData) {
  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Invalid endpoint reference" } as const;
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_endpoints")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${projectId}/api`);
  redirect(`/projects/${projectId}/api`);
}
