"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  requirementInputSchema,
  requirementUpdateSchema,
  type RequirementActionState,
} from "@/lib/validation/requirements";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/projects/queries";

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

async function assertOwnsProject(projectId: string): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  const project = await getProject(projectId);
  if (!project) {
    return { ok: false, error: "Project not found." };
  }
  return { ok: true };
}

export async function createRequirement(
  _prev: RequirementActionState | null,
  formData: FormData,
): Promise<RequirementActionState> {
  const parsed = requirementInputSchema.safeParse({
    title: formData.get("title"),
    description: emptyToNull(formData.get("description")),
    type: formData.get("type"),
    status: formData.get("status"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as RequirementActionState["fieldErrors"],
    };
  }

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId) {
    return { error: "Missing project reference." };
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) {
    return { error: owned.error };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data, error } = await supabase
    .from("requirements")
    .insert({
      project_id: projectId,
      title: parsed.data.title,
      description: parsed.data.description?.length
        ? parsed.data.description
        : null,
      type: parsed.data.type,
      status: parsed.data.status,
      priority: parsed.data.priority,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: error?.message ?? "Failed to create requirement. Please try again.",
    };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/requirements`);
  redirect(`/projects/${projectId}/requirements/${data.id}`);
}

export async function updateRequirement(
  _prev: RequirementActionState | null,
  formData: FormData,
): Promise<RequirementActionState> {
  const parsed = requirementUpdateSchema.safeParse({
    title: formData.get("title"),
    description: emptyToNull(formData.get("description")),
    type: formData.get("type"),
    status: formData.get("status"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as RequirementActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Missing requirement reference." };
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) {
    return { error: owned.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("requirements")
    .update({
      title: parsed.data.title,
      description: parsed.data.description?.length
        ? parsed.data.description
        : null,
      type: parsed.data.type,
      status: parsed.data.status,
      priority: parsed.data.priority,
    })
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/requirements`);
  revalidatePath(`/projects/${projectId}/requirements/${id}`);
  redirect(`/projects/${projectId}/requirements/${id}`);
}

export async function deleteRequirement(formData: FormData) {
  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Invalid requirement id" } as const;
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) {
    return { error: owned.error } as const;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("requirements")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) {
    return { error: error.message } as const;
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/requirements`);
  redirect(`/projects/${projectId}/requirements`);
}
