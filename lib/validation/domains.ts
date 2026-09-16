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

export const domainInputSchema = z.object({
  name: nameField,
  description: descriptionField,
});

export const domainUpdateSchema = domainInputSchema;

export type DomainInput = z.infer<typeof domainInputSchema>;
export type DomainUpdateInput = z.infer<typeof domainUpdateSchema>;

export type DomainActionState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "description", string[]>>;
};
