import { z } from "zod";

import {
  REQUIREMENT_PRIORITIES,
  REQUIREMENT_STATUSES,
  REQUIREMENT_TYPES,
} from "@/lib/supabase/types";

const titleField = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(200, "Title must be 200 characters or fewer");

const descriptionField = z
  .string()
  .trim()
  .max(5000, "Description must be 5000 characters or fewer")
  .optional()
  .or(z.literal(""));

export const requirementInputSchema = z.object({
  title: titleField,
  description: descriptionField,
  type: z.enum(REQUIREMENT_TYPES, {
    error: "Type must be functional or non_functional",
  }),
  status: z.enum(REQUIREMENT_STATUSES, {
    error: "Status must be draft, approved, rejected, or implemented",
  }),
  priority: z.enum(REQUIREMENT_PRIORITIES, {
    error: "Priority must be low, medium, high, or critical",
  }),
});

export const requirementUpdateSchema = requirementInputSchema;

export type RequirementInput = z.infer<typeof requirementInputSchema>;
export type RequirementUpdateInput = z.infer<typeof requirementUpdateSchema>;

export type RequirementActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      "title" | "description" | "type" | "status" | "priority",
      string[]
    >
  >;
};
