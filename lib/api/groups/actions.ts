"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  apiGroupInputSchema,
  apiGroupUpdateSchema,
  type ApiGroupActionState,
} from "@/lib/validation/api";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/projects/queries";

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

export async function createApiGroup(
  _prev: ApiGroupActionState | null,
  formData: FormData,
): Promise<ApiGroupActionState> {
  const parsed = apiGroupInputSchema.safeParse({
    name: formData.get("name"),
    description: normalizeOpt(formData.get("description")),
    prefix: normalizeOpt(formData.get("prefix")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ApiGroupActionState["fieldErrors"],
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

  const { data, error } = await supabase
    .from("api_groups")
    .insert({
      project_id: projectId,
      name: parsed.data.name,
      description: normalizeText(formData.get("description")) ?? null,
      prefix: normalizeText(formData.get("prefix")) ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create group." };
  }

  revalidatePath(`/projects/${projectId}/api`);
  redirect(`/projects/${projectId}/api#group-${data.id}`);
}

export async function updateApiGroup(
  _prev: ApiGroupActionState | null,
  formData: FormData,
): Promise<ApiGroupActionState> {
  const parsed = apiGroupUpdateSchema.safeParse({
    name: formData.get("name"),
    description: normalizeOpt(formData.get("description")),
    prefix: normalizeOpt(formData.get("prefix")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ApiGroupActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Missing group reference." };
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_groups")
    .update({
      name: parsed.data.name,
      description: normalizeText(formData.get("description")) ?? null,
      prefix: normalizeText(formData.get("prefix")) ?? null,
    })
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/api`);
  redirect(`/projects/${projectId}/api#group-${id}`);
}

export async function deleteApiGroup(formData: FormData) {
  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Invalid group reference" } as const;
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("api_groups")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${projectId}/api`);
  redirect(`/projects/${projectId}/api`);
}
