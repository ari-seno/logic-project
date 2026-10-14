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
import {
  isRequirementBulkPriority,
  isRequirementBulkStatus,
  normalizeBulkRequirementIds,
} from "./bulk";

function emptyToOptional(
  value: FormDataEntryValue | null,
): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
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
    description: emptyToOptional(formData.get("description")),
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
    description: emptyToOptional(formData.get("description")),
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

export type BulkRequirementResult =
  | { ok: true; count: number }
  | { error: string };

function revalidateRequirementSurfaces(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/requirements`);
}

export async function bulkSetRequirementStatus(input: {
  projectId: string;
  ids: string[];
  status: string;
}): Promise<BulkRequirementResult> {
  const ids = normalizeBulkRequirementIds(input.ids);
  if (ids.length === 0) return { error: "Select at least one requirement." };
  if (!isRequirementBulkStatus(input.status)) {
    return { error: "Unsupported status." };
  }

  const owned = await assertOwnsProject(input.projectId);
  if (!owned.ok) return { error: owned.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requirements")
    .update({ status: input.status })
    .in("id", ids)
    .eq("project_id", input.projectId)
    .select("id");

  if (error) return { error: error.message };

  revalidateRequirementSurfaces(input.projectId);
  return { ok: true, count: data?.length ?? 0 };
}

export async function bulkSetRequirementPriority(input: {
  projectId: string;
  ids: string[];
  priority: string;
}): Promise<BulkRequirementResult> {
  const ids = normalizeBulkRequirementIds(input.ids);
  if (ids.length === 0) return { error: "Select at least one requirement." };
  if (!isRequirementBulkPriority(input.priority)) {
    return { error: "Unsupported priority." };
  }

  const owned = await assertOwnsProject(input.projectId);
  if (!owned.ok) return { error: owned.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requirements")
    .update({ priority: input.priority })
    .in("id", ids)
    .eq("project_id", input.projectId)
    .select("id");

  if (error) return { error: error.message };

  revalidateRequirementSurfaces(input.projectId);
  return { ok: true, count: data?.length ?? 0 };
}

export async function bulkDeleteRequirements(input: {
  projectId: string;
  ids: string[];
}): Promise<BulkRequirementResult> {
  const ids = normalizeBulkRequirementIds(input.ids);
  if (ids.length === 0) return { error: "Select at least one requirement." };

  const owned = await assertOwnsProject(input.projectId);
  if (!owned.ok) return { error: owned.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requirements")
    .delete()
    .in("id", ids)
    .eq("project_id", input.projectId)
    .select("id");

  if (error) return { error: error.message };

  revalidateRequirementSurfaces(input.projectId);
  return { ok: true, count: data?.length ?? 0 };
}
