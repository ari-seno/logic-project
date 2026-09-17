import { createClient } from "@/lib/supabase/server";
import { listRequirements } from "@/lib/requirements/queries";

export type RequirementsContext = {
  userId: string;
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  existingTitles: string[];
};

export async function assembleRequirementsContext(
  projectId: string,
): Promise<RequirementsContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, owner_id, name, description")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !project || project.owner_id !== user.id) {
    return null;
  }

  const requirements = await listRequirements({ projectId });
  const existingTitles = requirements
    .map((req) => req.title)
    .filter((t): t is string => typeof t === "string" && t.length > 0);

  return {
    userId: user.id,
    projectId: project.id,
    projectName: project.name,
    projectDescription: project.description,
    existingTitles,
  };
}
