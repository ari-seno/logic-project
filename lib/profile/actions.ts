"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  profileUpdateSchema,
  type ProfileActionState,
} from "@/lib/validation/profile";
import { createClient } from "@/lib/supabase/server";

function normalizeText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeOpt(value: FormDataEntryValue | null): string | undefined {
  const norm = normalizeText(value);
  return norm === null ? undefined : norm;
}

export async function updateProfile(
  _prev: ProfileActionState | null,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = profileUpdateSchema.safeParse({
    display_name: normalizeOpt(formData.get("display_name")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ProfileActionState["fieldErrors"],
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const displayName = normalizeText(formData.get("display_name"));

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/account");
  revalidatePath("/account/settings");
  revalidatePath("/", "layout");
  redirect("/account/settings?updated=1");
}
