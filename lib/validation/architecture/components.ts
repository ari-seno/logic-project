import { z } from "zod";

import {
  ARCHITECTURE_COMPONENT_TYPES,
  type ArchitectureComponentType,
} from "@/lib/supabase/types";

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

export const architectureComponentInputSchema = z.object({
  name: nameField,
  description: descriptionField,
  type: z.enum(ARCHITECTURE_COMPONENT_TYPES, {
    error: "Choose a supported component type",
  }),
});

export const architectureComponentUpdateSchema = architectureComponentInputSchema;

export type ArchitectureComponentInput = z.infer<
  typeof architectureComponentInputSchema
>;
export type ArchitectureComponentUpdateInput = z.infer<
  typeof architectureComponentUpdateSchema
>;

export type ArchitectureComponentActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<"name" | "description" | "type", string[]>
  >;
};

export type ArchitectureComponentTypeValue = ArchitectureComponentType;
