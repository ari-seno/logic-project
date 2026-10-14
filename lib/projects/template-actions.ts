"use server";

import { revalidatePath } from "next/cache";

import { BUNDLE_FORMAT, BUNDLE_VERSION } from "@/lib/export/bundle-json";
import { importProjectBundle } from "@/lib/import/bundle";
import { findProjectTemplate } from "@/lib/projects/templates";
import { createClient } from "@/lib/supabase/server";

export type CreateFromTemplateResult =
  | { ok: true; projectId: string }
  | { ok: false; error: string };

export async function createProjectFromTemplateAction(
  templateId: string,
): Promise<CreateFromTemplateResult> {
  const template = findProjectTemplate(templateId);
  if (!template) {
    return { ok: false, error: "That template does not exist." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You need to sign in to create a project." };
  }

  const outcome = await importProjectBundle(
    {
      format: BUNDLE_FORMAT,
      version: BUNDLE_VERSION,
      generatedAt: new Date().toISOString(),
      bundle: template.build(),
    },
    user.id,
    { nameSuffix: "" },
  );

  if (!outcome.ok) {
    return outcome;
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");

  return { ok: true, projectId: outcome.projectId };
}
