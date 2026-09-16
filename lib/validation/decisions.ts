import { z } from "zod";

import { DECISION_STATUSES } from "@/lib/supabase/types";

const titleField = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(200, "Title must be 200 characters or fewer");

const contextField = z
  .string()
  .trim()
  .max(5000, "Context must be 5000 characters or fewer")
  .optional()
  .or(z.literal(""));

const decisionField = z
  .string()
  .trim()
  .min(1, "Decision is required")
  .max(2000, "Decision must be 2000 characters or fewer");

const rationaleField = z
  .string()
  .trim()
  .max(5000, "Rationale must be 5000 characters or fewer")
  .optional()
  .or(z.literal(""));

export const decisionInputSchema = z.object({
  title: titleField,
  context: contextField,
  decision: decisionField,
  rationale: rationaleField,
  status: z.enum(DECISION_STATUSES, {
    error: "Status must be proposed, accepted, or superseded",
  }),
});

export const decisionUpdateSchema = decisionInputSchema;

export type DecisionInput = z.infer<typeof decisionInputSchema>;
export type DecisionUpdateInput = z.infer<typeof decisionUpdateSchema>;

export type DecisionActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      "title" | "context" | "decision" | "rationale" | "status",
      string[]
    >
  >;
};
