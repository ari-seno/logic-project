import { z } from "zod";

import {
  ARCHITECTURE_TECHNOLOGY_CATEGORIES,
  type ArchitectureTechnologyCategory,
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

export const architectureTechnologyInputSchema = z.object({
  name: nameField,
  description: descriptionField,
  category: z.enum(ARCHITECTURE_TECHNOLOGY_CATEGORIES, {
    error: "Choose a supported technology category",
  }),
});

export const architectureTechnologyUpdateSchema = architectureTechnologyInputSchema;

export type ArchitectureTechnologyInput = z.infer<
  typeof architectureTechnologyInputSchema
>;
export type ArchitectureTechnologyUpdateInput = z.infer<
  typeof architectureTechnologyUpdateSchema
>;

export type ArchitectureTechnologyActionState = {
  error?: string;
  fieldErrors?: Partial<
    Record<"name" | "description" | "category", string[]>
  >;
};

export type ArchitectureTechnologyCategoryValue = ArchitectureTechnologyCategory;
