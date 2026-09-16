"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  attributeInputSchema,
  attributeUpdateSchema,
  type AttributeActionState,
} from "@/lib/validation/attributes";
import { createClient } from "@/lib/supabase/server";
import {
  nextAttributePosition,
  reorderAttribute,
} from "@/lib/attributes/queries";
import { getEntityWithProject } from "@/lib/entities/queries";

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function parseCheckbox(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1";
}

async function entityContext(
  entityId: string,
): Promise<
  | { ok: true; projectId: string; domainId: string }
  | { ok: false; error: string }
> {
  const result = await getEntityWithProject(entityId);
  if (!result) {
    return { ok: false, error: "Entity not found." };
  }
  return {
    ok: true,
    projectId: result.projectId,
    domainId: result.entity.domain_id,
  };
}

export async function createAttribute(
  _prev: AttributeActionState | null,
  formData: FormData,
): Promise<AttributeActionState> {
  const parsed = attributeInputSchema.safeParse({
    name: formData.get("name"),
    data_type: formData.get("data_type"),
    is_required: parseCheckbox(formData.get("is_required")),
    is_primary_key: parseCheckbox(formData.get("is_primary_key")),
    default_value: emptyToNull(formData.get("default_value")),
    description: emptyToNull(formData.get("description")),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as AttributeActionState["fieldErrors"],
    };
  }

  const entityId = formData.get("entityId");
  if (typeof entityId !== "string" || !entityId) {
    return { error: "Missing entity reference." };
  }

  const ctx = await entityContext(entityId);
  if (!ctx.ok) {
    return { error: ctx.error };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const position = await nextAttributePosition(entityId);

  const { error } = await supabase.from("entity_attributes").insert({
    entity_id: entityId,
    name: parsed.data.name,
    data_type: parsed.data.data_type,
    is_required: parsed.data.is_required,
    is_primary_key: parsed.data.is_primary_key,
    default_value: parsed.data.default_value?.length
      ? parsed.data.default_value
      : null,
    description: parsed.data.description?.length
      ? parsed.data.description
      : null,
    position,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(
    `/projects/${ctx.projectId}/domains/${ctx.domainId}/entities/${entityId}`,
  );
  redirect(
    `/projects/${ctx.projectId}/domains/${ctx.domainId}/entities/${entityId}`,
  );
}

export async function updateAttribute(
  _prev: AttributeActionState | null,
  formData: FormData,
): Promise<AttributeActionState> {
  const parsed = attributeUpdateSchema.safeParse({
    name: formData.get("name"),
    data_type: formData.get("data_type"),
    is_required: parseCheckbox(formData.get("is_required")),
    is_primary_key: parseCheckbox(formData.get("is_primary_key")),
    default_value: emptyToNull(formData.get("default_value")),
    description: emptyToNull(formData.get("description")),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as AttributeActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  const entityId = formData.get("entityId");
  if (
    typeof id !== "string" ||
    !id ||
    typeof entityId !== "string" ||
    !entityId
  ) {
    return { error: "Missing attribute reference." };
  }

  const ctx = await entityContext(entityId);
  if (!ctx.ok) {
    return { error: ctx.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("entity_attributes")
    .update({
      name: parsed.data.name,
      data_type: parsed.data.data_type,
      is_required: parsed.data.is_required,
      is_primary_key: parsed.data.is_primary_key,
      default_value: parsed.data.default_value?.length
        ? parsed.data.default_value
        : null,
      description: parsed.data.description?.length
        ? parsed.data.description
        : null,
    })
    .eq("id", id)
    .eq("entity_id", entityId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(
    `/projects/${ctx.projectId}/domains/${ctx.domainId}/entities/${entityId}`,
  );
  redirect(
    `/projects/${ctx.projectId}/domains/${ctx.domainId}/entities/${entityId}`,
  );
}

export async function deleteAttribute(formData: FormData) {
  const id = formData.get("id");
  const entityId = formData.get("entityId");
  if (
    typeof id !== "string" ||
    !id ||
    typeof entityId !== "string" ||
    !entityId
  ) {
    return { error: "Invalid attribute reference" } as const;
  }

  const ctx = await entityContext(entityId);
  if (!ctx.ok) {
    return { error: ctx.error } as const;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("entity_attributes")
    .delete()
    .eq("id", id)
    .eq("entity_id", entityId);

  if (error) {
    return { error: error.message } as const;
  }

  revalidatePath(
    `/projects/${ctx.projectId}/domains/${ctx.domainId}/entities/${entityId}`,
  );
  return { ok: true } as const;
}

export async function moveAttribute(formData: FormData) {
  const id = formData.get("id");
  const entityId = formData.get("entityId");
  const direction = formData.get("direction");
  if (
    typeof id !== "string" ||
    !id ||
    typeof entityId !== "string" ||
    !entityId ||
    (direction !== "up" && direction !== "down")
  ) {
    return { error: "Invalid reorder request" } as const;
  }

  const ctx = await entityContext(entityId);
  if (!ctx.ok) {
    return { error: ctx.error } as const;
  }

  const result = await reorderAttribute(id, direction);
  if (!result.ok) {
    return { error: result.error } as const;
  }

  revalidatePath(
    `/projects/${ctx.projectId}/domains/${ctx.domainId}/entities/${entityId}`,
  );
  return { ok: true } as const;
}
