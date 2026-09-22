import { createClient } from "@/lib/supabase/server";
import { listRequirements } from "@/lib/requirements/queries";
import { listDecisions } from "@/lib/decisions/queries";
import { listDomains } from "@/lib/domains/queries";
import { listArchitectureComponentsByProject } from "@/lib/architecture/components/queries";
import { listArchitectureTechnologiesByProject } from "@/lib/architecture/technologies/queries";
import { listArchitectureDecisionsByProject } from "@/lib/architecture/decisions/queries";
import { listEntitiesByProject } from "@/lib/entities/queries";
import { listApiGroupsByProject } from "@/lib/api/groups/queries";
import { listApiEndpointsByProject } from "@/lib/api/endpoints/queries";
import { listUiScreensByProject } from "@/lib/ui/screens/queries";
import { listUiComponentsByProject } from "@/lib/ui/components/queries";
import { listTasksByProject } from "@/lib/tasks/queries";

export type AiContextEntry = {
  name: string;
  description: string | null;
};

export type AiAssembledContext = {
  userId: string;
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  requirements: AiContextEntry[];
  decisions: AiContextEntry[];
  domains: AiContextEntry[];
  entities: AiContextEntry[];
  architectureComponents: AiContextEntry[];
  architectureTechnologies: AiContextEntry[];
  architectureDecisions: AiContextEntry[];
  apiGroups: AiContextEntry[];
  apiEndpoints: AiContextEntry[];
  uiScreens: AiContextEntry[];
  uiComponents: AiContextEntry[];
  tasks: AiContextEntry[];
  requirementTitles: string[];
  decisionTitles: string[];
  domainNames: string[];
  architectureComponentNames: string[];
  architectureTechnologyNames: string[];
  architectureDecisionTitles: string[];
  entityNames: string[];
  apiGroupNames: string[];
  apiEndpointSummaries: string[];
  uiScreenNames: string[];
  uiComponentNames: string[];
  taskTitles: string[];
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

function describe(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function titlesWithDescriptionOf(
  rows: Array<{ title: string; description?: string | null }>,
): AiContextEntry[] {
  return rows
    .filter((row) => typeof row.title === "string" && row.title.length > 0)
    .map((row) => ({
      name: row.title,
      description: describe(row.description),
    }));
}

function namesWithDescriptionOf(
  rows: Array<{ name: string; description?: string | null }>,
): AiContextEntry[] {
  return rows
    .filter((row) => typeof row.name === "string" && row.name.length > 0)
    .map((row) => ({ name: row.name, description: describe(row.description) }));
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

  const [
    requirements,
    decisions,
    domains,
    architectureComponents,
    architectureTechnologies,
    architectureDecisions,
    entities,
    apiGroups,
    apiEndpoints,
    uiScreens,
    uiComponents,
    tasks,
  ] = await Promise.all([
    listRequirements({ projectId }),
    listDecisions({ projectId }),
    listDomains({ projectId }),
    listArchitectureComponentsByProject({ projectId }),
    listArchitectureTechnologiesByProject({ projectId }),
    listArchitectureDecisionsByProject({ projectId }),
    listEntitiesByProject(projectId),
    listApiGroupsByProject({ projectId }),
    listApiEndpointsByProject({ projectId }),
    listUiScreensByProject({ projectId }),
    listUiComponentsByProject({ projectId }),
    listTasksByProject({ projectId }),
  ]);

  return {
    userId: user.id,
    projectId: project.id,
    projectName: project.name,
    projectDescription: project.description,
    requirements: titlesWithDescriptionOf(requirements),
    decisions: titlesWithDescriptionOf(decisions),
    domains: namesWithDescriptionOf(domains),
    entities: namesWithDescriptionOf(entities),
    architectureComponents: namesWithDescriptionOf(architectureComponents),
    architectureTechnologies: namesWithDescriptionOf(architectureTechnologies),
    architectureDecisions: titlesWithDescriptionOf(architectureDecisions),
    apiGroups: namesWithDescriptionOf(apiGroups),
    apiEndpoints: apiEndpoints.map((endpoint) => ({
      name: `${endpoint.method} ${endpoint.path}`,
      description: describe(endpoint.summary ?? endpoint.description),
    })),
    uiScreens: namesWithDescriptionOf(uiScreens),
    uiComponents: namesWithDescriptionOf(uiComponents),
    tasks: titlesWithDescriptionOf(tasks),
    requirementTitles: titlesOf(requirements),
    decisionTitles: titlesOf(decisions),
    domainNames: namesOf(domains),
    architectureComponentNames: namesOf(architectureComponents),
    architectureTechnologyNames: namesOf(architectureTechnologies),
    architectureDecisionTitles: titlesOf(architectureDecisions),
    entityNames: namesOf(entities),
    apiGroupNames: namesOf(apiGroups),
    apiEndpointSummaries: apiEndpoints.map(
      (endpoint) => `${endpoint.method} ${endpoint.path}`,
    ),
    uiScreenNames: namesOf(uiScreens),
    uiComponentNames: namesOf(uiComponents),
    taskTitles: titlesOf(tasks),
  };
}
