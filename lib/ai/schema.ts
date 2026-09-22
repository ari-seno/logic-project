import { z } from "zod";

import {
  AI_SUGGESTION_STATUSES,
  AI_TEST_STATUSES,
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

export type AiRequirementItem = z.infer<typeof aiRequirementItemSchema>;
export type AiRequirementsResponse = z.infer<typeof aiRequirementsResponseSchema>;
export type AiDecisionItem = z.infer<typeof aiDecisionItemSchema>;
export type AiDecisionsResponse = z.infer<typeof aiDecisionsResponseSchema>;
export type AiErdAttributeItem = z.infer<typeof aiErdAttributeSchema>;
export type AiErdRelationshipItem = z.infer<typeof aiErdRelationshipSchema>;
export type AiErdEntityItem = z.infer<typeof aiErdEntitySchema>;
export type AiErdDomainItem = z.infer<typeof aiErdDomainItemSchema>;
export type AiErdResponse = z.infer<typeof aiErdResponseSchema>;

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
