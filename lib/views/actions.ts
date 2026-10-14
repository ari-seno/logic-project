"use server";

import { revalidatePath } from "next/cache";

import { getProject } from "@/lib/projects/queries";
import { createClient, getUser } from "@/lib/supabase/server";
import { isViewScope, normalizeViewLabel, normalizeViewQuery, sectionPath } from "./shared";

export type ViewActionResult = { ok: true } | { ok: false; error: string };

export async function createProjectView(input: {
  projectId: string;
  scope: string;
  label: string;
  query: string;
}): Promise<ViewActionResult> {
  const user = await getUser();
  if (!user) {
    return { ok: false, error: "You need to sign in to save a view." };
  }
  if (!isViewScope(input.scope)) {
    return { ok: false, error: "That section does not support saved views." };
  }

  const label = normalizeViewLabel(input.label);
  if (!label) {
    return { ok: false, error: "Give the view a name." };
  }
  const query = normalizeViewQuery(input.query);

  const project = await getProject(input.projectId);
  if (!project) {
    return { ok: false, error: "Project not found." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("project_views")
    .select("id, label")
    .eq("project_id", input.projectId)
    .eq("scope", input.scope);

  const clash = (existing ?? []).some(
    (row) => row.label.toLowerCase() === label.toLowerCase(),
  );
  if (clash) {
    return { ok: false, error: `A view named "${label}" already exists.` };
  }

  const { error } = await supabase.from("project_views").insert({
    project_id: input.projectId,
    owner_id: user.id,
    scope: input.scope,
    label,
    query,
  });

  if (error) {
    return { ok: false, error: "Could not save the view. Please try again." };
  }

  revalidatePath(sectionPath(input.projectId, input.scope));
  return { ok: true };
}

export async function deleteProjectView(input: {
  projectId: string;
  scope: string;
  viewId: string;
}): Promise<ViewActionResult> {
  const user = await getUser();
  if (!user) {
    return { ok: false, error: "You need to sign in." };
  }
  if (!isViewScope(input.scope)) {
    return { ok: false, error: "That section does not support saved views." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_views")
    .delete()
    .eq("id", input.viewId)
    .eq("project_id", input.projectId);

  if (error) {
    return { ok: false, error: "Could not delete the view. Please try again." };
  }

  revalidatePath(sectionPath(input.projectId, input.scope));
  return { ok: true };
}
