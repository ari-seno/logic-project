"use server";

import { revalidatePath } from "next/cache";

import {
  importProjectBundle,
  type ImportBundleOutcome,
} from "@/lib/import/bundle";
import { getUser } from "@/lib/supabase/server";

export async function importProjectAction(
  bundle: unknown,
): Promise<ImportBundleOutcome> {
  const user = await getUser();
  if (!user) {
    return { ok: false, error: "You need to sign in to import a project." };
  }

  const result = await importProjectBundle(bundle, user.id);

  if (result.ok) {
    revalidatePath("/projects");
    revalidatePath("/dashboard");
  }

  return result;
}
