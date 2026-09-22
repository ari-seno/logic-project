import type { AiContextEntry } from "@/lib/ai/context";
import { bulletList, truncate } from "@/lib/ai/prompts/context-format";

const SYSTEM_PROMPT = `You are a senior delivery lead who turns a product spec into an actionable task backlog.

For each invocation, output ONLY a JSON object of this exact shape:
{
  "tasks": [
    {
      "title": string,               // 1..200 characters, imperative and specific, e.g. "Add loan repayment endpoint"
      "task_type": string,           // one of: feature, bug, refactor, database, backend, frontend, infrastructure, testing, documentation, security, other
      "priority": string,            // one of: low, medium, high, critical
      "estimated_effort": string|null, // one of: xs, s, m, l, xl, or null when unsure
      "description": string,         // 0..5000 characters, what has to be done
      "acceptance_criteria": string, // 0..10000 characters, how reviewers know it is done
      "implementation_notes": string,// 0..10000 characters, hints, files, or technical constraints
      "parent_title": string,        // exact title of another task in this output that contains this one, or "" for a top-level task
      "depends_on": [string],        // exact titles of tasks in this output that must finish first
      "links": [
        {
          "kind": string,            // one of: requirement, decision, entity, component, endpoint, screen
          "name": string             // the exact title or name of an existing artifact of that kind
        }
      ]
    }
  ]
}

Rules:
- Output 1..25 tasks. Prefer a small, coherent backlog over an exhaustive one.
- "task_type", "priority", and "estimated_effort" values must come from the allowed lists above; anything else is rejected.
- Order the tasks so that a task never appears before a task it depends_on or before the parent that contains it.
- "parent_title" and every entry of "depends_on" must exactly match the title of another task defined in this same output. Never reference anything else.
- Never make a task depend on itself, and never create a dependency cycle.
- "links.name" must exactly match an artifact listed in the supplied context: requirement titles, decision titles, entity names, architecture component names, endpoint names given as "METHOD /path", or screen names. Omit a link rather than inventing a name.
- Do not repeat tasks that already exist in the project.
- Ground the backlog in the supplied requirements, decisions, domain model, architecture, API contract, and UI design. Do NOT invent scope that was not provided.
- Do NOT wrap output in markdown fences. Output raw JSON only.`;

export type TasksPromptContext = {
  projectName: string;
  projectDescription: string | null;
  requirements: AiContextEntry[];
  decisions: AiContextEntry[];
  domains: AiContextEntry[];
  entities: AiContextEntry[];
  architectureComponents: AiContextEntry[];
  apiEndpoints: AiContextEntry[];
  uiScreens: AiContextEntry[];
  existingTasks: AiContextEntry[];
  userPrompt: string;
};


export function buildTasksUserPrompt(ctx: TasksPromptContext): string {
  const description = ctx.projectDescription
    ? truncate(ctx.projectDescription, 500)
    : "(no description)";

  return `Project: ${ctx.projectName}
Project description (truncated to 500 chars):
${description}

Requirements already captured (link with kind "requirement", do NOT invent new ones):
${bulletList(ctx.requirements)}

Decisions already captured (link with kind "decision", do NOT invent new ones):
${bulletList(ctx.decisions)}

Domain model already captured (link entities with kind "entity"):
${bulletList(ctx.entities.length > 0 ? ctx.entities : ctx.domains)}

Architecture components already captured (link with kind "component"):
${bulletList(ctx.architectureComponents)}

API endpoints already captured (link with kind "endpoint", using the exact "METHOD /path" text):
${bulletList(ctx.apiEndpoints)}

UI screens already captured (link with kind "screen"):
${bulletList(ctx.uiScreens)}

Existing task titles to AVOID duplicating:
${bulletList(ctx.existingTasks)}

User prompt / focus:
${truncate(ctx.userPrompt, 1500)}

Produce the JSON described in the system message.`;
}

export function buildTasksSystemPrompt(): string {
  return SYSTEM_PROMPT;
}
