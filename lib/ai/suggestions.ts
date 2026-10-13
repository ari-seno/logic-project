import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";
import type { AiSuggestion } from "@/lib/supabase/types";

// Past AI generations for a project, newest first. Used by the AI history page
// so a user can revisit suggestions that were never applied (or were rejected).
export async function listProjectAiSuggestions(
  projectId: string,
  client?: SupabaseServerClient,
): Promise<AiSuggestion[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("ai_suggestions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("listProjectAiSuggestions failed:", error.message);
    return [];
  }
  return data ?? [];
}
