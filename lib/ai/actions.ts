"use server";

import {
  applyApiBundleToProject,
  applyTasksBundleToProject,
  applyUiBundleToProject,
  applyUiDetailBundleToProject,
  applyArchitectureBundleToProject,
  applyDecisionsToProject,
  applyErdBundleToProject,
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
  buildApiSystemPrompt,
  buildApiUserPrompt,
} from "@/lib/ai/prompts/api";
import {
  buildTasksSystemPrompt,
  buildTasksUserPrompt,
} from "@/lib/ai/prompts/tasks";
import {
  buildUiSystemPrompt,
  buildUiUserPrompt,
} from "@/lib/ai/prompts/ui";
import {
  buildUiDetailSystemPrompt,
  buildUiDetailUserPrompt,
} from "@/lib/ai/prompts/ui-detail";
import {
  aiApiResponseSchema,
  aiArchitectureResponseSchema,
  aiDecisionsResponseSchema,
  aiErdResponseSchema,
  aiRequirementsResponseSchema,
  aiTasksResponseSchema,
  aiUiResponseSchema,
  aiUiDetailResponseSchema,
  flattenApiResponse,
  flattenArchitectureResponse,
  flattenUiResponse,
  flattenUiDetailResponse,
  type AiApiItem,
  type AiApplyResult,
  type AiArchitectureItem,
  type AiDecisionItem,
  type AiErdDomainItem,
  type AiRequirementItem,
  type AiTaskItem,
  type AiUiItem,
  type AiUiDetailItem,
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

const TASKS_SCHEMA_HINT =
  "Schema: { tasks: [ { title, task_type, priority, estimated_effort, description, acceptance_criteria, implementation_notes, parent_title, depends_on: [string], links: [ { kind, name } ] } ] }, 1..25 tasks.";

const API_SCHEMA_HINT =
  "Schema: { groups: [ { name, prefix, description } ], endpoints: [ { group_name, method, path, name, summary, description, authentication_required, parameters: [ { name, location, data_type, required, description, example } ], request_body: { content_type, description, schema, example } | null, responses: [ { status_code, content_type, description, schema, example } ], errors: [ { code, message, http_status, description } ], entities: [ { entity_name, role } ], requirement_titles: [ string ] } ] }, up to 20 groups, 25 endpoints.";

const UI_SCHEMA_HINT =
  "Schema: { components: [ { name, component_type, description, purpose, technology } ], screens: [ { name, route, screen_type, description, purpose, authentication_required, placements: [ { component_name, label, description, required, parent_label } ], entities: [ { entity_name, role } ], requirement_titles: [ string ] } ] }, up to 25 components, 25 screens.";

const UI_DETAIL_SCHEMA_HINT =
  "Schema: { screens: [ { screen_name, forms: [ { name, description, submit_label, success_behavior, fields: [ { name, label, field_type, required, placeholder, help_text, default_value } ] } ], states: [ { name, state_type, description, behavior } ], interactions: [ { name, trigger, action, description, endpoint_labels: [string] } ] } ], navigation: [ { name, label, route, description, parent_label, screen_names: [string] } ] }, up to 25 screens, 25 navigation items.";

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
        existing: ctx.requirements,
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
        existingDecisions: ctx.decisions,
        requirements: ctx.requirements,
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
        requirements: ctx.requirements,
        decisions: ctx.decisions,
        existingDomains: ctx.domains,
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
    apply: applyErdBundleToProject,
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
        requirements: ctx.requirements,
        decisions: ctx.decisions,
        domains: ctx.domains,
        existingComponents: ctx.architectureComponents,
        existingTechnologies: ctx.architectureTechnologies,
        existingDecisions: ctx.architectureDecisions,
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
    apply: applyArchitectureBundleToProject,
  });
}

export type SuggestApiInput = {
  projectId: string;
  prompt: string;
};

export type ApplyApiInput = {
  suggestionId: string;
  indices: number[];
};

export async function aiSuggestApi(
  input: SuggestApiInput,
): Promise<SuggestResult<AiApiItem>> {
  return runAiSuggest<AiApiItem>(input, {
    stage: "api",
    buildSystemPrompt: buildApiSystemPrompt,
    buildUserPrompt: (ctx, userPrompt) =>
      buildApiUserPrompt({
        projectName: ctx.projectName,
        projectDescription: ctx.projectDescription,
        requirements: ctx.requirements,
        decisions: ctx.decisions,
        domains: ctx.domains,
        entities: ctx.entities,
        existingGroups: ctx.apiGroups,
        existingEndpoints: ctx.apiEndpoints,
        userPrompt,
      }),
    parse: (text) => {
      const raw = safeJsonParse(text);
      if (raw === null) return null;
      const parsed = aiApiResponseSchema.safeParse(raw);
      return parsed.success ? flattenApiResponse(parsed.data) : null;
    },
    parseErrorMessage: API_SCHEMA_HINT,
  });
}

