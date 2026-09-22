import { z } from "zod";

import {
  AI_SUGGESTION_STATUSES,
  AI_TEST_STATUSES,
  API_ENDPOINT_ENTITY_ROLES,
  API_HTTP_METHODS,
  API_PARAMETER_DATA_TYPES,
  API_PARAMETER_LOCATIONS,
  ARCHITECTURE_COMPONENT_TYPES,
  ARCHITECTURE_TECHNOLOGY_CATEGORIES,
  ENTITY_DATA_TYPES,
  RELATIONSHIP_TYPES,
} from "@/lib/supabase/types";

export const aiTestStatusSchema = z.enum(AI_TEST_STATUSES);
export const aiSuggestionStatusSchema = z.enum(AI_SUGGESTION_STATUSES);

export const aiRequirementTypeSchema = z.enum([
  "functional",
  "non_functional",
  "business",
]);

export const aiRequirementPrioritySchema = z.enum([
  "must",
  "should",
  "could",
  "wont",
]);

export const aiRequirementItemSchema = z.object({
  title: z.string().trim().min(3).max(120),
  type: aiRequirementTypeSchema,
  priority: aiRequirementPrioritySchema,
  description: z.string().trim().min(10).max(2000),
});

export const aiRequirementsResponseSchema = z.object({
  requirements: z.array(aiRequirementItemSchema).min(1).max(15),
});

export const aiDecisionItemSchema = z.object({
  title: z.string().trim().min(3).max(120),
  context: z.string().trim().max(5000),
  decision: z.string().trim().min(1).max(2000),
  rationale: z.string().trim().max(5000),
});

export const aiDecisionsResponseSchema = z.object({
  decisions: z.array(aiDecisionItemSchema).min(1).max(15),
});

const aiErdNameSchema = z.string().trim().min(1).max(120);
const aiErdDescriptionSchema = z.string().trim().max(5000).default("");

export const aiErdAttributeSchema = z.object({
  name: aiErdNameSchema,
  data_type: z.enum(ENTITY_DATA_TYPES),
  is_required: z.boolean().default(false),
  is_primary_key: z.boolean().default(false),
  description: aiErdDescriptionSchema,
});

export const aiErdRelationshipSchema = z.object({
  target_entity: aiErdNameSchema,
  relationship_type: z.enum(RELATIONSHIP_TYPES),
  name: z.string().trim().max(200).default(""),
  description: aiErdDescriptionSchema,
});

export const aiErdEntitySchema = z.object({
  name: aiErdNameSchema,
  description: aiErdDescriptionSchema,
  attributes: z.array(aiErdAttributeSchema).min(1).max(30),
  relationships: z.array(aiErdRelationshipSchema).max(20).default([]),
});

export const aiErdDomainItemSchema = z.object({
  name: aiErdNameSchema,
  description: aiErdDescriptionSchema,
  entities: z.array(aiErdEntitySchema).min(1).max(15),
});

export const aiErdResponseSchema = z.object({
  domains: z.array(aiErdDomainItemSchema).min(1).max(8),
});

const aiArchitectureNameSchema = z.string().trim().min(1).max(120);
const aiArchitectureDescriptionSchema = z.string().trim().max(5000).default("");

export const aiArchitectureDependencySchema = z.object({
  target_component: aiArchitectureNameSchema,
  description: aiArchitectureDescriptionSchema,
});

export const aiArchitectureComponentSchema = z.object({
  name: aiArchitectureNameSchema,
  type: z.enum(ARCHITECTURE_COMPONENT_TYPES),
  description: aiArchitectureDescriptionSchema,
  depends_on: z.array(aiArchitectureDependencySchema).max(20).default([]),
});

export const aiArchitectureTechnologySchema = z.object({
  name: aiArchitectureNameSchema,
  category: z.enum(ARCHITECTURE_TECHNOLOGY_CATEGORIES),
  description: aiArchitectureDescriptionSchema,
});

