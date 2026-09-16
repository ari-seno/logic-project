"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  entityInputSchema,
  entityUpdateSchema,
  type EntityActionState,
} from "@/lib/validation/entities";
import { createClient } from "@/lib/supabase/server";
import { getDomain } from "@/lib/domains/queries";

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

async function assertOwnsDomain(
  domainId: string,
): Promise<{ ok: true; projectId: string } | { ok: false; error: string }> {
  const domain = await getDomain(domainId);
  if (!domain) {
    return { ok: false, error: "Domain not found." };
  }
  return { ok: true, projectId: domain.project_id };
}

export async function createEntity(
  _prev: EntityActionState | null,
  formData: FormData,
): Promise<EntityActionState> {
  const parsed = entityInputSchema.safeParse({
    name: formData.get("name"),
    description: emptyToNull(formData.get("description")),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as EntityActionState["fieldErrors"],
    };
  }

  const domainId = formData.get("domainId");
  if (typeof domainId !== "string" || !domainId) {
    return { error: "Missing domain reference." };
  }

  const owned = await assertOwnsDomain(domainId);
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
    .from("entities")
    .insert({
      domain_id: domainId,
      name: parsed.data.name,
      description: parsed.data.description?.length
        ? parsed.data.description
        : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: error?.message ?? "Failed to create entity. Please try again.",
    };
  }

  revalidatePath(`/projects/${owned.projectId}/domains`);
  revalidatePath(`/projects/${owned.projectId}/domains/${domainId}`);
  redirect(`/projects/${owned.projectId}/domains/${domainId}/entities/${data.id}`);
}

export async function updateEntity(
  _prev: EntityActionState | null,
  formData: FormData,
): Promise<EntityActionState> {
  const parsed = entityUpdateSchema.safeParse({
    name: formData.get("name"),
    description: emptyToNull(formData.get("description")),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as EntityActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  const domainId = formData.get("domainId");
  if (
    typeof id !== "string" ||
    !id ||
    typeof domainId !== "string" ||
    !domainId
  ) {
    return { error: "Missing entity reference." };
  }

  const owned = await assertOwnsDomain(domainId);
  if (!owned.ok) {
    return { error: owned.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("entities")
    .update({
      name: parsed.data.name,
      description: parsed.data.description?.length
        ? parsed.data.description
        : null,
    })
    .eq("id", id)
    .eq("domain_id", domainId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${owned.projectId}/domains/${domainId}/entities/${id}`);
  redirect(`/projects/${owned.projectId}/domains/${domainId}/entities/${id}`);
}

export async function deleteEntity(formData: FormData) {
  const id = formData.get("id");
  const domainId = formData.get("domainId");
  if (
    typeof id !== "string" ||
    !id ||
    typeof domainId !== "string" ||
    !domainId
  ) {
    return { error: "Invalid entity id" } as const;
  }

  const owned = await assertOwnsDomain(domainId);
  if (!owned.ok) {
    return { error: owned.error } as const;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("entities")
    .delete()
    .eq("id", id)
    .eq("domain_id", domainId);

  if (error) {
    return { error: error.message } as const;
  }

  revalidatePath(`/projects/${owned.projectId}/domains/${domainId}`);
  redirect(`/projects/${owned.projectId}/domains/${domainId}`);
}
