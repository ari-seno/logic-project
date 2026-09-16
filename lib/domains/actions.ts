"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  domainInputSchema,
  domainUpdateSchema,
  type DomainActionState,
} from "@/lib/validation/domains";
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

export async function createDomain(
  _prev: DomainActionState | null,
  formData: FormData,
): Promise<DomainActionState> {
  const parsed = domainInputSchema.safeParse({
    name: formData.get("name"),
    description: emptyToNull(formData.get("description")),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as DomainActionState["fieldErrors"],
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
    .from("domains")
    .insert({
      project_id: projectId,
      name: parsed.data.name,
      description: parsed.data.description?.length
        ? parsed.data.description
        : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: error?.message ?? "Failed to create domain. Please try again.",
    };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/domains`);
  redirect(`/projects/${projectId}/domains/${data.id}`);
}

export async function updateDomain(
  _prev: DomainActionState | null,
  formData: FormData,
): Promise<DomainActionState> {
  const parsed = domainUpdateSchema.safeParse({
    name: formData.get("name"),
    description: emptyToNull(formData.get("description")),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as DomainActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Missing domain reference." };
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("domains")
    .update({
      name: parsed.data.name,
      description: parsed.data.description?.length
        ? parsed.data.description
        : null,
    })
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/domains`);
  revalidatePath(`/projects/${projectId}/domains/${id}`);
  redirect(`/projects/${projectId}/domains/${id}`);
}

export async function deleteDomain(formData: FormData) {
  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Invalid domain id" } as const;
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("domains")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/domains`);
  redirect(`/projects/${projectId}/domains`);
}
