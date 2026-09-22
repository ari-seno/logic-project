"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  ACCOUNT_PURGE_GRACE_DAYS,
  accountDeletionSchema,
  type AccountDeletionActionState,
} from "@/lib/validation/profile";

function normalizeText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function requestAccountDeletion(
  _prev: AccountDeletionActionState | null,
  formData: FormData,
): Promise<AccountDeletionActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in to delete your account." };
  }

  const parsed = accountDeletionSchema.safeParse({
    confirmEmail: normalizeText(formData.get("confirmEmail")),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const typed = parsed.data.confirmEmail.toLowerCase();
  const expected = (user.email ?? "").trim().toLowerCase();

  if (!expected || typed !== expected) {
    return {
      fieldErrors: {
        confirmEmail: ["That email does not match the account you are signed in as"],
      },
    };
  }

  const now = new Date();
  const purgeAfter = new Date(
    now.getTime() + ACCOUNT_PURGE_GRACE_DAYS * 24 * 60 * 60 * 1000,
  );

  const { error } = await supabase
    .from("profiles")
    .update({
      deleted_at: now.toISOString(),
      purge_after: purgeAfter.toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Could not schedule the deletion. Please try again." };
  }

  await supabase.auth.signOut();
  redirect("/login?deleted=1");
}

export async function restoreAccount(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("profiles")
    .update({ deleted_at: null, purge_after: null })
    .eq("id", user.id);

  redirect("/dashboard");
}
