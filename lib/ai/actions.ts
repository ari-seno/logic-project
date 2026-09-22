"use server";

import {
  applyArchitectureToProject,
  applyDecisionsToProject,
  applyErdToProject,
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
  buildDomainsSystemPrompt,
  buildDomainsUserPrompt,
} from "@/lib/ai/prompts/domains";
import {
  buildArchitectureSystemPrompt,
  buildArchitectureUserPrompt,
} from "@/lib/ai/prompts/architecture";
import {
  aiArchitectureResponseSchema,
  aiDecisionsResponseSchema,
  aiErdResponseSchema,
  aiRequirementsResponseSchema,
  flattenArchitectureResponse,
  type AiApplyResult,
  type AiArchitectureItem,
  type AiDecisionItem,
  type AiErdDomainItem,
  type AiRequirementItem,
  type SuggestResult,
} from "@/lib/ai/schema";

const REQUIREMENTS_SCHEMA_HINT =
  "Schema: { requirements: [ { title, type, priority, description } ] }, 1..15 items.";

const DECISIONS_SCHEMA_HINT =
  "Schema: { decisions: [ { title, context, decision, rationale } ] }, 1..15 items.";

const DOMAINS_SCHEMA_HINT =
  "Schema: { domains: [ { name, description, entities: [ { name, description, attributes: [ { name, data_type, is_required, is_primary_key, description } ], relationships: [ { target_entity, relationship_type, name, description } ] } ] } ] }, 1..8 domains.";

const ARCHITECTURE_SCHEMA_HINT =
  "Schema: { components: [ { name, type, description, depends_on: [ { target_component, description } ] } ], technologies: [ { name, category, description } ], decisions: [ { title, context, decision, rationale } ] }, up to 20 components, 20 technologies, 15 decisions.";

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

export type SuggestDomainsInput = {
  projectId: string;
  prompt: string;
};

export type ApplyDomainsInput = {
  suggestionId: string;
  indices: number[];
};

export type SuggestArchitectureInput = {
  projectId: string;
  prompt: string;
};

export type ApplyArchitectureInput = {
  suggestionId: string;
  indices: number[];
};

export type ApplyRequirementsResult = AiApplyResult;
export type ApplyDecisionsResult = AiApplyResult;
export type ApplyDomainsResult = AiApplyResult;
export type ApplyArchitectureResult = AiApplyResult;

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

export async function aiSuggestDomains(
  input: SuggestDomainsInput,
): Promise<SuggestResult<AiErdDomainItem>> {
  return runAiSuggest<AiErdDomainItem>(input, {
    stage: "domains",
    buildSystemPrompt: buildDomainsSystemPrompt,
    buildUserPrompt: (ctx, userPrompt) =>
      buildDomainsUserPrompt({
        projectName: ctx.projectName,
        projectDescription: ctx.projectDescription,
        requirementTitles: ctx.requirementTitles,
        decisionTitles: ctx.decisionTitles,
        existingDomainNames: ctx.domainNames,
        userPrompt,
      }),
    parse: (text) => {
      const raw = safeJsonParse(text);
      if (raw === null) return null;
      const parsed = aiErdResponseSchema.safeParse(raw);
      return parsed.success ? parsed.data.domains : null;
    },
    parseErrorMessage: DOMAINS_SCHEMA_HINT,
  });
}

export async function aiApplyDomains(
  input: ApplyDomainsInput,
): Promise<AiApplyResult> {
  return runAiApply<AiErdDomainItem>(input, {
    stage: "domains",
    apply: applyErdToProject,
  });
}

export async function aiSuggestArchitecture(
  input: SuggestArchitectureInput,
): Promise<SuggestResult<AiArchitectureItem>> {
  return runAiSuggest<AiArchitectureItem>(input, {
    stage: "architecture",
    buildSystemPrompt: buildArchitectureSystemPrompt,
    buildUserPrompt: (ctx, userPrompt) =>
      buildArchitectureUserPrompt({
        projectName: ctx.projectName,
        projectDescription: ctx.projectDescription,
        requirementTitles: ctx.requirementTitles,
        decisionTitles: ctx.decisionTitles,
        domainNames: ctx.domainNames,
        existingComponentNames: ctx.architectureComponentNames,
        existingTechnologyNames: ctx.architectureTechnologyNames,
        existingDecisionTitles: ctx.architectureDecisionTitles,
        userPrompt,
      }),
    parse: (text) => {
      const raw = safeJsonParse(text);
      if (raw === null) return null;
      const parsed = aiArchitectureResponseSchema.safeParse(raw);
      return parsed.success ? flattenArchitectureResponse(parsed.data) : null;
    },
    parseErrorMessage: ARCHITECTURE_SCHEMA_HINT,
  });
}

export async function aiApplyArchitecture(
  input: ApplyArchitectureInput,
): Promise<AiApplyResult> {
  return runAiApply<AiArchitectureItem>(input, {
    stage: "architecture",
    apply: applyArchitectureToProject,
  });
}
