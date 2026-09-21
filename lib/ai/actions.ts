"use server";

import {
  applyDecisionsToProject,
  applyRequirementsToProject,
} from "@/lib/ai/apply";
import { runAiApply, runAiSuggest, safeJsonParse } from "@/lib/ai/suggest";
import {
  buildRequirementsSystemPrompt,
  buildRequirementsUserPrompt,
} from "@/lib/ai/prompts/requirements";
import {
  buildDecisionsSystemPrompt,
  buildDecisionsUserPrompt,
} from "@/lib/ai/prompts/decisions";
import {
  aiDecisionsResponseSchema,
  aiRequirementsResponseSchema,
  type AiApplyResult,
  type AiDecisionItem,
  type AiRequirementItem,
  type SuggestResult,
} from "@/lib/ai/schema";

const REQUIREMENTS_SCHEMA_HINT =
  "Schema: { requirements: [ { title, type, priority, description } ] }, 1..15 items.";

const DECISIONS_SCHEMA_HINT =
  "Schema: { decisions: [ { title, context, decision, rationale } ] }, 1..15 items.";

export type SuggestRequirementsInput = {
  projectId: string;
  prompt: string;
};

export type ApplyRequirementsInput = {
  suggestionId: string;
  indices: number[];
};

export type SuggestDecisionsInput = {
  projectId: string;
  prompt: string;
};

export type ApplyDecisionsInput = {
  suggestionId: string;
  indices: number[];
};

export type ApplyRequirementsResult = AiApplyResult;
export type ApplyDecisionsResult = AiApplyResult;

export async function aiSuggestRequirements(
  input: SuggestRequirementsInput,
): Promise<SuggestResult<AiRequirementItem>> {
  return runAiSuggest<AiRequirementItem>(input, {
    stage: "requirements",
    buildSystemPrompt: buildRequirementsSystemPrompt,
    buildUserPrompt: (ctx, userPrompt) =>
      buildRequirementsUserPrompt({
        projectName: ctx.projectName,
        projectDescription: ctx.projectDescription,
        existingTitles: ctx.requirementTitles,
        userPrompt,
      }),
    parse: (text) => {
      const raw = safeJsonParse(text);
      if (raw === null) return null;
      const parsed = aiRequirementsResponseSchema.safeParse(raw);
      return parsed.success ? parsed.data.requirements : null;
    },
    parseErrorMessage: REQUIREMENTS_SCHEMA_HINT,
  });
}

export async function aiApplyRequirements(
  input: ApplyRequirementsInput,
): Promise<AiApplyResult> {
  return runAiApply<AiRequirementItem>(input, {
    stage: "requirements",
    apply: applyRequirementsToProject,
  });
}

export async function aiSuggestDecisions(
  input: SuggestDecisionsInput,
): Promise<SuggestResult<AiDecisionItem>> {
  return runAiSuggest<AiDecisionItem>(input, {
    stage: "decisions",
    buildSystemPrompt: buildDecisionsSystemPrompt,
    buildUserPrompt: (ctx, userPrompt) =>
      buildDecisionsUserPrompt({
        projectName: ctx.projectName,
        projectDescription: ctx.projectDescription,
        existingDecisionTitles: ctx.decisionTitles,
        requirementTitles: ctx.requirementTitles,
        userPrompt,
      }),
    parse: (text) => {
      const raw = safeJsonParse(text);
      if (raw === null) return null;
      const parsed = aiDecisionsResponseSchema.safeParse(raw);
      return parsed.success ? parsed.data.decisions : null;
    },
    parseErrorMessage: DECISIONS_SCHEMA_HINT,
  });
}

export async function aiApplyDecisions(
  input: ApplyDecisionsInput,
): Promise<AiApplyResult> {
  return runAiApply<AiDecisionItem>(input, {
    stage: "decisions",
    apply: applyDecisionsToProject,
  });
}
