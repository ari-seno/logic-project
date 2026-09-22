import { createClient } from "@/lib/supabase/server";
import { listRequirements } from "@/lib/requirements/queries";
import { listDecisions } from "@/lib/decisions/queries";
import { listDomains } from "@/lib/domains/queries";

export type AiAssembledContext = {
  userId: string;
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  requirementTitles: string[];
  decisionTitles: string[];
  domainNames: string[];
};

function titlesOf(rows: Array<{ title: string }>): string[] {
  return rows
    .map((row) => row.title)
    .filter((t): t is string => typeof t === "string" && t.length > 0);
}

function namesOf(rows: Array<{ name: string }>): string[] {
  return rows
    .map((row) => row.name)
    .filter((n): n is string => typeof n === "string" && n.length > 0);
}

export async function assembleAiContext(
  projectId: string,
): Promise<AiAssembledContext | null> {
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

  const [requirements, decisions, domains] = await Promise.all([
    listRequirements({ projectId }),
    listDecisions({ projectId }),
    listDomains({ projectId }),
  ]);

  return {
    userId: user.id,
    projectId: project.id,
    projectName: project.name,
    projectDescription: project.description,
    requirementTitles: titlesOf(requirements),
    decisionTitles: titlesOf(decisions),
    domainNames: namesOf(domains),
  };
}
