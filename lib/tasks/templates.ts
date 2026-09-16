import {
  type ApiEndpoint,
  type Requirement,
  type Task,
  type TaskType,
} from "@/lib/supabase/types";

/**
 * Deterministic task templates. Pure functions — no I/O, no AI.
 *
 * Used by `createTaskFromArtifact` server action to prefill a new task
 * with a meaningful title, description, and metadata derived from the
 * source artifact. The link is also auto-attached so traceability
 * appears immediately on the task detail page.
 */

export type ArtifactKind =
  | "requirement"
  | "decision"
  | "entity"
  | "component"
  | "endpoint"
  | "screen";

export type TemplateInput = {
  projectId: string;
  refId: string;
};

export type TaskTemplate = {
  title: string;
  description: string | null;
  task_type: TaskType;
  priority: Task["priority"];
  status: Task["status"];
  acceptance_criteria: string | null;
};

export function buildTaskTemplateFromRequirement(
  req: Pick<Requirement, "id" | "title" | "type" | "priority" | "description">,
): TaskTemplate {
  return {
    title: `Implement requirement: ${req.title}`,
    description: req.description?.trim() || null,
    task_type: req.type === "non_functional" ? "testing" : "feature",
    priority: priorityFromRequirement(req.priority),
    status: "todo",
    acceptance_criteria: `- The implementation satisfies the requirement: "${req.title}".\n- Tests cover the requirement (if applicable).`,
  };
}

export function buildTaskTemplateFromDecision(
  decision: { id: string; title: string; rationale: string | null },
): TaskTemplate {
  return {
    title: `Apply decision: ${decision.title}`,
    description: decision.rationale?.trim() || null,
    task_type: "refactor",
    priority: "medium",
    status: "todo",
    acceptance_criteria: `- Implementation reflects the decision: "${decision.title}".\n- Decision rationale is documented and visible to reviewers.`,
  };
}

export function buildTaskTemplateFromEntity(
  entity: {
    id: string;
    name: string;
    description: string | null;
  },
): TaskTemplate {
  return {
    title: `Implement domain entity: ${entity.name}`,
    description: entity.description?.trim() || null,
    task_type: "database",
    priority: "medium",
    status: "todo",
    acceptance_criteria: `- Domain entity "${entity.name}" is modeled.\n- Entity is integrated with at least one API endpoint and one UI screen.`,
  };
}

export function buildTaskTemplateFromComponent(
  component: {
    id: string;
    name: string;
    type: string;
    purpose: string | null;
  },
): TaskTemplate {
  return {
    title: `Implement architecture component: ${component.name}`,
    description: component.purpose?.trim() || null,
    task_type:
      component.type === "frontend"
        ? "frontend"
        : component.type === "backend"
          ? "backend"
          : component.type === "database"
            ? "database"
            : "infrastructure",
    priority: "medium",
    status: "todo",
    acceptance_criteria: `- Component "${component.name}" (${component.type}) is implemented per the architecture.\n- Integration with adjacent components is verified.`,
  };
}

export function buildTaskTemplateFromEndpoint(
  endpoint: Pick<ApiEndpoint, "id" | "method" | "path" | "name" | "description" | "authentication_required">,
): TaskTemplate {
  return {
    title: `Implement API endpoint: ${endpoint.method} ${endpoint.path}`,
    description:
      endpoint.description?.trim() ||
      `Implement endpoint "${endpoint.name}" (${endpoint.method} ${endpoint.path}, auth ${endpoint.authentication_required ? "required" : "optional"}).`,
    task_type: "backend",
    priority: "high",
    status: "todo",
    acceptance_criteria: `- Endpoint ${endpoint.method} ${endpoint.path} is implemented.\n- Validation error path returns a 4xx response.\n- Happy path returns the documented success status.\n- Auth requirement (${endpoint.authentication_required ? "required" : "optional"}) is enforced.`,
  };
}

export function buildTaskTemplateFromScreen(
  screen: {
    id: string;
    name: string;
    screen_type: string;
    purpose: string | null;
    authentication_required: boolean;
  },
): TaskTemplate {
  return {
    title: `Implement UI screen: ${screen.name}`,
    description: screen.purpose?.trim() || null,
    task_type: "frontend",
    priority: "medium",
    status: "todo",
    acceptance_criteria: `- Screen "${screen.name}" (${screen.screen_type}) is implemented.\n- Auth requirement (${screen.authentication_required ? "required" : "optional"}) is respected.\n- Required states (loading, empty, error) are visible.`,
  };
}

function priorityFromRequirement(
  p: Requirement["priority"],
): Task["priority"] {
  switch (p) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    default:
      return "medium";
  }
}
