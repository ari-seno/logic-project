import { z } from "zod";

import { RELATIONSHIP_TYPES } from "@/lib/supabase/types";

const nameField = z
  .string()
  .trim()
  .max(200, "Name must be 200 characters or fewer")
  .optional()
  .or(z.literal(""));

const descriptionField = z
  .string()
  .trim()
  .max(5000, "Description must be 5000 characters or fewer")
  .optional()
  .or(z.literal(""));

export const relationshipInputSchema = z.object({
  source_entity_id: z.string().uuid("Source entity is required"),
  target_entity_id: z.string().uuid("Target entity is required"),
  relationship_type: z.enum(RELATIONSHIP_TYPES, {
    error: "Choose a supported relationship type",
  }),
  name: nameField,
  description: descriptionField,
});

export const relationshipUpdateSchema = relationshipInputSchema;

export type RelationshipInput = z.infer<typeof relationshipInputSchema>;
export type RelationshipUpdateInput = z.infer<typeof relationshipUpdateSchema>;

export type RelationshipActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      | "source_entity_id"
      | "target_entity_id"
      | "relationship_type"
      | "name"
      | "description",
      string[]
    >
  >;
};
