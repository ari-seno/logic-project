"use server";

import { revalidatePath } from "next/cache";

import { BUNDLE_FORMAT, BUNDLE_VERSION } from "@/lib/export/bundle-json";
import { loadProjectBundle } from "@/lib/export/bundle";
import { importProjectBundle } from "@/lib/import/bundle";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { getProjectVersion } from "./queries";

export type VersionActionResult = { ok: true } | { ok: false; error: string };
export type RestoreVersionResult =
  | { ok: true; projectId: string }
  | { ok: false; error: string };

function countItems(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce(
      (total, [key, nested]) =>
        key === "project" ? total : total + countItems(nested),
      0,
    );
  }
  return 0;
}

function defaultLabel(): string {
  return `Snapshot ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;
}

export async function saveProjectVersion(input: {
  projectId: string;
  label?: string;
}): Promise<VersionActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "You need to sign in to save a version." };

  const bundle = await loadProjectBundle(input.projectId);
  if (!bundle) return { ok: false, error: "Project not found." };

  const label = (input.label ?? "").trim().slice(0, 200) || defaultLabel();
  const supabase = await createClient();
  const { error } = await supabase.from("project_versions").insert({
    project_id: input.projectId,
    label,
    item_count: countItems(bundle),
    bundle: bundle as unknown as Json,
    created_by: user.id,
  });

  if (error) {
    return { ok: false, error: "Could not save the version. Please try again." };
  }

  revalidatePath(`/projects/${input.projectId}/versions`);
  return { ok: true };
}

export async function deleteProjectVersion(input: {
  projectId: string;
  versionId: string;
}): Promise<VersionActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "You need to sign in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_versions")
    .delete()
    .eq("id", input.versionId)
    .eq("project_id", input.projectId);

  if (error) {
    return { ok: false, error: "Could not delete the version." };
  }

  revalidatePath(`/projects/${input.projectId}/versions`);
  return { ok: true };
}

export async function restoreProjectVersionAsNew(input: {
  projectId: string;
  versionId: string;
}): Promise<RestoreVersionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "You need to sign in." };

  const version = await getProjectVersion(input.versionId);
  if (!version || version.project_id !== input.projectId) {
    return { ok: false, error: "That version does not exist." };
  }

  const outcome = await importProjectBundle(
    {
      format: BUNDLE_FORMAT,
      version: BUNDLE_VERSION,
      generatedAt: new Date().toISOString(),
      bundle: version.bundle,
    },
    user.id,
    { nameSuffix: " (restored)" },
  );

  if (!outcome.ok) return { ok: false, error: outcome.error };

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true, projectId: outcome.projectId };
}
