import { z } from "zod";

import {
  ARCHITECTURE_DECISION_STATUSES,
  type ArchitectureDecisionStatus,
} from "@/lib/supabase/types";

const titleField = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(200, "Title must be 200 characters or fewer");

const bodyField = z
  .string()
  .trim()
  .max(5000, "Field must be 5000 characters or fewer")
  .optional()
  .or(z.literal(""));

const decisionField = z
  .string()
  .trim()
  .min(1, "Decision is required")
  .max(5000, "Decision must be 5000 characters or fewer");

export const architectureDecisionInputSchema = z.object({
  title: titleField,
  context: bodyField,
  decision: decisionField,
  rationale: bodyField,
  status: z.enum(ARCHITECTURE_DECISION_STATUSES, {
    error: "Choose a supported decision status",
  }),
});

export const architectureDecisionUpdateSchema = z.object({
  title: titleField,
  context: bodyField,
  decision: decisionField,
  rationale: bodyField,
  status: z.enum(ARCHITECTURE_DECISION_STATUSES, {
    error: "Choose a supported decision status",
  }),
});

export type ArchitectureDecisionInput = z.infer<
  typeof architectureDecisionInputSchema
>;
export type ArchitectureDecisionUpdateInput = z.infer<
  typeof architectureDecisionUpdateSchema
>;

export type ArchitectureDecisionActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<"title" | "context" | "decision" | "rationale" | "status", string[]>
  >;
};

export type ArchitectureDecisionStatusValue = ArchitectureDecisionStatus;
