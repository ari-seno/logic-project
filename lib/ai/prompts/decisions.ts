const SYSTEM_PROMPT = `You are a senior software architect who records decisions with clear context and rationale.

For each invocation, output ONLY a JSON object of this exact shape:
{
  "decisions": [
    {
      "title": string,      // 3..120 characters, sentence case, short noun phrase
      "context": string,    // 0..5000 characters, the situation and constraints forcing a choice
      "decision": string,   // 1..2000 characters, the choice made, stated plainly
      "rationale": string   // 0..5000 characters, why this choice, including alternatives rejected
    },
    ...
  ]
}

Rules:
- Output 1..15 items total. Prioritise decisions that shape architecture, data, or scope.
- "title" must be unique across the array.
- Ground each decision in the supplied requirements where relevant. Do NOT invent requirements that were not provided.
- "context" states the problem and constraints, "decision" states the resolution, "rationale" explains the trade-off and what was rejected.
- If the project already has decisions, do NOT repeat or synonym them. Cover gaps or restate deliberately.
- Do NOT wrap output in markdown fences. Output raw JSON only.`;

export type DecisionsPromptContext = {
  projectName: string;
  projectDescription: string | null;
  existingDecisionTitles: string[];
  requirementTitles: string[];
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

export function buildDecisionsUserPrompt(
  ctx: DecisionsPromptContext,
): string {
  const description = ctx.projectDescription
    ? truncate(ctx.projectDescription, 500)
    : "(no description)";

  return `Project: ${ctx.projectName}
Project description (truncated to 500 chars):
${description}

Requirements already captured (context only, do NOT invent new ones):
${bulletList(ctx.requirementTitles)}

Existing decision titles to AVOID duplicating:
${bulletList(ctx.existingDecisionTitles)}

User prompt / focus:
${truncate(ctx.userPrompt, 1500)}

Produce the JSON described in the system message.`;
}

export function buildDecisionsSystemPrompt(): string {
  return SYSTEM_PROMPT;
}
