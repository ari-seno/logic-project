import { z } from "zod";

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

export const entityInputSchema = z.object({
  name: nameField,
  description: descriptionField,
});

export const entityUpdateSchema = entityInputSchema;

export type EntityInput = z.infer<typeof entityInputSchema>;
export type EntityUpdateInput = z.infer<typeof entityUpdateSchema>;

export type EntityActionState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "description", string[]>>;
};
