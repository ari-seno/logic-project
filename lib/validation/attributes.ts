import { z } from "zod";

import { ENTITY_DATA_TYPES } from "@/lib/supabase/types";

const nameField = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(200, "Name must be 200 characters or fewer");

const descriptionField = z
  .string()
  .trim()
  .max(5000, "Description must be 5000 characters or fewer")
  .optional()
  .or(z.literal(""));

const defaultValueField = z
  .string()
  .trim()
  .max(500, "Default value must be 500 characters or fewer")
  .optional()
  .or(z.literal(""));

export const attributeInputSchema = z.object({
  name: nameField,
  data_type: z.enum(ENTITY_DATA_TYPES, {
    error: "Choose a supported data type",
  }),
  is_required: z.boolean(),
  is_primary_key: z.boolean(),
  default_value: defaultValueField,
  description: descriptionField,
});

export const attributeUpdateSchema = attributeInputSchema;

export type AttributeInput = z.infer<typeof attributeInputSchema>;
export type AttributeUpdateInput = z.infer<typeof attributeUpdateSchema>;

export type AttributeActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      "name" | "data_type" | "default_value" | "description",
      string[]
    >
  >;
};
