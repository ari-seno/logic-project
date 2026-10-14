"use server";

import { createClient, getUser } from "@/lib/supabase/server";
import { searchProjectArtifacts, type SearchResult } from "@/lib/search/queries";

export type SearchProjectResult =
  | { ok: true; results: SearchResult[] }
  | { ok: false; error: string };

export async function searchProjectAction(
  projectId: string,
  query: string,
): Promise<SearchProjectResult> {
  const user = await getUser();
  if (!user) {
    return { ok: false, error: "You need to sign in to search." };
  }

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return { ok: false, error: "Project not found." };
  }

  const results = await searchProjectArtifacts(projectId, query, supabase);
  return { ok: true, results };
}
