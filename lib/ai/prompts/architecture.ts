const SYSTEM_PROMPT = `You are a senior software architect who sketches the technical architecture of a software project.

For each invocation, output ONLY a JSON object of this exact shape:
{
  "components": [
    {
      "name": string,            // 1..120 characters, e.g. "Payments API"
      "type": string,            // one of: frontend, backend, database, authentication, storage, external_service, infrastructure, worker, queue, cache, other
      "description": string,     // 0..5000 characters, what this component is responsible for
      "depends_on": [
        {
          "target_component": string, // exact name of another component in this output or an existing component
          "description": string       // 0..5000 characters, why the dependency exists
        }
      ]
    }
  ],
  "technologies": [
    {
      "name": string,        // 1..120 characters, e.g. "PostgreSQL"
      "category": string,    // one of: language, framework, database, authentication, hosting, infrastructure, testing, package, external_service, other
      "description": string  // 0..5000 characters, where and why it is used
    }
  ],
  "decisions": [
    {
      "title": string,       // 3..120 characters, e.g. "Use Postgres as the primary datastore"
      "context": string,     // 0..5000 characters, the forces at play
      "decision": string,    // 1..2000 characters, what was decided
      "rationale": string    // 0..5000 characters, why this option won
    }
  ]
}

Rules:
- Output 0..20 components, 0..20 technologies, and 0..15 decisions; at least one item in total.
- "type" and "category" values must come from the allowed lists above; anything else is rejected.
- "depends_on" is directed: "A depends_on B" means A calls, reads from, or otherwise relies on B. Never list a component as depending on itself.
- "target_component" must be the exact name of a component defined in this same output, or of a component that already exists in the project. Never reference anything else.
- Architecture decisions describe irreversible technical choices (datastore, auth strategy, hosting model, integration style). Keep them distinct from product decisions.
- Do not repeat components, technologies, or decisions that already exist in the project.
- Ground the architecture in the supplied requirements, decisions, and domain model. Do NOT invent requirements that were not provided.
- Do NOT wrap output in markdown fences. Output raw JSON only.`;

export type ArchitecturePromptContext = {
  projectName: string;
  projectDescription: string | null;
  requirementTitles: string[];
  decisionTitles: string[];
  domainNames: string[];
  existingComponentNames: string[];
  existingTechnologyNames: string[];
  existingDecisionTitles: string[];
  userPrompt: string;
};

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}

function bulletList(titles: string[]): string {
  if (titles.length === 0) return "(none yet)";
  return titles
    .slice(0, 60)
    .map((title, i) => `${i + 1}. ${title}`)
    .join("\n");
}

export function buildArchitectureUserPrompt(
  ctx: ArchitecturePromptContext,
): string {
  const description = ctx.projectDescription
    ? truncate(ctx.projectDescription, 500)
    : "(no description)";

  return `Project: ${ctx.projectName}
Project description (truncated to 500 chars):
${description}

Requirements already captured (context only, do NOT invent new ones):
${bulletList(ctx.requirementTitles)}

Decisions already captured (context only, do NOT invent new ones):
${bulletList(ctx.decisionTitles)}

Domain model already captured (context only):
${bulletList(ctx.domainNames)}

Existing component names to AVOID duplicating:
${bulletList(ctx.existingComponentNames)}

Existing technology names to AVOID duplicating:
${bulletList(ctx.existingTechnologyNames)}

Existing architecture decision titles to AVOID duplicating:
${bulletList(ctx.existingDecisionTitles)}

User prompt / focus:
${truncate(ctx.userPrompt, 1500)}

Produce the JSON described in the system message.`;
}

export function buildArchitectureSystemPrompt(): string {
  return SYSTEM_PROMPT;
}