export async function aiApplyApi(input: ApplyApiInput): Promise<AiApplyResult> {
  return runAiApply<AiApiItem>(input, {
    stage: "api",
    apply: applyApiBundleToProject,
  });
}

export type SuggestUiInput = {
  projectId: string;
  prompt: string;
};

export type ApplyUiInput = {
  suggestionId: string;
  indices: number[];
};

export async function aiSuggestUi(
  input: SuggestUiInput,
): Promise<SuggestResult<AiUiItem>> {
  return runAiSuggest<AiUiItem>(input, {
    stage: "ui",
    buildSystemPrompt: buildUiSystemPrompt,
    buildUserPrompt: (ctx, userPrompt) =>
      buildUiUserPrompt({
        projectName: ctx.projectName,
        projectDescription: ctx.projectDescription,
        requirements: ctx.requirements,
        decisions: ctx.decisions,
        domains: ctx.domains,
        entities: ctx.entities,
        apiGroups: ctx.apiGroups,
        apiEndpoints: ctx.apiEndpoints,
        existingScreens: ctx.uiScreens,
        existingComponents: ctx.uiComponents,
        userPrompt,
      }),
    parse: (text) => {
      const raw = safeJsonParse(text);
      if (raw === null) return null;
      const parsed = aiUiResponseSchema.safeParse(raw);
      return parsed.success ? flattenUiResponse(parsed.data) : null;
    },
    parseErrorMessage: UI_SCHEMA_HINT,
  });
}

export async function aiApplyUi(input: ApplyUiInput): Promise<AiApplyResult> {
  return runAiApply<AiUiItem>(input, {
    stage: "ui",
    apply: applyUiBundleToProject,
  });
}

export type SuggestUiDetailInput = {
  projectId: string;
  prompt: string;
};

export type ApplyUiDetailInput = {
  suggestionId: string;
  indices: number[];
};

export async function aiSuggestUiDetail(
  input: SuggestUiDetailInput,
): Promise<SuggestResult<AiUiDetailItem>> {
  return runAiSuggest<AiUiDetailItem>(input, {
    stage: "ui-detail",
    buildSystemPrompt: buildUiDetailSystemPrompt,
    buildUserPrompt: (ctx, userPrompt) =>
      buildUiDetailUserPrompt({
        projectName: ctx.projectName,
        projectDescription: ctx.projectDescription,
        requirements: ctx.requirements,
        decisions: ctx.decisions,
        apiEndpoints: ctx.apiEndpoints,
        existingScreens: ctx.uiScreens,
        existingNavigation: ctx.uiNavigation,
        userPrompt,
      }),
    parse: (text) => {
      const raw = safeJsonParse(text);
      if (raw === null) return null;
      const parsed = aiUiDetailResponseSchema.safeParse(raw);
      return parsed.success ? flattenUiDetailResponse(parsed.data) : null;
    },
    parseErrorMessage: UI_DETAIL_SCHEMA_HINT,
  });
}

export async function aiApplyUiDetail(
  input: ApplyUiDetailInput,
): Promise<AiApplyResult> {
  return runAiApply<AiUiDetailItem>(input, {
    stage: "ui-detail",
    apply: applyUiDetailBundleToProject,
  });
}

export type SuggestTasksInput = {
  projectId: string;
  prompt: string;
};

export type ApplyTasksInput = {
  suggestionId: string;
  indices: number[];
};

export async function aiSuggestTasks(
  input: SuggestTasksInput,
): Promise<SuggestResult<AiTaskItem>> {
  return runAiSuggest<AiTaskItem>(input, {
    stage: "tasks",
    buildSystemPrompt: buildTasksSystemPrompt,
    buildUserPrompt: (ctx, userPrompt) =>
      buildTasksUserPrompt({
        projectName: ctx.projectName,
        projectDescription: ctx.projectDescription,
        requirements: ctx.requirements,
        decisions: ctx.decisions,
        domains: ctx.domains,
        entities: ctx.entities,
        architectureComponents: ctx.architectureComponents,
        apiEndpoints: ctx.apiEndpoints,
        uiScreens: ctx.uiScreens,
        existingTasks: ctx.tasks,
        userPrompt,
      }),
    parse: (text) => {
      const raw = safeJsonParse(text);
      if (raw === null) return null;
      const parsed = aiTasksResponseSchema.safeParse(raw);
      return parsed.success ? parsed.data.tasks : null;
    },
    parseErrorMessage: TASKS_SCHEMA_HINT,
  });
}

export async function aiApplyTasks(
  input: ApplyTasksInput,
): Promise<AiApplyResult> {
  return runAiApply<AiTaskItem>(input, {
    stage: "tasks",
    apply: applyTasksBundleToProject,
  });
}
