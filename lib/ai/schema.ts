import { z } from "zod";

import {
  AI_SUGGESTION_STATUSES,
  AI_TEST_STATUSES,
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

export type AiRequirementItem = z.infer<typeof aiRequirementItemSchema>;
export type AiRequirementsResponse = z.infer<typeof aiRequirementsResponseSchema>;

export type SuggestSuccess = {
  ok: true;
  suggestionId: string;
  requirements: AiRequirementItem[];
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

export type SuggestResult = SuggestSuccess | SuggestFailure;
