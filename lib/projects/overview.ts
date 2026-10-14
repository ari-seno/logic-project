import { createClient, type SupabaseServerClient } from "@/lib/supabase/server";
import type { ProjectHealthInput } from "@/lib/projects/health";

export type TaskStatusCounts = {
  total: number;
  todo: number;
  ready: number;
  in_progress: number;
  blocked: number;
  review: number;
  done: number;
  cancelled: number;
};

export type ProjectCounts = {
  requirements: number;
  decisions: number;
  domains: number;
  entities: number;
  relationships: number;
  architectureComponents: number;
  architectureTechnologies: number;
  architectureDecisions: number;
  architectureDependencies: number;
  apiGroups: number;
  apiEndpoints: number;
  uiScreens: number;
  uiComponents: number;
  tasks: TaskStatusCounts;
};

export type ProjectOverview = {
  counts: ProjectCounts;
  health: ProjectHealthInput;
};

const EMPTY_TASKS: TaskStatusCounts = {
  total: 0,
  todo: 0,
  ready: 0,
  in_progress: 0,
  blocked: 0,
  review: 0,
  done: 0,
  cancelled: 0,
};

function number(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function object(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Turns the `get_project_overview` payload into typed data. Every field is
 * defaulted, so a partial payload degrades to zeros instead of crashing a page.
 */
export function mapProjectOverview(raw: unknown): ProjectOverview {
  const root = object(raw);
  const counts = object(root.counts);
  const tasks = object(counts.tasks);
  const health = object(root.health);
  const architecture = object(health.architecture);
  const api = object(health.api);
  const ui = object(health.ui);
  const taskLinks = object(health.taskLinks);

  return {
    counts: {
      requirements: number(counts.requirements),
      decisions: number(counts.decisions),
      domains: number(counts.domains),
      entities: number(counts.entities),
      relationships: number(counts.relationships),
      architectureComponents: number(counts.architectureComponents),
      architectureTechnologies: number(counts.architectureTechnologies),
      architectureDecisions: number(counts.architectureDecisions),
      architectureDependencies: number(counts.architectureDependencies),
      apiGroups: number(counts.apiGroups),
      apiEndpoints: number(counts.apiEndpoints),
      uiScreens: number(counts.uiScreens),
      uiComponents: number(counts.uiComponents),
      tasks: {
        total: number(tasks.total),
        todo: number(tasks.todo),
        ready: number(tasks.ready),
        in_progress: number(tasks.in_progress),
        blocked: number(tasks.blocked),
        review: number(tasks.review),
        done: number(tasks.done),
        cancelled: number(tasks.cancelled),
      },
    },
    health: {
      requirements: list<ProjectHealthInput["requirements"][number]>(
        health.requirements,
      ),
      decisions: list<ProjectHealthInput["decisions"][number]>(
        health.decisions,
      ),
      domains: list<ProjectHealthInput["domains"][number]>(health.domains),
      entities: list<ProjectHealthInput["entities"][number]>(health.entities),
      attributes: list<ProjectHealthInput["attributes"][number]>(
        health.attributes,
      ),
      relationships: list<ProjectHealthInput["relationships"][number]>(
        health.relationships,
      ),
      architecture: {
        components: list<{ id: string }>(architecture.components),
        technologies: list<{ id: string }>(architecture.technologies),
        dependencies: list<{ id: string }>(architecture.dependencies),
      },
      api: {
        endpoints: list<ProjectHealthInput["api"]["endpoints"][number]>(
          api.endpoints,
        ),
        responses: list<{ endpoint_id: string }>(api.responses),
      },
      ui: {
        screens: list<{ id: string }>(ui.screens),
        screenComponents: list<{ screen_id: string }>(ui.screenComponents),
        interactions: list<{ screen_id: string }>(ui.interactions),
      },
      tasks: list<ProjectHealthInput["tasks"][number]>(health.tasks),
      taskLinks: {
        requirements: list<{ id: string }>(taskLinks.requirements),
      },
    },
  };
}

/**
 * Counts and completeness input for one project, in a single database call.
 * Returns null when the call fails so the caller can decide how to degrade.
 */
export async function loadProjectOverview(
  projectId: string,
  client?: SupabaseServerClient,
): Promise<ProjectOverview | null> {
  const supabase = client ?? (await createClient());
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { data, error } = await rpc("get_project_overview", {
    p_project_id: projectId,
  });

  if (error) {
    console.error("loadProjectOverview failed:", error.message);
    return null;
  }

  return mapProjectOverview(data);
}

export { EMPTY_TASKS };
