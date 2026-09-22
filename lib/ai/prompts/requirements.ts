import {
  AI_SUGGESTION_STATUSES,
  type AiSuggestionStatus,
} from "@/lib/supabase/types";
import type { AiContextEntry } from "@/lib/ai/context";

const SYSTEM_PROMPT = `You are a senior product analyst who writes precise, testable requirements.

For each invocation, output ONLY a JSON object of this exact shape:
{
  "requirements": [
    {
      "title": string,                   // 3..120 characters, sentence case
      "type": "functional" | "non_functional" | "business",
      "priority": "must" | "should" | "could" | "wont",   // MoSCoW
      "description": string              // 10..2000 characters, acceptance-style
    },
    ...
  ]
}

Rules:
- Output 1..15 items total. Prioritise breadth over duplication.
- "title" must be unique across the array.
- Use "functional" for product behaviour, "non_functional" for quality (perf, security, accessibility, observability, etc.), "business" for revenue / policy / regulation.
- Priority maps to MoSCoW: "must" = release-blocker, "should" = next iteration, "could" = later, "wont" = out-of-scope but worth recording.
- Description must be actionable and reviewable — state the trigger and the outcome, not just a label.
- If the project already has requirements, do NOT repeat or synonym them. Cover gaps or restate deliberately.
- Do NOT wrap output in markdown fences. Output raw JSON only.`;

export type RequirementsPromptContext = {
  projectName: string;
  projectDescription: string | null;
  existing: AiContextEntry[];
  userPrompt: string;
};

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}

function describeEntry(entry: AiContextEntry): string {
  if (!entry.description) return `- ${entry.name}`;
  return `- ${entry.name}\n  ${truncate(entry.description, 300)}`;
}

function bulletList(entries: AiContextEntry[]): string {
  if (entries.length === 0) return "(none yet)";
  return entries.slice(0, 60).map(describeEntry).join("\n");
}

export function buildRequirementsUserPrompt(
  ctx: RequirementsPromptContext,
): string {
  const description = ctx.projectDescription
    ? truncate(ctx.projectDescription, 500)
    : "(no description)";

  return `Project: ${ctx.projectName}
Project description (truncated to 500 chars):
${description}

Existing requirements to AVOID duplicating (title + summary):
${bulletList(ctx.existing)}

User prompt / focus:
${truncate(ctx.userPrompt, 1500)}

Produce the JSON described in the system message.`;
}

export function buildRequirementsSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function parseAiSuggestionStatus(value: string): AiSuggestionStatus {
  if ((AI_SUGGESTION_STATUSES as readonly string[]).includes(value)) {
    return value as AiSuggestionStatus;
  }
  return "pending";
}
