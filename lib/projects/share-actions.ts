"use server";

import { revalidatePath } from "next/cache";

import { generateShareToken, type ProjectShareState } from "@/lib/projects/share";
import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";

export type ShareActionResult =
  | { ok: true; state: ProjectShareState }
  | { ok: false; error: string };

type OwnedProject = {
  id: string;
  owner_id: string;
  share_token: string | null;
  share_enabled: boolean;
};

type OwnedProjectResult =
  | { ok: true; supabase: SupabaseServerClient; project: OwnedProject }
  | { ok: false; error: string };

function shareState(token: string | null, enabled: boolean): ProjectShareState {
  return { token, enabled };
}

async function requireOwnedProject(
  projectId: string,
): Promise<OwnedProjectResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You need to sign in to manage sharing." };
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, owner_id, share_token, share_enabled")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || project.owner_id !== user.id) {
    return { ok: false, error: "Project not found." };
  }

  return { ok: true, supabase, project };
}

export async function getProjectShareAction(
  projectId: string,
): Promise<ShareActionResult> {
  const result = await requireOwnedProject(projectId);
  if (!result.ok) return { ok: false, error: result.error };

  return {
    ok: true,
    state: shareState(result.project.share_token, result.project.share_enabled),
  };
}

export async function enableProjectShareAction(
  projectId: string,
): Promise<ShareActionResult> {
  const result = await requireOwnedProject(projectId);
  if (!result.ok) return { ok: false, error: result.error };

  const token = result.project.share_token ?? generateShareToken();
  const { error } = await result.supabase
    .from("projects")
    .update({ share_token: token, share_enabled: true })
    .eq("id", projectId)
    .eq("owner_id", result.project.owner_id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, state: shareState(token, true) };
}

export async function disableProjectShareAction(
  projectId: string,
): Promise<ShareActionResult> {
  const result = await requireOwnedProject(projectId);
  if (!result.ok) return { ok: false, error: result.error };

  const { error } = await result.supabase
    .from("projects")
    .update({ share_enabled: false })
    .eq("id", projectId)
    .eq("owner_id", result.project.owner_id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, state: shareState(result.project.share_token, false) };
}

export async function rotateProjectShareAction(
  projectId: string,
): Promise<ShareActionResult> {
  const result = await requireOwnedProject(projectId);
  if (!result.ok) return { ok: false, error: result.error };

  const token = generateShareToken();
  const { error } = await result.supabase
    .from("projects")
    .update({ share_token: token, share_enabled: true })
    .eq("id", projectId)
    .eq("owner_id", result.project.owner_id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, state: shareState(token, true) };
}