export const aiArchitectureDecisionSchema = z.object({
  title: z.string().trim().min(3).max(120),
  context: z.string().trim().max(5000),
  decision: z.string().trim().min(1).max(2000),
  rationale: z.string().trim().max(5000),
});

export const aiArchitectureResponseSchema = z
  .object({
    components: z.array(aiArchitectureComponentSchema).max(20).default([]),
    technologies: z.array(aiArchitectureTechnologySchema).max(20).default([]),
    decisions: z.array(aiArchitectureDecisionSchema).max(15).default([]),
  })
  .refine(
    (value) =>
      value.components.length + value.technologies.length + value.decisions.length >
      0,
    { message: "At least one component, technology, or decision is required." },
  );

export type AiRequirementItem = z.infer<typeof aiRequirementItemSchema>;
export type AiRequirementsResponse = z.infer<typeof aiRequirementsResponseSchema>;
export type AiDecisionItem = z.infer<typeof aiDecisionItemSchema>;
export type AiDecisionsResponse = z.infer<typeof aiDecisionsResponseSchema>;
export type AiErdAttributeItem = z.infer<typeof aiErdAttributeSchema>;
export type AiErdRelationshipItem = z.infer<typeof aiErdRelationshipSchema>;
export type AiErdEntityItem = z.infer<typeof aiErdEntitySchema>;
export type AiErdDomainItem = z.infer<typeof aiErdDomainItemSchema>;
export type AiErdResponse = z.infer<typeof aiErdResponseSchema>;
export type AiArchitectureComponentItem = z.infer<
  typeof aiArchitectureComponentSchema
>;
export type AiArchitectureTechnologyItem = z.infer<
  typeof aiArchitectureTechnologySchema
>;
export type AiArchitectureDecisionItem = z.infer<
  typeof aiArchitectureDecisionSchema
>;
export type AiArchitectureDependencyItem = z.infer<
  typeof aiArchitectureDependencySchema
>;
export type AiArchitectureResponse = z.infer<typeof aiArchitectureResponseSchema>;

export type AiArchitectureItem =
  | ({ kind: "component" } & AiArchitectureComponentItem)
  | ({ kind: "technology" } & AiArchitectureTechnologyItem)
  | ({ kind: "decision" } & AiArchitectureDecisionItem);

export function flattenArchitectureResponse(
  response: AiArchitectureResponse,
): AiArchitectureItem[] {
  return [
    ...response.components.map(
      (item): AiArchitectureItem => ({ kind: "component", ...item }),
    ),
    ...response.technologies.map(
      (item): AiArchitectureItem => ({ kind: "technology", ...item }),
    ),
    ...response.decisions.map(
      (item): AiArchitectureItem => ({ kind: "decision", ...item }),
    ),
  ];
}

const aiApiNameSchema = z.string().trim().min(1).max(120);
const aiApiDescriptionSchema = z.string().trim().max(5000).default("");
const aiApiDetailSchema = z.string().trim().max(2000).default("");
const aiApiExampleTextSchema = z.string().trim().max(1000).default("");

const aiApiJsonSchema = z
  .union([z.record(z.string(), z.unknown()), z.array(z.unknown()), z.null()])
  .default(null);

export const aiApiGroupItemSchema = z.object({
  name: aiApiNameSchema,
  prefix: z.string().trim().max(200).default(""),
  description: aiApiDescriptionSchema,
});

export const aiApiParameterSchema = z.object({
  name: aiApiNameSchema,
  location: z.enum(API_PARAMETER_LOCATIONS),
  data_type: z.enum(API_PARAMETER_DATA_TYPES),
  required: z.boolean().default(false),
  description: aiApiDetailSchema,
  example: aiApiExampleTextSchema,
});

export const aiApiRequestBodySchema = z.object({
  content_type: aiApiNameSchema,
  description: aiApiDetailSchema,
  schema: aiApiJsonSchema,
  example: aiApiJsonSchema,
});

export const aiApiResponseItemSchema = z.object({
  status_code: z.number().int().min(100).max(599),
  content_type: z.string().trim().max(200).default(""),
  description: aiApiDetailSchema,
  schema: aiApiJsonSchema,
  example: aiApiJsonSchema,
});

export const aiApiErrorItemSchema = z.object({
  code: aiApiNameSchema,
  message: z.string().trim().min(1).max(500),
  http_status: z.number().int().min(100).max(599).nullish().default(null),
  description: aiApiDetailSchema,
});

export const aiApiEntityLinkSchema = z.object({
  entity_name: aiApiNameSchema,
  role: z.enum(API_ENDPOINT_ENTITY_ROLES),
});

export const aiApiEndpointItemSchema = z.object({
  group_name: z.string().trim().max(120).default(""),
  method: z.enum(API_HTTP_METHODS),
  path: z.string().trim().min(1).max(500),
  name: aiApiNameSchema,
  summary: z.string().trim().max(500).default(""),
  description: aiApiDescriptionSchema,
  authentication_required: z.boolean().default(true),
  parameters: z.array(aiApiParameterSchema).max(20).default([]),
  request_body: aiApiRequestBodySchema.nullish().default(null),
  responses: z.array(aiApiResponseItemSchema).max(10).default([]),
  errors: z.array(aiApiErrorItemSchema).max(10).default([]),
  entities: z.array(aiApiEntityLinkSchema).max(10).default([]),
  requirement_titles: z
    .array(z.string().trim().min(1).max(200))
    .max(10)
    .default([]),
});

export const aiApiResponseSchema = z
  .object({
    groups: z.array(aiApiGroupItemSchema).max(20).default([]),
    endpoints: z.array(aiApiEndpointItemSchema).max(25).default([]),
  })
  .refine(
    (value) => value.groups.length + value.endpoints.length > 0,
    { message: "At least one group or endpoint is required." },
  );

export type AiApiGroupItem = z.infer<typeof aiApiGroupItemSchema>;
export type AiApiParameterItem = z.infer<typeof aiApiParameterSchema>;
export type AiApiRequestBodyItem = z.infer<typeof aiApiRequestBodySchema>;
export type AiApiResponseItem = z.infer<typeof aiApiResponseItemSchema>;
export type AiApiErrorItem = z.infer<typeof aiApiErrorItemSchema>;
export type AiApiEntityLinkItem = z.infer<typeof aiApiEntityLinkSchema>;
export type AiApiEndpointItem = z.infer<typeof aiApiEndpointItemSchema>;
export type AiApiResponse = z.infer<typeof aiApiResponseSchema>;

export type AiApiItem =
  | ({ kind: "group" } & AiApiGroupItem)
  | ({ kind: "endpoint" } & AiApiEndpointItem);

export function flattenApiResponse(response: AiApiResponse): AiApiItem[] {
  return [
    ...response.groups.map((item): AiApiItem => ({ kind: "group", ...item })),
    ...response.endpoints.map(
      (item): AiApiItem => ({ kind: "endpoint", ...item }),
    ),
  ];
}

export type SuggestSuccess<TItem> = {
  ok: true;
  suggestionId: string;
  items: TItem[];
  model: string;
  provider: string;
  usage: {
    promptTokens: number | null;
    completionTokens: number | null;
    durationMs: number;
  };
};

export type SuggestFailure = {
  ok: false;
  code:
    | "ai_setup_required"
    | "ollama_error"
    | "ollama_auth_error"
    | "ollama_unreachable"
    | "ollama_rate_limit"
    | "zod_retry_failed"
    | "credential_test_failed"
    | "unknown";
  message: string;
};

export type SuggestResult<TItem> = SuggestSuccess<TItem> | SuggestFailure;

export type AiApplyCreated = { index: number; id: string; title: string };
export type AiApplySkipped = {
  index: number;
  title: string;
  reason: "duplicate" | "invalid";
};

export type AiApplyResult =
  | { ok: true; created: AiApplyCreated[]; skipped: AiApplySkipped[] }
  | { ok: false; error: string };
